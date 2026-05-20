import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  familyId: string | null;
  role: 'caretaker' | 'parent';
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setFamilyId: (id: string) => void;
  firebaseReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  setFamilyId: () => {},
  firebaseReady: false,
});

const GOOGLE_WEB_CLIENT_ID = '1062110941505-0vkp4hdeg0ctcu4mm7b8k49rjp58bemu.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        signInWithCredential(auth, credential).catch(console.error);
      }
    }
  }, [response]);

  // Listen to Firebase auth state
  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Load user doc from Firestore
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        let familyId: string | null = null;
        let role: 'caretaker' | 'parent' = 'parent';

        if (snap.exists()) {
          const data = snap.data();
          familyId = data.familyId ?? null;
          role = data.role ?? 'parent';
        } else {
          // First login — create user document
          await setDoc(userRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            familyId: null,
            role: 'parent',
            createdAt: serverTimestamp(),
          });
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          familyId,
          role,
        });
      } catch {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          familyId: null,
          role: 'parent',
        });
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseConfigured) return;
    await promptAsync();
  };

  const signOut = async () => {
    if (firebaseConfigured) await firebaseSignOut(auth);
    setUser(null);
  };

  const setFamilyId = (id: string) => {
    setUser((prev) => (prev ? { ...prev, familyId: id } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        setFamilyId,
        firebaseReady: firebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
