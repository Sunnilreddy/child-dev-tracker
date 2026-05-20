import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useI18n } from '../i18n';
import { Colors, BorderRadius } from '../constants/theme';

export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => setLang(lang === 'te' ? 'en' : 'te')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.label}>
        {lang === 'te' ? t.langEn : t.langTe}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
