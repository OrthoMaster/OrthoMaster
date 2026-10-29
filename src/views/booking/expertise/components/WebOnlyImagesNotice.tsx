import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

export const WEB_ONLY_IMAGES_TEXT = "La modification des images n'est disponible que sur la version web.";

/**
 * Version mobile : pas de sélecteur d'images dans l'application (aucune librairie ajoutée).
 * Photo de profil et images des offres se modifient sur la version web.
 */
export const WebOnlyImagesNotice: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.notice, style]}>
    <Ionicons name="desktop-outline" size={16} color={Colors.lblueDark} />
    <Text style={styles.text}>{WEB_ONLY_IMAGES_TEXT}</Text>
  </View>
);

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
  },
});
