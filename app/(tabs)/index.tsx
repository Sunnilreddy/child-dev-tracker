import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../../src/context/ProgressContext';
import { useActivities } from '../../src/hooks/useActivities';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/context/AuthContext';
import ActivityCard from '../../src/components/ActivityCard';
import ProgressRing from '../../src/components/ProgressRing';
import StatCard from '../../src/components/StatCard';
import WeeklyChart from '../../src/components/WeeklyChart';
import LanguageToggle from '../../src/components/LanguageToggle';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../src/constants/theme';
import { getGreeting, getWeeklyProgress, getProgressPercent, getChildAgeLabel } from '../../src/utils/helpers';

const EMOTIONAL_MAX = 150;
const INTELLECTUAL_MAX = 180;

export default function DashboardScreen() {
  const { state, completedToday, completedThisWeek } = useProgress();
  const { featuredActivity } = useActivities();
  const { t, lang } = useI18n();
  const { firebaseReady } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetMorning;
    if (hour < 17) return t.greetAfternoon;
    return t.greetEvening;
  }, [t]);

  const ageLabel = useMemo(() => getChildAgeLabel(state.childProfile.birthDate), [state.childProfile.birthDate]);

  const [bloomInput, setBloomInput] = useState('');

  const weeklyData = useMemo(() => {
    const dates = state.completedActivities.map((c) => c.completedAt);
    return getWeeklyProgress(dates);
  }, [state.completedActivities]);

  const emotionalPercent = getProgressPercent(state.emotionalPoints, EMOTIONAL_MAX);
  const intellectualPercent = getProgressPercent(state.intellectualPoints, INTELLECTUAL_MAX);
  const weeklyPercent = Math.round((completedThisWeek / state.weeklyGoal) * 100);

  const todayFormatted = new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting}! 👋</Text>
              <Text style={styles.date}>{todayFormatted}</Text>
            </View>
            <View style={styles.headerRight}>
              <LanguageToggle />
              <View style={styles.avatarWrap}>
                <Text style={styles.avatar}>{state.childProfile.avatarEmoji}</Text>
              </View>
            </View>
          </View>

          <View style={styles.childInfo}>
            <Text style={styles.childName}>{state.childProfile.name}</Text>
            <Text style={styles.childAge}>{ageLabel}</Text>
          </View>

          <View style={styles.headerBottom}>
            {state.streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakText}>{state.streak} {t.streakBadge}</Text>
              </View>
            )}
            {firebaseReady && (
              <View style={styles.syncBadge}>
                <Ionicons name="cloud-done-outline" size={12} color={Colors.primary} />
                <Text style={styles.syncText}>{t.synced}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Quick Stats ─── */}
        <View style={styles.statsRow}>
          <StatCard
            emoji="✅"
            value={completedToday}
            label={t.statToday}
            color={Colors.primary}
            bgColor={Colors.primarySurface}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            emoji="📅"
            value={completedThisWeek}
            label={t.statWeek}
            color={Colors.accentBlue}
            bgColor={Colors.accentBlueLLight}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            emoji="⭐"
            value={state.emotionalPoints + state.intellectualPoints}
            label={t.statPoints}
            color="#F59E0B"
            bgColor={Colors.accentYellowLight}
          />
        </View>

        {/* ─── Weekly Goal Bar ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.weeklyProgress}</Text>
            <Text style={styles.sectionSubtitle}>
              {completedThisWeek} / {state.weeklyGoal} {t.weeklyGoal}
            </Text>
          </View>
          <View style={styles.goalBarTrack}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${Math.min(weeklyPercent, 100)}%` as `${number}%` },
              ]}
            />
          </View>
          <Text style={styles.goalHint}>
            {weeklyPercent >= 100
              ? '🎉 ' + (lang === 'te' ? 'గోల్ చేరుకున్నారు! అద్భుతం!' : 'Goal reached! Amazing work!')
              : `${state.weeklyGoal - completedThisWeek} ${lang === 'te' ? 'కార్యకలాపాలు మిగిలాయి' : 'more to reach your goal'}`}
          </Text>
        </View>

        {/* ─── Development Progress Rings ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.myProgress}</Text>
          <View style={styles.ringsRow}>
            <ProgressRing
              progress={emotionalPercent}
              size={110}
              strokeWidth={10}
              color="#F48FB1"
              label={t.emotionalGrowth}
              valueLabel={`${state.emotionalPoints}pts`}
              emoji="💛"
            />
            <View style={styles.ringsDivider} />
            <ProgressRing
              progress={intellectualPercent}
              size={110}
              strokeWidth={10}
              color={Colors.accentBlue}
              label={t.intellectualGrowth}
              valueLabel={`${state.intellectualPoints}pts`}
              emoji="🧩"
            />
          </View>
          <TouchableOpacity
            style={styles.viewProgressBtn}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <Text style={styles.viewProgressText}>{t.viewProgress}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Weekly Activity Chart ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.thisWeek}</Text>
          </View>
          <WeeklyChart data={weeklyData} maxValue={Math.max(4, ...weeklyData.map((d) => d.count))} />
        </View>

        {/* ─── Today's Featured Activity ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ {t.featuredActivity}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/activities')}>
              <Text style={styles.seeAll}>{lang === 'te' ? 'అన్నీ చూడండి' : 'See all'}</Text>
            </TouchableOpacity>
          </View>
          {featuredActivity && <ActivityCard activity={featuredActivity} featured />}
        </View>

        {/* ─── Ask Bloom ─── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.bloomCard}
            activeOpacity={1}
            onPress={() => router.push('/(tabs)/assistant')}
          >
            <View style={styles.bloomCardHeader}>
              <Text style={styles.bloomCardEmoji}>🌸</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bloomCardTitle}>Ask Bloom</Text>
                <Text style={styles.bloomCardSubtitle}>Get instant activity ideas or parenting advice</Text>
              </View>
            </View>
            <View style={styles.bloomInputRow}>
              <TextInput
                style={styles.bloomInput}
                value={bloomInput}
                onChangeText={setBloomInput}
                placeholder={'e.g. "5-min quiet activity while I\'m on a call"'}
                placeholderTextColor={Colors.textMuted}
                returnKeyType="send"
                onSubmitEditing={() => {
                  const text = bloomInput.trim();
                  if (!text) return;
                  setBloomInput('');
                  router.push({ pathname: '/(tabs)/assistant', params: { pending: text } });
                }}
              />
              <TouchableOpacity
                style={[styles.bloomSendBtn, !bloomInput.trim() && styles.bloomSendBtnDisabled]}
                onPress={() => {
                  const text = bloomInput.trim();
                  if (!text) return;
                  setBloomInput('');
                  router.push({ pathname: '/(tabs)/assistant', params: { pending: text } });
                }}
                disabled={!bloomInput.trim()}
              >
                <Text style={styles.bloomSendArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Quick Nav Buttons ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickNav}</Text>
          <View style={styles.navGrid}>
            <TouchableOpacity
              style={[styles.navCard, { backgroundColor: Colors.indoorBg }]}
              onPress={() => router.push('/(tabs)/activities')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>🏠</Text>
              <Text style={styles.navLabel}>{t.indoor}</Text>
              <Text style={styles.navSub}>{t.tabActivities}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navCard, { backgroundColor: Colors.outdoorBg }]}
              onPress={() => router.push('/(tabs)/activities')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>🌳</Text>
              <Text style={styles.navLabel}>{t.outdoor}</Text>
              <Text style={styles.navSub}>{t.tabActivities}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navCard, { backgroundColor: Colors.accentBlueLLight }]}
              onPress={() => router.push('/(tabs)/interactive')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>🎮</Text>
              <Text style={styles.navLabel}>{t.tabPlay}</Text>
              <Text style={styles.navSub}>{t.gamesSubtitle}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navCard, { backgroundColor: '#F3E5F5' }]}
              onPress={() => router.push('/(tabs)/progress')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>📊</Text>
              <Text style={styles.navLabel}>{t.milestones}</Text>
              <Text style={styles.navSub}>{t.tabProgress}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xl },

  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  greeting: { ...Typography.h2, color: Colors.text },
  date: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  avatar: { fontSize: 22 },
  childInfo: { marginBottom: Spacing.sm },
  childName: { ...Typography.h3, color: Colors.primaryDark },
  childAge: { ...Typography.bodySmall, color: Colors.textSecondary },
  headerBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full, gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakFire: { fontSize: 16 },
  streakText: { ...Typography.label, color: Colors.text },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  syncText: { ...Typography.caption, color: Colors.primaryDark, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  sectionSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary },
  seeAll: { ...Typography.label, color: Colors.primary },

  goalBarTrack: { height: 10, backgroundColor: Colors.divider, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: 6 },
  goalBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  goalHint: { ...Typography.bodySmall, color: Colors.textSecondary },

  ringsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  ringsDivider: { width: 1, height: 80, backgroundColor: Colors.divider },
  viewProgressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  viewProgressText: { ...Typography.label, color: Colors.primary },

  // Ask Bloom card
  bloomCard: {
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadow.sm,
  },
  bloomCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  bloomCardEmoji: { fontSize: 32 },
  bloomCardTitle: { ...Typography.h4, color: Colors.primaryDark },
  bloomCardSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary },
  bloomInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bloomInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bloomSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomSendBtnDisabled: { backgroundColor: Colors.border },
  bloomSendArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },

  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  navCard: {
    width: '47%',
    borderRadius: 20,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navEmoji: { fontSize: 28, marginBottom: 6 },
  navLabel: { ...Typography.h4, color: Colors.text },
  navSub: { ...Typography.bodySmall, color: Colors.textSecondary },
});
