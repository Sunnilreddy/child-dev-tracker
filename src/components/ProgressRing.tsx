import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../constants/theme';

interface ProgressRingProps {
  progress: number; // 0–100
  size: number;
  strokeWidth: number;
  color: string;
  trackColor?: string;
  label: string;
  valueLabel: string;
  emoji?: string;
}

export default function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor = Colors.border,
  label,
  valueLabel,
  emoji,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference * (1 - safeProgress / 100);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center content */}
      <View style={[styles.center, { width: size, height: size }]}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={[styles.value, { color }]}>{valueLabel}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
