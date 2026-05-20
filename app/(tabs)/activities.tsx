import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity, Category, DevFocus } from '../../src/types';
import { useActivities } from '../../src/hooks/useActivities';
import { useProgress } from '../../src/context/ProgressContext';
import { useI18n } from '../../src/i18n';
import ActivityCard from '../../src/components/ActivityCard';
import LanguageToggle from '../../src/components/LanguageToggle';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../src/constants/theme';

type FocusFilter = DevFocus | 'all';

export default function ActivitiesScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('indoor');
  const [activeFocus, setActiveFocus] = useState<FocusFilter>('all');
  const { activities, searchQuery, setSearchQuery } = useActivities(activeCategory, activeFocus);
  const { completedThisWeek } = useProgress();
  const { t } = useI18n();

  const CATEGORY_TABS: { key: Category; label: string; emoji: string }[] = [
    { key: 'indoor', label: t.indoor, emoji: '🏠' },
    { key: 'outdoor', label: t.outdoor, emoji: '🌳' },
  ];

  const FOCUS_FILTERS: { key: FocusFilter; label: string }[] = [
    { key: 'all', label: t.allFilter },
    { key: 'cognitive', label: t.focusCognitive },
    { key: 'language', label: t.focusLanguage },
    { key: 'emotional', label: t.focusEmotional },
    { key: 'empathy', label: t.focusEmpathy },
    { key: 'self-regulation', label: t.focusSelfReg },
    { key: 'motor', label: t.focusMotor },
  ];

  const renderActivity: ListRenderItem<Activity> = useCallback(
    ({ item }) => <ActivityCard activity={item} />,
    []
  );

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  const ListHeader = (
    <View>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t.tabActivities}</Text>
          </View>
          <LanguageToggle />
        </View>
        <Text style={styles.headerSub}>{t.gamesSubtitle}</Text>
      </View>

      {/* ─── Category Toggle ─── */}
      <View style={styles.categoryRow}>
        {CATEGORY_TABS.map((tab) => {
          const active = activeCategory === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.categoryTab,
                active && (tab.key === 'indoor' ? styles.indoorActive : styles.outdoorActive),
              ]}
              onPress={() => setActiveCategory(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryEmoji}>{tab.emoji}</Text>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Focus Filters ─── */}
      <View style={styles.filterScroll}>
        {FOCUS_FILTERS.map((f) => {
          const active = activeFocus === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFocus(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Results count ─── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {activities.length} {t.tabActivities.toLowerCase()}
        </Text>
        <View style={styles.completedPill}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
          <Text style={styles.completedPillText}>{completedThisWeek} {t.doneThisWeek}</Text>
        </View>
      </View>
    </View>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>{t.noActivities}</Text>
      <Text style={styles.emptyText}>{t.tryDifferent}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListFooterComponent={() => <View style={{ height: 80 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { flexGrow: 1 },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },

  categoryRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  indoorActive: { backgroundColor: Colors.indoorBg, ...Shadow.sm },
  outdoorActive: { backgroundColor: Colors.outdoorBg, ...Shadow.sm },
  categoryEmoji: { fontSize: 18 },
  categoryLabel: { ...Typography.h4, color: Colors.textMuted },
  categoryLabelActive: { color: Colors.text },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 0 },

  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: Spacing.md,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.label, color: Colors.textSecondary, fontSize: 12 },
  filterTextActive: { color: Colors.textOnPrimary },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultsText: { ...Typography.bodySmall, color: Colors.textMuted },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  completedPillText: { ...Typography.caption, color: Colors.primaryDark, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
