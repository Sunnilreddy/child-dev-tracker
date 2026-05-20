import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/i18n';
import LanguageToggle from '../src/components/LanguageToggle';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../src/constants/theme';

export default function LoginScreen() {
  const { signInWithGoogle, firebaseReady } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Language toggle top-right */}
      <View style={styles.topBar}>
        <LanguageToggle />
      </View>

      {/* Illustration area */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌸</Text>
        <Text style={styles.heroEmoji2}>🌱</Text>
        <Text style={styles.logoEmoji}>🌼</Text>
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>{t.welcomeTitle}</Text>
        <Text style={styles.subtitle}>{t.welcomeSubtitle}</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {[
          { icon: 'sync-outline', textEn: 'Sync across all family phones', textTe: 'అన్ని కుటుంబ ఫోన్లలో సమకాలీకరణ' },
          { icon: 'sparkles-outline', textEn: '18 learning activities', textTe: '18 అభ్యాస కార్యక్రమాలు' },
          { icon: 'bar-chart-outline', textEn: 'Track growth together', textTe: 'కలిసి వికాసాన్ని ట్రాక్ చేయండి' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>{f.textTe}</Text>
          </View>
        ))}
      </View>

      {/* Sign in button */}
      <View style={styles.bottom}>
        <Text style={styles.continueHint}>{t.orContinue}</Text>
        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>{t.signInGoogle}</Text>
            </>
          )}
        </TouchableOpacity>

        {!firebaseReady && (
          <Text style={styles.configNote}>
            Firebase not configured. Add credentials to enable sync.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
  },
  heroEmoji: { position: 'absolute', fontSize: 48, top: 20, left: '20%', opacity: 0.6 },
  heroEmoji2: { position: 'absolute', fontSize: 36, bottom: 20, right: '20%', opacity: 0.5 },
  logoEmoji: { fontSize: 80 },
  titleArea: { alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  features: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureIcon: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { ...Typography.body, color: Colors.text, flex: 1 },
  bottom: {
    marginTop: 'auto',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  continueHint: { textAlign: 'center', ...Typography.bodySmall, color: Colors.textMuted },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleIcon: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  googleG: { fontWeight: '800', fontSize: 16, color: Colors.primary },
  googleBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  configNote: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
});
