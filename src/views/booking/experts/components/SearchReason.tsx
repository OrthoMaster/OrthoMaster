import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

/** Recherche intelligente : la raison courte pour laquelle un résultat correspond (mobile et web). */
export const SearchReason: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.row}>
    <Ionicons name="sparkles" size={12} color={Colors.lblueDark} style={styles.icon} />
    <Text style={styles.text} numberOfLines={2}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: Spacings.xxs,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.lblueDark,
  },
});
