import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography, Shadow, Spacing } from '../constants/theme';

interface StatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  color?: string;
  bgColor?: string;
}

export default function StatCard({ emoji, value, label, color = Colors.primary, bgColor = Colors.primarySurface }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  value: {
    ...Typography.h3,
    marginBottom: 2,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
