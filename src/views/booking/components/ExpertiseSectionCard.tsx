import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface ExpertiseSectionCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  summary: string;
  /** Résumé en orange : la section bloque la réception de demandes. */
  warning?: boolean;
  /** Dernière ligne de la liste : pas de filet dessous. */
  last?: boolean;
  onPress: () => void;
}

/**
 * Ligne d'une liste de réglages : sans fond ni relief, séparée de la suivante par un filet.
 */
export const ExpertiseSectionCard: React.FC<ExpertiseSectionCardProps> = ({ icon, title, summary, warning, last, onPress }) => (
  <TouchableOpacity
    style={[styles.row, !last && styles.rowDivider]}
    onPress={onPress}
    activeOpacity={0.6}
    accessibilityRole="button"
  >
    <View style={styles.medallion}>
      <MaterialCommunityIcons name={icon} size={24} color={Colors.lblueDark} />
    </View>

    <View style={styles.texts}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.summary, warning && styles.summaryWarning]} numberOfLines={1}>
        {summary}
      </Text>
    </View>

    <Ionicons name="chevron-forward" size={22} color={Colors.subtext} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingVertical: Spacings.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  medallion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.text,
  },
  summary: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.subtext2,
    marginTop: 2,
  },
  summaryWarning: {
    color: Colors.warning,
  },
});