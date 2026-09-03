import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ReflectionInteraction, ChatMessage, ReflectionMode } from '../types';
import { db, handleFirestoreError, OperationType, isFirebaseActive } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { stripUndefined, sanitizeText } from '../lib/sanitizer';

interface JournalContextType {
  interactions: ReflectionInteraction[];
  activeInteraction: ReflectionInteraction | null;
  activeInteractionId: string | null;
  setActiveInteractionId: (id: string | null) => void;
  createNewInteraction: (promptText: string, mode: ReflectionMode, customTitle?: string) => Promise<ReflectionInteraction>;
  sendFollowupMessage: (interactionId: string, text: string) => Promise<void>;
  deleteInteraction: (interactionId: string) => Promise<void>;
  generateSummary: (interactionId: string) => Promise<void>;
  isLoadingAI: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  clearError: () => void;
  retryLastAction: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'gemini_journal_entries_';

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<ReflectionInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);

  const storageKey = user ? `${LOCAL_STORAGE_PREFIX}${user.uid}` : null;

  // Load interactions from local backup or Firestore
  const loadLocalInteractions = useCallback((): ReflectionInteraction[] => {
    if (!storageKey) return [];
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read from local storage:', e);
      return [];
    }
  }, [storageKey]);

  const saveLocalInteractions = useCallback((list: ReflectionInteraction[]) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not persist to local storage:', e);
    }
  }, [storageKey]);

  // Sync interactions with Firestore / Local Storage
  useEffect(() => {
    if (!user) {
      setInteractions([]);
      setActiveInteractionId(null);
      return;
    }

    const localData = loadLocalInteractions();
    if (localData.length > 0) {
      setInteractions(localData);
      if (!activeInteractionId) {
        setActiveInteractionId(localData[0].id);
      }
    }

    // If real Firebase Firestore is active and not a pure mock demo
    if (db && isFirebaseActive && !user.isDemo) {
      const userInteractionsPath = `users/${user.uid}/interactions`;
      try {
        const q = query(collection(db, userInteractionsPath), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const firestoreItems: ReflectionInteraction[] = [];
            snapshot.forEach((docSnapshot) => {
              firestoreItems.push(docSnapshot.data() as ReflectionInteraction);
            });
            if (firestoreItems.length > 0) {
              setInteractions(firestoreItems);
              saveLocalInteractions(firestoreItems);
            }
          },
          (error) => {
            console.warn('[Firestore onSnapshot Notice - Falling back to local mirror]:', error.message);
          }
        );
        return () => unsubscribe();
      } catch (err) {
        console.warn('Firestore snapshot setup warning:', err);
      }
    }
  }, [user, storageKey, loadLocalInteractions, saveLocalInteractions]);

  // Active interaction finder
  const activeInteraction = interactions.find((i) => i.id === activeInteractionId) || null;

  // Helper to persist single interaction
  const persistInteraction = async (interaction: ReflectionInteraction) => {
    if (!user) return;
    setIsSaving(true);
    const cleaned = stripUndefined(interaction);

    // 1. Optimistic Local Save
    setInteractions((prev) => {
      const exists = prev.some((item) => item.id === cleaned.id);
      const updated = exists
        ? prev.map((item) => (item.id === cleaned.id ? cleaned : item))
        : [cleaned, ...prev];
      saveLocalInteractions(updated);
      return updated;
    });

    // 2. Cloud Firestore Save
    if (db && isFirebaseActive && !user.isDemo) {
      const path = `users/${user.uid}/interactions`;
      try {
        await setDoc(doc(db, path, cleaned.id), cleaned);
      } catch (err: any) {
        console.warn('[Firestore Save Error, retained locally]:', err);
        // Note: we do NOT wipe user state, we let them know and keep local persistence
      }
    }
    setIsSaving(false);
  };

  // 1. Create New Reflection / Journal Entry
  const createNewInteraction = async (
    promptText: string,
    mode: ReflectionMode,
    customTitle?: string
  ): Promise<ReflectionInteraction> => {
    if (!user) {
      throw new Error('User must be authenticated to create a reflection.');
    }

    const sanitizedPrompt = sanitizeText(promptText);
    if (!sanitizedPrompt) {
      throw new Error('Prompt cannot be empty.');
    }

    setIsLoadingAI(true);
    setErrorMessage(null);

    const interactionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const title = customTitle || sanitizedPrompt.slice(0, 50) + (sanitizedPrompt.length > 50 ? '...' : '');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      content: sanitizedPrompt,
      timestamp: now,
    };

    // Preliminary interaction object
    const newEntry: ReflectionInteraction = {
      id: interactionId,
      userId: user.uid,
      title,
      mode,
      messages: [userMessage],
      tags: [mode, 'journal'],
      createdAt: now,
      updatedAt: now,
    };

    // Save initial user entry immediately to prevent data loss
    await persistInteraction(newEntry);
    setActiveInteractionId(interactionId);

    const executeAiCall = async () => {
      try {
        const response = await fetch('/api/gemini/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ sender: 'user', content: sanitizedPrompt }],
            mode,
            context: title,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `AI reflection service error (${response.status})`);
        }

        const data = await response.json();
        const geminiMessage: ChatMessage = {
          id: `msg_${Date.now()}_gemini`,
          sender: 'gemini',
          content: data.text,
          timestamp: new Date().toISOString(),
          model: data.modelUsed,
        };

        const completedEntry: ReflectionInteraction = {
          ...newEntry,
          messages: [userMessage, geminiMessage],
          updatedAt: new Date().toISOString(),
        };

        await persistInteraction(completedEntry);
      } catch (err: any) {
        console.error('[Create Interaction Error]:', err);
        setErrorMessage(`Gemini response could not be generated: ${err.message}. Your journal prompt was saved.`);
        setLastFailedAction(() => () => executeAiCall());
      } finally {
        setIsLoadingAI(false);
      }
    };

    await executeAiCall();
    return newEntry;
  };

  // 2. Multi-turn Followup Conversation
  const sendFollowupMessage = async (interactionId: string, text: string) => {
    const target = interactions.find((i) => i.id === interactionId);
    if (!target || !user) return;

    const sanitized = sanitizeText(text);
    if (!sanitized) return;

    setIsLoadingAI(true);
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      content: sanitized,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...target.messages, userMsg];
    const intermediateEntry: ReflectionInteraction = {
      ...target,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically save user message immediately
    await persistInteraction(intermediateEntry);

    const executeAiFollowup = async () => {
      try {
        const response = await fetch('/api/gemini/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            mode: target.mode,
            context: target.title,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `AI followup service error (${response.status})`);
        }

        const data = await response.json();
        const geminiMsg: ChatMessage = {
          id: `msg_${Date.now()}_gemini`,
          sender: 'gemini',
          content: data.text,
          timestamp: new Date().toISOString(),
          model: data.modelUsed,
        };

        const finalEntry: ReflectionInteraction = {
          ...intermediateEntry,
          messages: [...updatedMessages, geminiMsg],
          updatedAt: new Date().toISOString(),
        };

        await persistInteraction(finalEntry);
      } catch (err: any) {
        console.error('[Send Followup Error]:', err);
        setErrorMessage(`Followup reply failed: ${err.message}. Your message is saved.`);
        setLastFailedAction(() => () => executeAiFollowup());
      } finally {
        setIsLoadingAI(false);
      }
    };

    await executeAiFollowup();
  };

  // 3. Generate Summary & Synthesis
  const generateSummary = async (interactionId: string) => {
    const target = interactions.find((i) => i.id === interactionId);
    if (!target) return;

    setIsLoadingAI(true);
    setErrorMessage(null);

    const fullContent = target.messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: target.title,
          text: fullContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const updated: ReflectionInteraction = {
        ...target,
        summary: data.summary,
        updatedAt: new Date().toISOString(),
      };

      await persistInteraction(updated);
    } catch (err: any) {
      console.error('[Generate Summary Error]:', err);
      setErrorMessage(`Summary generation failed: ${err.message}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // 4. Delete Reflection
  const deleteInteraction = async (interactionId: string) => {
    if (!user) return;

    setInteractions((prev) => {
      const filtered = prev.filter((i) => i.id !== interactionId);
      saveLocalInteractions(filtered);
      return filtered;
    });

    if (activeInteractionId === interactionId) {
      const remaining = interactions.filter((i) => i.id !== interactionId);
      setActiveInteractionId(remaining.length > 0 ? remaining[0].id : null);
    }

    if (db && isFirebaseActive && !user.isDemo) {
      const path = `users/${user.uid}/interactions`;
      try {
        await deleteDoc(doc(db, path, interactionId));
      } catch (err) {
        console.warn('Could not delete from Firestore:', err);
      }
    }
  };

  const retryLastAction = async () => {
    if (lastFailedAction) {
      const action = lastFailedAction;
      setLastFailedAction(null);
      setErrorMessage(null);
      await action();
    }
  };

  return (
    <JournalContext.Provider
      value={{
        interactions,
        activeInteraction,
        activeInteractionId,
        setActiveInteractionId,
        createNewInteraction,
        sendFollowupMessage,
        deleteInteraction,
        generateSummary,
        isLoadingAI,
        isSaving,
        errorMessage,
        clearError: () => setErrorMessage(null),
        retryLastAction,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = (): JournalContextType => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
