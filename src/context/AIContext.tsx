import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityFeedback,
  ActivityFeedbackType,
  AIGeneratedActivity,
  ChatMessage,
  Activity,
} from '../types';
import { generateAdaptiveActivity, generateCustomActivity } from '../services/adaptiveEngine';
import { streamClaude, callClaude, hasApiKey } from '../services/anthropic';
import { useProgress } from './ProgressContext';
import activitiesData from '../data/activities.json';

const FEEDBACKS_KEY = '@lb_feedbacks';
const GENERATED_KEY = '@lb_generated_activities';
const CHAT_KEY = '@lb_chat_history';

export interface AIContextValue {
  // Feedback
  feedbacks: ActivityFeedback[];
  addFeedback: (activityId: string, type: ActivityFeedbackType) => void;
  getFeedback: (activityId: string) => ActivityFeedbackType | null;

  // Adaptive activity generation
  generatedActivities: AIGeneratedActivity[];
  isGenerating: boolean;
  generateError: string | null;
  generateActivity: () => Promise<void>;
  dismissGenerated: (id: string) => void;

  // On-demand custom activity generation
  generateCustomActivity: (prompt: string) => Promise<void>;
  isCustomGenerating: boolean;
  customGenerateError: string | null;

  // Streaming chat
  messages: ChatMessage[];
  streamingContent: string;   // live text from the current streaming response
  isChatLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;

  apiKeyMissing: boolean;
}

const AIContext = createContext<AIContextValue | null>(null);

function buildAgentSystemPrompt(
  state: ReturnType<typeof useProgress>['state'],
  feedbacks: ActivityFeedback[]
): string {
  const { childProfile, completedActivities, emotionalPoints, intellectualPoints, streak } = state;
  const activities = activitiesData.activities as Activity[];

  const recentDone = completedActivities.slice(-4).map((c) => {
    const a = activities.find((ac) => ac.id === c.activityId);
    return a ? a.title : c.activityId;
  });

  const recentFeedback = feedbacks.slice(-5).map((f) => {
    const a = activities.find((ac) => ac.id === f.activityId);
    return `${a?.title ?? f.activityId} → ${f.feedback}`;
  });

  return `You are Bloom 🌸, a warm and knowledgeable AI parenting assistant inside the Little Bloom child development app.

CHILD PROFILE:
- Name: ${childProfile.name}
- Age: approximately 3 years old
- Emotional development: ${emotionalPoints} points
- Intellectual development: ${intellectualPoints} points
- Activity streak: ${streak} days
- Recent completed activities: ${recentDone.join(', ') || 'none yet'}
- Parent feedback on recent activities: ${recentFeedback.join('; ') || 'none recorded'}

YOUR ROLE:
- Give specific, immediately actionable advice for whatever the parent is dealing with
- Acknowledge the parent's situation with warmth before suggesting anything
- Keep every response under 120 words
- Use simple, friendly language — not clinical or overly formal
- Reference ${childProfile.name} by name when it feels natural
- When suggesting an activity, be specific: name the materials and one clear first step
- For behavioural situations (tantrums, aggression, not sharing), lead with a calming technique
- For health concerns, recommend consulting a paediatrician — never diagnose
- Be encouraging and non-judgmental — parenting a 3-year-old is genuinely hard`;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const { state } = useProgress();

  const [feedbacks, setFeedbacks] = useState<ActivityFeedback[]>([]);
  const [generatedActivities, setGeneratedActivities] = useState<AIGeneratedActivity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isCustomGenerating, setIsCustomGenerating] = useState(false);
  const [customGenerateError, setCustomGenerateError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Track in-flight stream so we can abort it on unmount
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FEEDBACKS_KEY),
      AsyncStorage.getItem(GENERATED_KEY),
      AsyncStorage.getItem(CHAT_KEY),
    ]).then(([fb, gen, chat]) => {
      if (fb)   { try { setFeedbacks(JSON.parse(fb)); }            catch {} }
      if (gen)  { try { setGeneratedActivities(JSON.parse(gen)); } catch {} }
      if (chat) { try { setMessages(JSON.parse(chat)); }           catch {} }
    });

    return () => { abortRef.current?.abort(); };
  }, []);

  // ── Persistence helpers ───────────────────────────────────────────────────────
  const persistGenerated = (next: AIGeneratedActivity[]) => {
    setGeneratedActivities(next);
    AsyncStorage.setItem(GENERATED_KEY, JSON.stringify(next));
  };

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(next));
  };

  // ── Feedback ──────────────────────────────────────────────────────────────────
  const addFeedback = useCallback((activityId: string, type: ActivityFeedbackType) => {
    setFeedbacks((prev) => {
      const filtered = prev.filter((f) => f.activityId !== activityId);
      const next = [...filtered, { activityId, feedback: type, timestamp: new Date().toISOString() }];
      AsyncStorage.setItem(FEEDBACKS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getFeedback = useCallback(
    (activityId: string): ActivityFeedbackType | null =>
      feedbacks.find((f) => f.activityId === activityId)?.feedback ?? null,
    [feedbacks]
  );

  // ── Adaptive generation ───────────────────────────────────────────────────────
  const generateActivity = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const existingIds = [
        ...(activitiesData.activities as Activity[]).map((a) => a.id),
        ...generatedActivities.map((a) => a.id),
      ];
      const activity = await generateAdaptiveActivity(state, feedbacks, existingIds);
      persistGenerated([activity, ...generatedActivities].slice(0, 10));
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, state, feedbacks, generatedActivities]);

  // ── On-demand custom generation ───────────────────────────────────────────────
  const generateCustomActivityFn = useCallback(async (prompt: string) => {
    if (isCustomGenerating || !prompt.trim()) return;
    setIsCustomGenerating(true);
    setCustomGenerateError(null);
    try {
      const existingIds = [
        ...(activitiesData.activities as Activity[]).map((a) => a.id),
        ...generatedActivities.map((a) => a.id),
      ];
      const activity = await generateCustomActivity(prompt.trim(), state, feedbacks, existingIds);
      persistGenerated([activity, ...generatedActivities].slice(0, 10));
    } catch (e) {
      setCustomGenerateError(e instanceof Error ? e.message : 'Could not generate. Try again.');
    } finally {
      setIsCustomGenerating(false);
    }
  }, [isCustomGenerating, state, feedbacks, generatedActivities]);

  const dismissGenerated = useCallback((id: string) => {
    setGeneratedActivities((prev) => {
      const next = prev.filter((a) => a.id !== id);
      AsyncStorage.setItem(GENERATED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Streaming chat ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (isChatLoading || !text.trim()) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const withUser = [...messages, userMsg];
    persistMessages(withUser);
    setIsChatLoading(true);
    setStreamingContent('');

    let accumulated = '';

    try {
      const systemPrompt = buildAgentSystemPrompt(state, feedbacks);
      const history = withUser.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      accumulated = await streamClaude({
        system: systemPrompt,
        messages: history,
        maxTokens: 350,
        temperature: 0.75,
        signal: abort.signal,
        onChunk: (chunk) => {
          // For real streaming, chunk is a delta — accumulate
          // For typewriter fallback, chunk is the accumulated string so far
          accumulated = chunk.startsWith(accumulated.slice(0, 10)) && chunk.length >= accumulated.length
            ? chunk   // typewriter path — already accumulated
            : accumulated + chunk;  // streaming path — append delta
          setStreamingContent(accumulated);
        },
      });

      if (!abort.signal.aborted) {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: accumulated,
          timestamp: new Date().toISOString(),
        };
        persistMessages([...withUser, assistantMsg]);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // user navigated away

      const detail = e instanceof Error ? e.message : String(e);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble connecting right now. (${detail})`,
        timestamp: new Date().toISOString(),
      };
      persistMessages([...withUser, errorMsg]);
    } finally {
      setStreamingContent('');
      setIsChatLoading(false);
    }
  }, [isChatLoading, messages, state, feedbacks]);

  const clearChat = useCallback(() => persistMessages([]), []);

  return (
    <AIContext.Provider
      value={{
        feedbacks,
        addFeedback,
        getFeedback,
        generatedActivities,
        isGenerating,
        generateError,
        generateActivity,
        dismissGenerated,
        generateCustomActivity: generateCustomActivityFn,
        isCustomGenerating,
        customGenerateError,
        messages,
        streamingContent,
        isChatLoading,
        sendMessage,
        clearChat,
        apiKeyMissing: !hasApiKey(),
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used inside AIProvider');
  return ctx;
}
