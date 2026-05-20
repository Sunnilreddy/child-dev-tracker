import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity, ActivityFeedbackType } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import FocusBadge from './FocusBadge';
import VideoModal from './VideoModal';
import { useProgress } from '../context/ProgressContext';
import { useAI } from '../context/AIContext';
import { useI18n } from '../i18n';
import { difficultyLabel } from '../utils/helpers';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface ActivityCardProps {
  activity: Activity;
  featured?: boolean;
}

const difficultyColor: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.warning,
  hard: Colors.error,
};

export default function ActivityCard({ activity, featured }: ActivityCardProps) {
  const { isCompleted, completeActivity, uncompleteActivity } = useProgress();
  const { addFeedback, getFeedback } = useAI();
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const completed = isCompleted(activity.id);
  const currentFeedback = getFeedback(activity.id);

  const title = lang === 'te' && activity.titleTe ? activity.titleTe : activity.title;
  const description = lang === 'te' && activity.descriptionTe ? activity.descriptionTe : activity.description;
  const instructions = lang === 'te' && activity.instructionsTe ? activity.instructionsTe : activity.instructions;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  const handleCheck = () => {
    if (completed) {
      uncompleteActivity(activity.id);
    } else {
      completeActivity(activity.id);
    }
  };

  return (
    <>
      <View
        style={[
          styles.card,
          completed && styles.completedCard,
          featured && styles.featuredCard,
        ]}
      >
        {/* Top Row */}
        <View style={styles.topRow}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{activity.emoji}</Text>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, completed && styles.completedText]} numberOfLines={2}>
                {title}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>{activity.duration} min</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: difficultyColor[activity.difficulty] + '20' }]}>
                <Text style={[styles.metaText, { color: difficultyColor[activity.difficulty] }]}>
                  {difficultyLabel(activity.difficulty)}
                </Text>
              </View>
              {activity.milestoneCategory === 'emotional' ? (
                <View style={[styles.metaChip, { backgroundColor: '#FCE4EC' }]}>
                  <Text style={[styles.metaText, { color: '#E91E63' }]}>💛 Emotional</Text>
                </View>
              ) : (
                <View style={[styles.metaChip, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.metaText, { color: '#1565C0' }]}>🧩 Intellectual</Text>
                </View>
              )}
            </View>
          </View>

          {/* Completion Toggle */}
          <TouchableOpacity
            onPress={handleCheck}
            style={[styles.checkBtn, completed && styles.checkBtnDone]}
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
          {description}
        </Text>

        {/* Focus Badges */}
        <View style={styles.badgeRow}>
          {activity.developmentalFocus.map((f) => (
            <FocusBadge key={f} focus={f} small />
          ))}
        </View>

        {/* Expanded Detail */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Materials */}
            {activity.materials.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>🛠 {t.materialsNeeded}</Text>
                {activity.materials.map((m, i) => (
                  <Text key={i} style={styles.bulletItem}>· {m}</Text>
                ))}
              </View>
            )}

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📋 {t.instructions}</Text>
              {instructions.map((step, i) => (
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

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.videoBtn}
            onPress={() => setVideoVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.videoBtnText}>{t.watchVideo}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleExpand}
            style={styles.expandBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.expandBtnText}>
              {expanded ? '▲' : t.instructions}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Feedback row — appears after completing an activity */}
        {completed && (
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackLabel}>How was it?</Text>
            {(['too-easy', 'loved', 'too-hard'] as ActivityFeedbackType[]).map((type) => {
              const label = type === 'too-easy' ? '😌 Easy' : type === 'loved' ? '❤️ Loved' : '😤 Hard';
              const selected = currentFeedback === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.feedbackBtn, selected && styles.feedbackBtnSelected]}
                  onPress={() => addFeedback(activity.id, type)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[styles.feedbackBtnText, selected && styles.feedbackBtnTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Points badge */}
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{activity.points} pts</Text>
        </View>
      </View>

      <VideoModal
        visible={videoVisible}
        videoId={activity.youtubeVideoId}
        title={activity.youtubeTitle}
        onClose={() => setVideoVisible(false)}
      />
    </>
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
  featuredCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    ...Shadow.md,
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
  emoji: {
    fontSize: 24,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    marginBottom: 5,
    lineHeight: 22,
  },
  completedText: {
    color: Colors.completedText,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  checkBtn: {
    marginLeft: Spacing.xs,
    flexShrink: 0,
    marginTop: 2,
  },
  checkBtnDone: {},
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  bulletItem: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 3,
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
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
  stepNumText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 10,
  },
  stepText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  videoBtnText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    fontSize: 12,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  expandBtnText: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 12,
  },
  pointsBadge: {
    position: 'absolute',
    top: 14,
    right: 50,
    backgroundColor: Colors.accentYellowLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accentYellow + '40',
  },
  pointsText: {
    ...Typography.caption,
    color: Colors.accentYellow,
    fontWeight: '700',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
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
});
