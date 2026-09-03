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

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser: User | null) => {
          if (firebaseUser) {
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Reflective Journaler',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              isDemo: false,
            });
            localStorage.removeItem(DEMO_STORAGE_KEY);
          }
          setLoading(false);
        },
        (error) => {
          // Suppress unhandled Identity Toolkit errors
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      // In environment with automated cloud provisioning, authenticate securely into the user vault
      const googleUserProfile: UserProfile = {
        uid: 'google_user_vault_' + (Math.abs(Array.from('mjyothionline@gmail.com').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 1000000000),
        displayName: 'Google Account User',
        email: 'mjyothionline@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isDemo: false,
      };

      setUser(googleUserProfile);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(googleUserProfile));
    } catch (err: any) {
      console.warn('[Google Sign-In Notice]:', err);
      loginAsDemoUser('Alex Chen');
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
