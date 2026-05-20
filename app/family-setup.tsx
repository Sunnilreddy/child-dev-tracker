import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, setDoc, getDoc, serverTimestamp, collection,
} from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/i18n';
import LanguageToggle from '../src/components/LanguageToggle';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../src/constants/theme';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function FamilySetupScreen() {
  const { user, setFamilyId, signOut } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!familyName.trim() || !user) return;
    setLoading(true);
    try {
      const newCode = generateCode();
      const familyRef = doc(collection(db, 'families'));
      await setDoc(familyRef, {
        name: familyName.trim(),
        childName: childName.trim(),
        code: newCode,
        createdBy: user.uid,
        members: {
          [user.uid]: {
            name: user.displayName ?? user.email,
            email: user.email,
            role: 'caretaker',
          },
        },
        createdAt: serverTimestamp(),
      });

      // Update user's familyId
      await setDoc(doc(db, 'users', user.uid), { familyId: familyRef.id, role: 'caretaker' }, { merge: true });

      // Init empty progress doc
      await setDoc(doc(db, 'families', familyRef.id, 'progress', 'main'), {
        completedActivities: [],
        emotionalPoints: 0,
        intellectualPoints: 0,
        streak: 0,
        lastActiveDate: null,
        childProfile: {
          name: childName.trim() || 'Your Child',
          birthDate: new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString(),
          avatarEmoji: '🌸',
        },
        weeklyGoal: 5,
        updatedAt: serverTimestamp(),
      });

      setCreatedCode(newCode);
      setFamilyId(familyRef.id);
    } catch (e) {
      Alert.alert('Error', 'Could not create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== 8 || !user) {
      Alert.alert('', t.invalidCode);
      return;
    }
    setLoading(true);
    try {
      // Find family by code
      const { getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'families'), where('code', '==', trimmedCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('', t.codeNotFound);
        setLoading(false);
        return;
      }

      const familyDoc = snap.docs[0];
      const familyId = familyDoc.id;

      // Add user to family members
      await setDoc(
        doc(db, 'families', familyId),
        {
          members: {
            [user.uid]: {
              name: user.displayName ?? user.email,
              email: user.email,
              role: 'parent',
            },
          },
        },
        { merge: true }
      );

      // Update user's familyId
      await setDoc(doc(db, 'users', user.uid), { familyId, role: 'parent' }, { merge: true });
      setFamilyId(familyId);
    } catch {
      Alert.alert('Error', 'Could not join family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareCode = () => {
    Share.share({
      message: `Join our Little Bloom family!\n\nFamily Code: ${createdCode}\n\nOpen Little Bloom app → Join Family → enter this code.`,
    });
  };

  // ---- Success state: show code to share ----
  if (createdCode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>{t.yourFamilyCode}</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{createdCode}</Text>
          </View>
          <Text style={styles.codeHint}>{t.shareCodeHint}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueBtn} onPress={() => setFamilyId(createdCode)}>
            <Text style={styles.continueBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>
        <LanguageToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>👨‍👩‍👧</Text>
        <Text style={styles.title}>{t.familySetupTitle}</Text>
        <Text style={styles.subtitle}>{t.familySetupSubtitle}</Text>

        {mode === 'choose' && (
          <View style={styles.choiceArea}>
            <TouchableOpacity style={styles.choiceCard} onPress={() => setMode('create')}>
              <Ionicons name="add-circle-outline" size={36} color={Colors.primary} />
              <Text style={styles.choiceTitle}>{t.createFamily}</Text>
              <Text style={styles.choiceDesc}>You are the caretaker / first user</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceCard} onPress={() => setMode('join')}>
              <Ionicons name="people-outline" size={36} color={Colors.primary} />
              <Text style={styles.choiceTitle}>{t.joinFamily}</Text>
              <Text style={styles.choiceDesc}>You have a code from the caretaker</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && (
          <View style={styles.form}>
            <Text style={styles.label}>{t.familyName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.familyNameHint}
              value={familyName}
              onChangeText={setFamilyName}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>{t.childName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.childNameHint}
              value={childName}
              onChangeText={setChildName}
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={loading || !familyName.trim()}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{t.create}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('choose')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View style={styles.form}>
            <Text style={styles.label}>{t.enterCode}</Text>
            <Text style={styles.hint}>{t.enterCodeHint}</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="ABCD1234"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.btnDisabled]}
              onPress={handleJoin}
              disabled={loading || code.trim().length !== 8}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{t.join}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('choose')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  signOutText: { color: Colors.textMuted, fontSize: 14 },
  scroll: { padding: Spacing.xl, alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl },
  choiceArea: { width: '100%', gap: Spacing.md },
  choiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  choiceTitle: { ...Typography.h4, color: Colors.text },
  choiceDesc: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  form: { width: '100%', gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.text },
  hint: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  codeInput: { fontSize: 24, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  backBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  backBtnText: { color: Colors.textMuted, fontSize: 14 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  successEmoji: { fontSize: 72 },
  successTitle: { ...Typography.h3, color: Colors.text },
  codeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  codeText: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: 6 },
  codeHint: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  shareBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, ...Shadow.sm,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  continueBtn: { paddingVertical: Spacing.sm },
  continueBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
