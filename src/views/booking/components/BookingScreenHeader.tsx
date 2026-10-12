import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface BookingHeaderButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

/** Bouton rond de l'en-tête, même style que le retour ; à placer dans `right`. */
export const BookingHeaderButton: React.FC<BookingHeaderButtonProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.round} onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
    <Ionicons name={icon} size={20} color={Colors.white} />
  </TouchableOpacity>
);

interface BookingScreenHeaderProps {
  title: string;
  /** Sans onBack : écran racine d'un onglet, titre aligné à gauche. */
  onBack?: () => void;
  right?: React.ReactNode;
}

export const BookingScreenHeader: React.FC<BookingScreenHeaderProps> = ({ title, onBack, right }) => (
  <View style={styles.header}>
    {onBack && (
      <TouchableOpacity style={[styles.round, styles.back]} onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retour">
        <Ionicons name="chevron-back" size={22} color={Colors.white} />
      </TouchableOpacity>
    )}

    <Text style={[styles.title, onBack && styles.titleCentered]} numberOfLines={1}>
      {title}
    </Text>

    {right ? <View style={styles.right}>{right}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.lblue,
  },
  back: {
    position: 'absolute',
    left: Spacings.md,
    zIndex: 1,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: Colors.white,
  },
  // Centré pour ne pas buter contre le bouton retour.
  titleCentered: {
    textAlign: 'center',
    paddingHorizontal: Spacings.xxl,
  },
  right: {
    position: 'absolute',
    right: Spacings.md,
    flexDirection: 'row',
    gap: Spacings.xs,
  },
});