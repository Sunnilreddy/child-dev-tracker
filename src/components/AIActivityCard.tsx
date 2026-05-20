import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
  LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIGeneratedActivity } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { useProgress } from '../context/ProgressContext';
import { useAI } from '../context/AIContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Props {
  activity: AIGeneratedActivity;
  onDismiss: () => void;
}

const difficultyColor: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.warning,
  hard: Colors.error,
};

export default function AIActivityCard({ activity, onDismiss }: Props) {
  const { completeActivity, uncompleteActivity, isCompleted } = useProgress();
  const { addFeedback, getFeedback } = useAI();
  const [expanded, setExpanded] = useState(false);
  const completed = isCompleted(activity.id);
  const currentFeedback = getFeedback(activity.id);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  const handleCheck = () => {
    if (completed) uncompleteActivity(activity.id);
    else completeActivity(activity.id);
  };

  const openYouTube = () => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(activity.youtubeSearchQuery)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={11} color={Colors.accentPurple} />
        <Text style={styles.aiBadgeText}>AI Suggested</Text>
      </View>

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{activity.emoji}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, completed && styles.completedText]} numberOfLines={2}>
            {activity.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{activity.duration} min</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: difficultyColor[activity.difficulty] + '22' }]}>
              <Text style={[styles.metaText, { color: difficultyColor[activity.difficulty] }]}>
                {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{activity.points} pts</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCheck}
          style={styles.checkBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {completed ? (
            <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color={Colors.border} />
          )}
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={[styles.description, completed && styles.completedText]} numberOfLines={expanded ? undefined : 2}>
        {activity.description}
      </Text>

      {/* Why suggested */}
      <View style={styles.reasonRow}>
        <Ionicons name="bulb-outline" size={13} color={Colors.accentPurple} />
        <Text style={styles.reasonText}>{activity.generatedReason}</Text>
      </View>

      {/* Expanded: materials + instructions */}
      {expanded && (
        <View style={styles.expandedContent}>
          {activity.materials.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🛠 Materials needed</Text>
              {activity.materials.map((m, i) => (
                <Text key={i} style={styles.bulletItem}>· {m}</Text>
              ))}
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📋 Instructions</Text>
            {activity.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.youtubeBtn} onPress={openYouTube} activeOpacity={0.8}>
          <Ionicons name="search" size={14} color={Colors.textOnPrimary} />
          <Text style={styles.youtubeBtnText}>Find on YouTube</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleExpand} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>Steps</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Feedback row — only shown after completing */}
      {completed && (
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackLabel}>How was it?</Text>
          {(['too-easy', 'loved', 'too-hard'] as const).map((type) => {
            const label = type === 'too-easy' ? '😌 Easy' : type === 'loved' ? '❤️ Loved' : '😤 Too hard';
            const selected = currentFeedback === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.feedbackBtn, selected && styles.feedbackBtnSelected]}
                onPress={() => addFeedback(activity.id, type)}
              >
                <Text style={[styles.feedbackBtnText, selected && styles.feedbackBtnTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Dismiss */}
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: 10,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  completedCard: {
    backgroundColor: Colors.completedBg,
    borderColor: Colors.completedBorder,
    opacity: 0.8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  aiBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  emoji: { fontSize: 24 },
  titleBlock: { flex: 1 },
  title: { ...Typography.h4, color: Colors.text, marginBottom: 5, lineHeight: 22 },
  completedText: { color: Colors.completedText, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  pointsBadge: {
    backgroundColor: Colors.accentYellowLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accentYellow + '40',
  },
  pointsText: { ...Typography.caption, color: Colors.accentYellow, fontWeight: '700' },
  checkBtn: { marginLeft: Spacing.xs, flexShrink: 0, marginTop: 2 },
  description: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xs, lineHeight: 21 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  reasonText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: { marginBottom: Spacing.sm },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  bulletItem: { ...Typography.body, color: Colors.textSecondary, marginBottom: 3, paddingLeft: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: { ...Typography.label, color: '#fff', fontSize: 10 },
  stepText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 21 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  youtubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  youtubeBtnText: { ...Typography.label, color: '#fff', fontSize: 12 },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expandBtnText: { ...Typography.label, color: Colors.primary, fontSize: 12 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    flexWrap: 'wrap',
  },
  feedbackLabel: { ...Typography.bodySmall, color: Colors.textMuted },
  feedbackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  feedbackBtnSelected: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  feedbackBtnText: { ...Typography.bodySmall, color: Colors.textSecondary },
  feedbackBtnTextSelected: { color: Colors.primary, fontWeight: '600' },
  dismissBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
});
