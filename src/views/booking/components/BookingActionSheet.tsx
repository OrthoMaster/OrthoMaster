import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

export interface BookingSheetAction {
  key: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: 'default' | 'danger' | 'success';
  onPress: () => void;
}

interface BookingActionSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions: BookingSheetAction[];
  onClose: () => void;
}

const TONES = {
  default: { icon: Colors.lblueDark, text: Colors.text, background: Colors.lblue3 },
  danger: { icon: Colors.danger, text: Colors.danger, background: Colors.dangerBackground },
  success: { icon: Colors.success, text: Colors.success, background: Colors.successBackground },
};

/**
 * Choix contextuels (jour du calendrier, créneau) : plus lisible qu'une alerte
 * dès qu'il y a plus de deux actions, et identique sur iOS et Android.
 */
export const BookingActionSheet: React.FC<BookingActionSheetProps> = ({ visible, title, subtitle, actions, onClose }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacings.md) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.actions}>
            {actions.map((action) => {
              const tone = TONES[action.tone ?? 'default'];
              return (
                <TouchableOpacity
                  key={action.key}
                  style={styles.action}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    action.onPress();
                  }}
                >
                  {action.icon && (
                    <View style={[styles.actionIcon, { backgroundColor: tone.background }]}>
                      <MaterialCommunityIcons name={action.icon} size={20} color={tone.icon} />
                    </View>
                  )}
                  <Text style={[styles.actionText, { color: tone.text }]}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    paddingTop: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Colors.white,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.disabledBackground,
    marginBottom: Spacings.md,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
    marginTop: Spacings.xxxs,
  },
  actions: {
    marginTop: Spacings.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: Spacings.md,
  },
  cancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.subtext2,
  },
});