import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBnUI9DhIxvZx3ZdPPcBS23qkpxI9qPSxs',
  authDomain: 'gen-lang-client-0027135215.firebaseapp.com',
  projectId: 'gen-lang-client-0027135215',
  storageBucket: 'gen-lang-client-0027135215.firebasestorage.app',
  messagingSenderId: '1062110941505',
  appId: '1:1062110941505:web:6d461fff7a2720fa20d1c0',
};

export const firebaseConfigured = true;

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = getFirestore(app);
