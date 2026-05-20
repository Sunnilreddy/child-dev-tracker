import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Linking, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useI18n } from '../i18n';

interface VideoModalProps {
  visible: boolean;
  videoId: string;
  title: string;
  onClose: () => void;
}

export default function VideoModal({ visible, videoId, title, onClose }: VideoModalProps) {
  const { t } = useI18n();

  const openVideo = async () => {
    const ytApp = `vnd.youtube:${videoId}`;
    const ytWeb = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const canOpen = await Linking.canOpenURL(ytApp);
      await Linking.openURL(canOpen ? ytApp : ytWeb);
    } catch {
      Alert.alert('Error', 'Could not open YouTube. Please try again.');
    }
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t.videoTitle}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Thumbnail + play button */}
        <TouchableOpacity style={styles.thumbnailContainer} onPress={openVideo} activeOpacity={0.85}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Dark overlay */}
          <View style={styles.overlay} />
          {/* Play icon */}
          <View style={styles.playBtn}>
            <Ionicons name="logo-youtube" size={52} color="#FF0000" />
          </View>
          {/* Video title */}
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText} numberOfLines={2}>{title}</Text>
          </View>
        </TouchableOpacity>

        {/* Open button */}
        <TouchableOpacity style={styles.openBtn} onPress={openVideo}>
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.openBtnText}>{t.openVideo}</Text>
        </TouchableOpacity>
        <Text style={styles.notice}>{t.videoNotice}</Text>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>{t.videoTip}</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: Colors.text, flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  thumbnailContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    height: 220,
    backgroundColor: '#000',
  },
  thumbnail: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBtn: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  titleBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  titleBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
  },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  notice: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accentYellowLight,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  tipIcon: { fontSize: 18 },
  tipText: { ...Typography.bodySmall, color: Colors.text, flex: 1, lineHeight: 18 },
});
