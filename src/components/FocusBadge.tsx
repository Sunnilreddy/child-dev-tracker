import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { DevFocus } from '../types';
import { focusColors, focusBg, BorderRadius, Typography } from '../constants/theme';

const focusLabel: Record<DevFocus, string> = {
  cognitive: 'Cognitive',
  language: 'Language',
  emotional: 'Emotional',
  empathy: 'Empathy',
  'self-regulation': 'Self-Reg',
  motor: 'Motor',
};

interface FocusBadgeProps {
  focus: DevFocus;
  small?: boolean;
}

export default function FocusBadge({ focus, small }: FocusBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: focusBg[focus] },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: focusColors[focus] },
          small && styles.smallText,
        ]}
      >
        {focusLabel[focus]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: 6,
    marginBottom: 4,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    ...Typography.label,
    fontSize: 11,
  },
  smallText: {
    fontSize: 10,
  },
});
