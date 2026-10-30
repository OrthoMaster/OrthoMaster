import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface BookingHeaderButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface BookingHeaderActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

/** Web : bouton avec libellé (pilule claire) pour l'en-tête large ; à placer dans `right`. */
export const BookingHeaderAction: React.FC<BookingHeaderActionProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.action} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
    <Ionicons name={icon} size={18} color={Colors.lblueDark} />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

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
  /**
   * Version WEB seulement : en-tête large comme les pages du profil (« Informations personnelles ») :
   * 100 px de haut, flèche et titre à gauche, en gardant le fond bleu et le texte blanc.
   * Sans effet sur mobile.
   */
  webLarge?: boolean;
}

export const BookingScreenHeader: React.FC<BookingScreenHeaderProps> = ({ title, onBack, right, webLarge }) =>
  webLarge && Platform.OS === 'web' ? (
    <View style={[styles.header, styles.headerLarge]}>
      {onBack && (
        <TouchableOpacity style={styles.backLarge} onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, styles.titleLarge]} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={styles.rightLarge}>{right}</View> : null}
    </View>
  ) : (
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
  // En-tête large (web) : mêmes mesures que ProfileInfoView.web.
  headerLarge: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
  },
  backLarge: {
    padding: 4,
    paddingRight: Spacings.md,
  },
  titleLarge: {
    flex: 1,
  },
  rightLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginLeft: Spacings.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: Spacings.md,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.lblueDark,
  },
  right: {
    position: 'absolute',
    right: Spacings.md,
    flexDirection: 'row',
    gap: Spacings.xs,
  },
});