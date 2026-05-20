import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useProgress } from '../../src/context/ProgressContext';
import { useI18n } from '../../src/i18n';
import ProgressRing from '../../src/components/ProgressRing';
import WeeklyChart from '../../src/components/WeeklyChart';
import MilestoneCard from '../../src/components/MilestoneCard';
import LanguageToggle from '../../src/components/LanguageToggle';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../src/constants/theme';
import { getWeeklyProgress, formatDate } from '../../src/utils/helpers';
import activitiesData from '../../src/data/activities.json';
import { Activity } from '../../src/types';

const EMOTIONAL_MAX = 150;
const INTELLECTUAL_MAX = 180;

const allActivities = activitiesData.activities as Activity[];

export default function ProgressScreen() {
  const { state, completedThisWeek } = useProgress();
  const { t, lang } = useI18n();

  const weeklyData = useMemo(() => {
    const dates = state.completedActivities.map((c) => c.completedAt);
    return getWeeklyProgress(dates);
  }, [state.completedActivities]);

  const emotionalPercent = Math.min(100, Math.round((state.emotionalPoints / EMOTIONAL_MAX) * 100));
  const intellectualPercent = Math.min(100, Math.round((state.intellectualPoints / INTELLECTUAL_MAX) * 100));

  const recentCompleted = useMemo(() => {
    return [...state.completedActivities]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5)
      .map((c) => ({
        ...c,
        activity: allActivities.find((a) => a.id === c.activityId),
      }))
      .filter((c) => c.activity);
  }, [state.completedActivities]);

  const emotionalMilestones = activitiesData.milestones.filter((m) => m.category === 'emotional');
  const intellectualMilestones = activitiesData.milestones.filter((m) => m.category === 'intellectual');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{t.tabProgress} 📊</Text>
              <Text style={styles.headerSub}>{state.childProfile.name}</Text>
            </View>
            <LanguageToggle />
          </View>
        </View>

        {/* ─── Summary Banner ─── */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{state.completedActivities.length}</Text>
            <Text style={styles.summaryLabel}>{t.totalDone}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedThisWeek}</Text>
            <Text style={styles.summaryLabel}>{t.thisWeek}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{state.emotionalPoints + state.intellectualPoints}</Text>
            <Text style={styles.summaryLabel}>{t.statPoints}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.accentYellow }]}>🔥{state.streak}</Text>
            <Text style={styles.summaryLabel}>{t.statStreak}</Text>
          </View>
        </View>

        {/* ─── Development Rings ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.myProgress}</Text>
          <View style={styles.ringsCard}>
            <View style={styles.ringCol}>
              <ProgressRing
                progress={emotionalPercent}
                size={120}
                strokeWidth={12}
                color="#F48FB1"
                label={t.emotionalGrowth}
                valueLabel={`${emotionalPercent}%`}
                emoji="💛"
              />
              <Text style={styles.ringPoints}>{state.emotionalPoints} / {EMOTIONAL_MAX} pts</Text>
            </View>
            <View style={styles.ringDivider} />
            <View style={styles.ringCol}>
              <ProgressRing
                progress={intellectualPercent}
                size={120}
                strokeWidth={12}
                color={Colors.accentBlue}
                label={t.intellectualGrowth}
                valueLabel={`${intellectualPercent}%`}
                emoji="🧩"
              />
              <Text style={styles.ringPoints}>{state.intellectualPoints} / {INTELLECTUAL_MAX} pts</Text>
            </View>
          </View>
        </View>

        {/* ─── Weekly Activity Chart ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.thisWeek}</Text>
          <View style={styles.chartCard}>
            <WeeklyChart
              data={weeklyData}
              maxValue={Math.max(4, ...weeklyData.map((d) => d.count))}
            />
          </View>
        </View>

        {/* ─── Emotional Milestones ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💛 {t.emotionalMilestones}</Text>
          {emotionalMilestones.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </View>

        {/* ─── Intellectual Milestones ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧩 {t.intellectualMilestones}</Text>
          {intellectualMilestones.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </View>

        {/* ─── Recent Activity Log ─── */}
        {recentCompleted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.recentActivities}</Text>
            {recentCompleted.map((item, index) => {
              const actTitle = lang === 'te' && item.activity?.titleTe
                ? item.activity.titleTe
                : item.activity?.title;
              return (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logEmoji}>{item.activity?.emoji}</Text>
                  <View style={styles.logInfo}>
                    <Text style={styles.logTitle}>{actTitle}</Text>
                    <Text style={styles.logDate}>{formatDate(item.completedAt)}</Text>
                  </View>
                  <View style={[
                    styles.logBadge,
                    { backgroundColor: item.activity?.milestoneCategory === 'emotional' ? '#FCE4EC' : '#E3F2FD' }
                  ]}>
                    <Text style={styles.logBadgeText}>+{item.activity?.points}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {state.completedActivities.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>{t.noActivitiesYet}</Text>
            <Text style={styles.emptyText}>{t.startFirst}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xl },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },

  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },
  summaryValue: { ...Typography.h2, color: Colors.textOnPrimary, marginBottom: 2 },
  summaryLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  ringsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ringCol: { alignItems: 'center' },
  ringDivider: { width: 1, height: 120, backgroundColor: Colors.divider },
  ringPoints: { ...Typography.caption, color: Colors.textMuted, marginTop: 8 },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  logEmoji: { fontSize: 24 },
  logInfo: { flex: 1 },
  logTitle: { ...Typography.h4, color: Colors.text, marginBottom: 2 },
  logDate: { ...Typography.caption, color: Colors.textMuted },
  logBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  logBadgeText: { ...Typography.label, color: Colors.text, fontSize: 12 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
