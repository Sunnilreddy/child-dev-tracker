import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeeklyProgress } from '../types';
import { Colors, BorderRadius, Typography } from '../constants/theme';

interface WeeklyChartProps {
  data: WeeklyProgress[];
  maxValue?: number;
}

export default function WeeklyChart({ data, maxValue = 4 }: WeeklyChartProps) {
  const chartHeight = 60;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((item, index) => {
          const heightPercent = maxValue > 0 ? Math.min(item.count / maxValue, 1) : 0;
          const barHeight = Math.max(4, heightPercent * chartHeight);
          const isToday = index === data.length - 1;

          return (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.barTrack, { height: chartHeight }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isToday
                        ? Colors.primary
                        : item.count > 0
                        ? Colors.primaryLight
                        : Colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {item.shortDay}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 24,
    backgroundColor: Colors.divider,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  dayLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 6,
  },
  todayLabel: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
