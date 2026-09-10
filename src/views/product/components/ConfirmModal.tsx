import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../lib/Theme';

type Props = {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  // Tints the icon chip and the confirm button. Defaults to a warning
  // amber, since both current uses discard the user's work.
  tone?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible, icon, title, message, confirmLabel,
  cancelLabel = 'Annuler', tone = '#D97706', onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      {/* Backdrop is a sibling of the card, not its parent — a wrapping
          Pressable would swallow touches meant for the buttons. */}
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.card}>
          <View style={[styles.iconChip, { backgroundColor: `${tone}1A` }]}>
            <Ionicons name={icon} size={26} color={tone} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: tone }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(30, 45, 66, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  card: {
    backgroundColor: palette.cardBg,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
    maxWidth: 500,
  },
  iconChip: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    color: palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
    alignSelf: 'stretch',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: palette.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
});