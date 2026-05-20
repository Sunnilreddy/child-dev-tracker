import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import LanguageToggle from '../../src/components/LanguageToggle';

// ─── Emotion Matching Game ──────────────────────────────────────────────────

const EMOTIONS = ['😊', '😢', '😠', '😲', '😨', '😄'];

function EmotionMatchGame() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const [target, setTarget] = useState(Math.floor(Math.random() * EMOTIONS.length));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const nextRound = () => {
    setTarget(Math.floor(Math.random() * EMOTIONS.length));
    setSelected(null);
    setFeedback('');
  };

  const handleGuess = (index: number) => {
    setSelected(index);
    const correct = index === target;
    if (correct) {
      setScore((s) => s + 1);
      setFeedback(t.correct);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    } else {
      setFeedback(t.tryAgain);
    }
    setTimeout(nextRound, 1200);
  };

  return (
    <View style={gameStyles.card}>
      <Text style={gameStyles.gameTitle}>🎭 {t.emotionMatch}</Text>
      <Text style={gameStyles.instruction}>{t.findMatch}</Text>

      <Animated.Text style={[gameStyles.targetEmoji, { transform: [{ scale: scaleAnim }] }]}>
        {EMOTIONS[target]}
      </Animated.Text>

      {feedback ? <Text style={gameStyles.feedback}>{feedback}</Text> : null}

      <View style={gameStyles.emojiGrid}>
        {EMOTIONS.map((e, i) => (
          <TouchableOpacity
            key={i}
            style={[
              gameStyles.emojiBtn,
              selected === i && i === target && gameStyles.correctBtn,
              selected === i && i !== target && gameStyles.wrongBtn,
            ]}
            onPress={() => handleGuess(i)}
            activeOpacity={0.7}
          >
            <Text style={gameStyles.emojiOption}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={gameStyles.scoreRow}>
        <Text style={gameStyles.scoreText}>{t.score}: {score} ⭐</Text>
        <TouchableOpacity onPress={() => { setScore(0); nextRound(); }}>
          <Text style={gameStyles.resetText}>{t.playAgain}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Colour Tap Game ──────────────────────────────────────────────────────────

const COLOURS_EN = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
const COLOURS_TE = ['ఎరుపు', 'నీలం', 'పచ్చ', 'పసుపు', 'వంగ', 'నారంజ'];
const COLOUR_HEX = ['#EF5350', '#42A5F5', '#66BB6A', '#FFCA28', '#AB47BC', '#FFA726'];

function ColourTapGame() {
  const { t, lang } = useI18n();
  const [targetIndex, setTargetIndex] = useState(Math.floor(Math.random() * COLOUR_HEX.length));
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const colourNames = lang === 'te' ? COLOURS_TE : COLOURS_EN;

  const nextRound = () => {
    setTargetIndex(Math.floor(Math.random() * COLOUR_HEX.length));
    setFeedback('');
  };

  const handleTap = (index: number) => {
    if (index === targetIndex) {
      setScore((s) => s + 1);
      setFeedback(t.correct);
    } else {
      setFeedback(`${colourNames[index]}? ${t.tryAgain}`);
    }
    setTimeout(nextRound, 1000);
  };

  return (
    <View style={gameStyles.card}>
      <Text style={gameStyles.gameTitle}>🎨 {t.colorTap}</Text>
      <Text style={gameStyles.instruction}>
        {t.tapThe}{' '}
        <Text style={{ color: COLOUR_HEX[targetIndex], fontWeight: '700' }}>
          {colourNames[targetIndex]}
        </Text>
        {lang === 'te' ? ' రంగును నొక్కండి!' : ' circle!'}
      </Text>

      {feedback ? <Text style={gameStyles.feedback}>{feedback}</Text> : null}

      <View style={gameStyles.colourGrid}>
        {COLOUR_HEX.map((hex, i) => (
          <TouchableOpacity
            key={i}
            style={[gameStyles.colourBtn, { backgroundColor: hex }]}
            onPress={() => handleTap(i)}
            activeOpacity={0.7}
          />
        ))}
      </View>

      <Text style={gameStyles.scoreText}>{t.score}: {score} ⭐</Text>
    </View>
  );
}

// ─── Counting Stars Game ────────────────────────────────────────────────────

function CountingGame() {
  const { t } = useI18n();
  const [count, setCount] = useState(Math.floor(Math.random() * 5) + 1);
  const [answer, setAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);

  const nextRound = () => {
    setCount(Math.floor(Math.random() * 5) + 1);
    setAnswer(null);
    setFeedback('');
  };

  const handleAnswer = (n: number) => {
    setAnswer(n);
    if (n === count) {
      setScore((s) => s + 1);
      setFeedback('🌟 ' + t.correct);
    } else {
      setFeedback(t.tryAgain);
    }
    setTimeout(nextRound, 1500);
  };

  return (
    <View style={gameStyles.card}>
      <Text style={gameStyles.gameTitle}>⭐ {t.countingGame}</Text>

      <View style={gameStyles.starsDisplay}>
        {Array.from({ length: count }).map((_, i) => (
          <Text key={i} style={gameStyles.starEmoji}>⭐</Text>
        ))}
      </View>

      {feedback ? <Text style={gameStyles.feedback}>{feedback}</Text> : null}

      <Text style={gameStyles.instruction}>{t.howManyStars}</Text>

      <View style={gameStyles.numberRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              gameStyles.numberBtn,
              answer === n && n === count && gameStyles.correctBtn,
              answer === n && n !== count && gameStyles.wrongBtn,
            ]}
            onPress={() => handleAnswer(n)}
            activeOpacity={0.7}
          >
            <Text style={gameStyles.numberText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={gameStyles.scoreText}>{t.score}: {score} ⭐</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function InteractiveScreen() {
  const { t } = useI18n();
  const [activeGame, setActiveGame] = useState('emotion');

  const GAMES = [
    { id: 'emotion', label: t.emotionMatch, emoji: '🎭', component: <EmotionMatchGame /> },
    { id: 'colour', label: t.colorTap, emoji: '🎨', component: <ColourTapGame /> },
    { id: 'counting', label: t.countingGame, emoji: '⭐', component: <CountingGame /> },
  ];

  const currentGame = GAMES.find((g) => g.id === activeGame);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t.gamesTitle} 🎮</Text>
            <LanguageToggle />
          </View>
          <Text style={styles.headerSub}>{t.gamesSubtitle}</Text>
        </View>

        {/* Game selector */}
        <View style={styles.gameSelector}>
          {GAMES.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.gamePill, activeGame === g.id && styles.gamePillActive]}
              onPress={() => setActiveGame(g.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.gamePillEmoji}>{g.emoji}</Text>
              <Text style={[styles.gamePillLabel, activeGame === g.id && styles.gamePillLabelActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active game */}
        <View style={styles.gameArea}>{currentGame?.component}</View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>👨‍👩‍👧 {t.parentTip}</Text>
          <Text style={styles.tipBody}>{t.parentTipText}</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xl },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  gameSelector: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadow.sm,
  },
  gamePillActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  gamePillEmoji: { fontSize: 22 },
  gamePillLabel: { ...Typography.h4, color: Colors.textSecondary },
  gamePillLabelActive: { color: Colors.primaryDark },
  gameArea: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  tipCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.accentYellowLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  tipTitle: { ...Typography.h4, color: Colors.text, marginBottom: 6 },
  tipBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
});

const gameStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gameTitle: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  instruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  targetEmoji: { fontSize: 72, marginBottom: Spacing.sm },
  feedback: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.sm },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emojiBtn: {
    width: 72, height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  correctBtn: { borderColor: Colors.success, backgroundColor: '#E8F5E9' },
  wrongBtn: { borderColor: Colors.error, backgroundColor: '#FFEBEE' },
  emojiOption: { fontSize: 40 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  scoreText: { ...Typography.h4, color: Colors.text },
  resetText: { ...Typography.label, color: Colors.primary },
  colourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  colourBtn: { width: 72, height: 72, borderRadius: 36, ...Shadow.md },
  starsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 80,
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 4,
  },
  starEmoji: { fontSize: 44 },
  numberRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  numberBtn: {
    width: 52, height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  numberText: { ...Typography.h2, color: Colors.text },
});
