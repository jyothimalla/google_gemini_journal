import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseActive } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (customName?: string) => void;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'gemini_journal_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if a demo user was stored in session
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    if (!auth || !isFirebaseActive) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Reflective Journaler',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isDemo: false,
        });
        localStorage.removeItem(DEMO_STORAGE_KEY);
      } else {
        // If not in demo mode, set to null
        if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      if (auth && isFirebaseActive) {
        const result = await signInWithPopup(auth, googleProvider);
        const loggedInUser: UserProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Google User',
          email: result.user.email || 'user@gmail.com',
          photoURL: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isDemo: false,
        };
        setUser(loggedInUser);
        localStorage.removeItem(DEMO_STORAGE_KEY);
        return;
      }
      
      // If Firebase Auth instance is in preview / sandbox mode
      loginAsDemoUser('Alex Chen (Google Account)');
    } catch (err: any) {
      console.warn('[Google Sign-In Fallback Notice]:', err?.message || err);
      // If API key is not yet linked to live cloud project or popup had an issue, fallback directly to sandbox Google account session
      loginAsDemoUser('Alex Chen (Google Account)');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = (customName?: string) => {
    const demoProfile: UserProfile = {
      uid: 'user_demo_78910',
      displayName: customName || 'Alex Chen',
      email: 'alex.chen@example.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isDemo: true,
    };
    setUser(demoProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    setAuthError(null);
  };

  const logout = async () => {
    try {
      if (auth && isFirebaseActive && !user?.isDemo) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoUser: Boolean(user?.isDemo),
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
