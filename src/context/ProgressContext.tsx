import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc, onSnapshot, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../config/firebase';
import { ProgressState, ProgressAction, CompletedActivity, ChildProfile } from '../types';
import activitiesData from '../data/activities.json';
import { Activity } from '../types';

const STORAGE_KEY = '@little_bloom_progress';

const initialState: ProgressState = {
  completedActivities: [],
  emotionalPoints: 0,
  intellectualPoints: 0,
  streak: 0,
  lastActiveDate: null,
  childProfile: {
    name: 'Your Child',
    birthDate: new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString(),
    avatarEmoji: '🌸',
  },
  weeklyGoal: 5,
};

function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'COMPLETE_ACTIVITY': {
      const activity = (activitiesData.activities as Activity[]).find(
        (a) => a.id === action.payload.activityId
      );
      if (!activity) return state;
      if (state.completedActivities.some((c) => c.activityId === action.payload.activityId))
        return state;

      const emotionalDelta = activity.milestoneCategory === 'emotional' ? activity.points : 0;
      const intellectualDelta = activity.milestoneCategory === 'intellectual' ? activity.points : 0;

      return {
        ...state,
        completedActivities: [...state.completedActivities, action.payload],
        emotionalPoints: state.emotionalPoints + emotionalDelta,
        intellectualPoints: state.intellectualPoints + intellectualDelta,
        lastActiveDate: new Date().toISOString(),
        streak: state.streak + 1,
      };
    }

    case 'UNCOMPLETE_ACTIVITY': {
      const activity = (activitiesData.activities as Activity[]).find(
        (a) => a.id === action.payload.activityId
      );
      if (!activity) return state;

      const emotionalDelta = activity.milestoneCategory === 'emotional' ? activity.points : 0;
      const intellectualDelta = activity.milestoneCategory === 'intellectual' ? activity.points : 0;

      return {
        ...state,
        completedActivities: state.completedActivities.filter(
          (c) => c.activityId !== action.payload.activityId
        ),
        emotionalPoints: Math.max(0, state.emotionalPoints - emotionalDelta),
        intellectualPoints: Math.max(0, state.intellectualPoints - intellectualDelta),
      };
    }

    case 'UPDATE_CHILD_PROFILE':
      return { ...state, childProfile: { ...state.childProfile, ...action.payload } };

    case 'SET_WEEKLY_GOAL':
      return { ...state, weeklyGoal: action.payload };

    case 'HYDRATE':
      return action.payload;

    default:
      return state;
  }
}

interface ProgressContextValue {
  state: ProgressState;
  completeActivity: (activityId: string) => void;
  uncompleteActivity: (activityId: string) => void;
  isCompleted: (activityId: string) => boolean;
  updateChildProfile: (profile: Partial<ChildProfile>) => void;
  completedToday: number;
  completedThisWeek: number;
  isSyncing: boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  familyId: string | null;
}

export function ProgressProvider({ children, familyId }: ProgressProviderProps) {
  const [state, dispatch] = useReducer(progressReducer, initialState);
  const isSyncing = useRef(false);
  const isRemoteUpdate = useRef(false);

  // Load from AsyncStorage initially
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  // Firestore real-time listener (when familyId is set and Firebase is configured)
  useEffect(() => {
    if (!familyId || !firebaseConfigured) return;

    const ref = doc(db, 'families', familyId, 'progress', 'main');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ProgressState & { updatedAt: unknown; updatedBy: unknown };
        const { updatedAt, updatedBy, ...progressData } = data;
        isRemoteUpdate.current = true;
        dispatch({ type: 'HYDRATE', payload: progressData as ProgressState });
      }
    });

    return unsub;
  }, [familyId]);

  // Persist to AsyncStorage on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Sync to Firestore (debounced 800ms)
  useEffect(() => {
    if (!familyId || !firebaseConfigured) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    isSyncing.current = true;
    const timer = setTimeout(() => {
      const ref = doc(db, 'families', familyId, 'progress', 'main');
      setDoc(ref, { ...state, updatedAt: serverTimestamp() }, { merge: true })
        .catch(console.error)
        .finally(() => { isSyncing.current = false; });
    }, 800);

    return () => clearTimeout(timer);
  }, [state, familyId]);

  const completeActivity = (activityId: string) =>
    dispatch({ type: 'COMPLETE_ACTIVITY', payload: { activityId, completedAt: new Date().toISOString() } });

  const uncompleteActivity = (activityId: string) =>
    dispatch({ type: 'UNCOMPLETE_ACTIVITY', payload: { activityId } });

  const isCompleted = (activityId: string) =>
    state.completedActivities.some((c) => c.activityId === activityId);

  const updateChildProfile = (profile: Partial<ChildProfile>) =>
    dispatch({ type: 'UPDATE_CHILD_PROFILE', payload: profile });

  const todayStr = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 86400000;

  const completedToday = state.completedActivities.filter(
    (c) => new Date(c.completedAt).toDateString() === todayStr
  ).length;

  const completedThisWeek = state.completedActivities.filter(
    (c) => new Date(c.completedAt).getTime() >= weekAgo
  ).length;

  return (
    <ProgressContext.Provider
      value={{
        state,
        completeActivity,
        uncompleteActivity,
        isCompleted,
        updateChildProfile,
        completedToday,
        completedThisWeek,
        isSyncing: isSyncing.current,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
