import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Milestone } from '../types';
import { Colors, BorderRadius, Typography, Shadow, Spacing } from '../constants/theme';
import { useProgress } from '../context/ProgressContext';
import { useI18n } from '../i18n';
import activitiesData from '../data/activities.json';

interface MilestoneCardProps {
  milestone: typeof activitiesData.milestones[0];
}

export default function MilestoneCard({ milestone }: MilestoneCardProps) {
  const { state } = useProgress();
  const { lang } = useI18n();

  const title = lang === 'te' && milestone.titleTe ? milestone.titleTe : milestone.title;
  const description = lang === 'te' && milestone.descriptionTe ? milestone.descriptionTe : milestone.description;

  const currentPoints =
    milestone.category === 'emotional' ? state.emotionalPoints : state.intellectualPoints;

  const achieved = currentPoints >= milestone.requiredPoints;
  const progress = Math.min(1, currentPoints / milestone.requiredPoints);
  const barWidth = `${Math.round(progress * 100)}%` as `${number}%`;

  return (
    <View style={[styles.card, achieved && styles.achievedCard]}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{milestone.emoji}</Text>
        <View style={styles.info}>
          <Text style={[styles.title, achieved && styles.achievedTitle]}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {achieved && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: barWidth, backgroundColor: achieved ? Colors.success : Colors.primary }]} />
      </View>
      <Text style={styles.pointsLabel}>
        {Math.min(currentPoints, milestone.requiredPoints)} / {milestone.requiredPoints} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  achievedCard: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primaryLight,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
  },
  achievedTitle: {
    color: Colors.primaryDark,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  pointsLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
