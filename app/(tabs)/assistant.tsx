import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../src/constants/theme';
import { useAI } from '../../src/context/AIContext';
import { useProgress } from '../../src/context/ProgressContext';
import AIActivityCard from '../../src/components/AIActivityCard';

type Tab = 'chat' | 'suggested';

const QUICK_PROMPTS = [
  { label: '😤 Tantrum help', text: 'She is having a lot of tantrums today. What can I do right now to help her calm down?' },
  { label: '🌧️ Indoor idea', text: "It's raining outside. Give me a fun indoor activity we can do in the next 20 minutes." },
  { label: '😴 Bedtime routine', text: 'Bedtime is really hard lately. Can you suggest a calming wind-down routine?' },
  { label: '📈 What to work on', text: 'Based on the progress so far, what developmental area should we focus on this week?' },
];

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.delay(600),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingBubble}>
      <View style={styles.bloomAvatar}>
        <Text style={styles.bloomAvatarText}>🌸</Text>
      </View>
      <View style={styles.typingDots}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
          />
        ))}
      </View>
    </View>
  );
}

function ActivitySkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonEmoji} />
        <View style={styles.skeletonTitleWrap}>
          <View style={[styles.skeletonLine, { width: '65%' }]} />
          <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: '90%', marginTop: 12 }]} />
      <View style={[styles.skeletonLine, { width: '75%', marginTop: 6 }]} />
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonPill, { width: 60 }]} />
        <View style={[styles.skeletonPill, { width: 80 }]} />
        <View style={[styles.skeletonPill, { width: 50 }]} />
      </View>
    </Animated.View>
  );
}

export default function AssistantScreen() {
  const {
    messages,
    streamingContent,
    isChatLoading,
    sendMessage,
    clearChat,
    generatedActivities,
    isGenerating,
    generateError,
    generateActivity,
    dismissGenerated,
    generateCustomActivity,
    isCustomGenerating,
    customGenerateError,
    apiKeyMissing,
  } = useAI();
  const { state } = useProgress();
  const params = useLocalSearchParams<{ pending?: string; tab?: string }>();

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [inputText, setInputText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const pendingSent = useRef(false);

  // Auto-switch tab if navigated with ?tab=suggested
  useEffect(() => {
    if (params.tab === 'suggested') setActiveTab('suggested');
  }, [params.tab]);

  // Auto-send a pending message passed from another screen
  useEffect(() => {
    if (params.pending && !pendingSent.current && !isChatLoading) {
      pendingSent.current = true;
      sendMessage(params.pending);
    }
  }, [params.pending]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isChatLoading, streamingContent, activeTab]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isChatLoading) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleQuickPrompt = async (text: string) => {
    if (isChatLoading) return;
    await sendMessage(text);
  };

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim() || isCustomGenerating) return;
    setCustomPrompt('');
    await generateCustomActivity(customPrompt);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🌸</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Bloom</Text>
            <Text style={styles.headerSubtitle}>AI Parenting Assistant</Text>
          </View>
        </View>
        {activeTab === 'chat' && messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons name="chatbubble-outline" size={15} color={activeTab === 'chat' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggested' && styles.tabActive]}
          onPress={() => setActiveTab('suggested')}
        >
          <Ionicons name="sparkles-outline" size={15} color={activeTab === 'suggested' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'suggested' && styles.tabTextActive]}>
            For You {generatedActivities.length > 0 ? `(${generatedActivities.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {apiKeyMissing && (
        <View style={styles.apiKeyBanner}>
          <Ionicons name="warning-outline" size={16} color={Colors.warning} />
          <Text style={styles.apiKeyBannerText}>
            Add <Text style={{ fontWeight: '700' }}>EXPO_PUBLIC_GEMINI_API_KEY</Text> to your .env file to enable AI features.
          </Text>
        </View>
      )}

      {/* ─── CHAT TAB ─────────────────────────────────── */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome message */}
            {messages.length === 0 && !isChatLoading && (
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeEmoji}>🌸</Text>
                <Text style={styles.welcomeTitle}>Hi! I'm Bloom</Text>
                <Text style={styles.welcomeSubtitle}>
                  I know {state.childProfile.name}'s development journey. Ask me anything — activities, behaviours, routines, milestones.
                </Text>
              </View>
            )}

            {/* Quick prompt chips — show when chat is empty */}
            {messages.length === 0 && !isChatLoading && (
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={styles.quickChip}
                    onPress={() => handleQuickPrompt(p.text)}
                    disabled={isChatLoading || apiKeyMissing}
                  >
                    <Text style={styles.quickChipText}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.messageRow, msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant]}
              >
                {msg.role === 'assistant' && (
                  <View style={styles.bloomAvatar}>
                    <Text style={styles.bloomAvatarText}>🌸</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                  ]}
                >
                  <Text style={[styles.messageText, msg.role === 'user' && styles.messageTextUser]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {/* Live streaming bubble */}
            {isChatLoading && streamingContent.length > 0 && (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View style={styles.bloomAvatar}>
                  <Text style={styles.bloomAvatarText}>🌸</Text>
                </View>
                <View style={[styles.messageBubble, styles.bubbleAssistant, styles.bubbleStreaming]}>
                  <Text style={styles.messageText}>{streamingContent}</Text>
                  <View style={styles.streamingCursor} />
                </View>
              </View>
            )}

            {/* Typing indicator (before first chunk arrives) */}
            {isChatLoading && streamingContent.length === 0 && <TypingIndicator />}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything about parenting..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!apiKeyMissing}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isChatLoading || apiKeyMissing) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isChatLoading || apiKeyMissing}
            >
              {isChatLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ─── SUGGESTED TAB ────────────────────────────── */}
      {activeTab === 'suggested' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.suggestedContent} showsVerticalScrollIndicator={false}>
          {/* Custom request card */}
          <View style={styles.customCard}>
            <Text style={styles.customCardTitle}>✨ Custom Activity Request</Text>
            <Text style={styles.customCardSubtitle}>
              Describe what you need and Bloom will create a tailored activity instantly.
            </Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                placeholder={'e.g. "5-min quiet activity while I\'m on a call"'}
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={300}
                editable={!apiKeyMissing && !isCustomGenerating}
              />
              <TouchableOpacity
                style={[styles.customSendBtn, (!customPrompt.trim() || isCustomGenerating || apiKeyMissing) && styles.sendBtnDisabled]}
                onPress={handleCustomGenerate}
                disabled={!customPrompt.trim() || isCustomGenerating || apiKeyMissing}
              >
                {isCustomGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            {customGenerateError && (
              <Text style={styles.customError}>{customGenerateError}</Text>
            )}
          </View>

          {/* Adaptive generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, (isGenerating || apiKeyMissing) && styles.generateBtnDisabled]}
            onPress={generateActivity}
            disabled={isGenerating || apiKeyMissing}
            activeOpacity={0.85}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateBtnText}>Analysing {state.childProfile.name}'s progress...</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>Auto-Generate for {state.childProfile.name}</Text>
              </>
            )}
          </TouchableOpacity>

          {generateError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{generateError}</Text>
            </View>
          )}

          {/* Skeleton while custom generating */}
          {isCustomGenerating && <ActivitySkeleton />}

          {generatedActivities.length === 0 && !isGenerating && !isCustomGenerating && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyTitle}>No suggestions yet</Text>
              <Text style={styles.emptySubtitle}>
                Type a specific request above, or tap Auto-Generate and Bloom will analyse {state.childProfile.name}'s progress.
              </Text>
            </View>
          )}

          {generatedActivities.map((activity) => (
            <AIActivityCard
              key={activity.id}
              activity={activity}
              onDismiss={() => dismissGenerated(activity.id)}
            />
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerAvatarText: { fontSize: 22 },
  headerTitle: { ...Typography.h4, color: Colors.text },
  headerSubtitle: { ...Typography.bodySmall, color: Colors.textMuted },
  clearBtn: { padding: 6 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  // API key banner
  apiKeyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentYellowLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentYellow,
  },
  apiKeyBannerText: { ...Typography.bodySmall, color: '#7A5C00', flex: 1 },

  // Chat
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  welcomeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  welcomeEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  welcomeTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.xs },
  welcomeSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    justifyContent: 'center',
  },
  quickChip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  quickChipText: { ...Typography.bodySmall, color: Colors.text },

  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start', gap: 8 },

  bloomAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bloomAvatarText: { fontSize: 18 },

  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  bubbleStreaming: {
    borderColor: Colors.primary,
  },
  streamingCursor: {
    width: 2,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  messageText: { ...Typography.body, color: Colors.text, lineHeight: 20 },
  messageTextUser: { color: '#fff' },

  typingBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  // Suggested tab
  suggestedContent: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

  // Custom request card
  customCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight ?? Colors.border,
    ...Shadow.sm,
  },
  customCardTitle: { ...Typography.h4, color: Colors.text, marginBottom: 4 },
  customCardSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  customInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  customInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customError: { ...Typography.bodySmall, color: Colors.error, marginTop: 6 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryDark ?? Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { ...Typography.h4, color: '#fff', fontSize: 14 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error, flex: 1 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.xs },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  // Skeleton
  skeletonCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  skeletonTitleWrap: { flex: 1 },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  skeletonPill: {
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
  },
});
