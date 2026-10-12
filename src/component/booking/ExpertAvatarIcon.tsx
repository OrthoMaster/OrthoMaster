import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import Colors from '../../../constants/Colors';
import { initials } from '../../views/booking/bookingFormat';

interface ExpertAvatarIconProps {
  uri: string | null;
  name: string;
  size: number;
  focused: boolean;
}

const RING = 2;

/**
 * Icône de l'onglet Expertise : l'avatar de l'expert, initiales à défaut.
 * Liseré bleu au repos, blanc sur la pastille bleue de l'onglet actif.
 */
export const ExpertAvatarIcon: React.FC<ExpertAvatarIconProps> = ({ uri, name, size, focused }) => {
  // Un peu plus grand que les pictogrammes : un visage se lit moins bien qu'un trait.
  const outer = size + RING * 2;
  const inner = outer - RING * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderColor: focused ? Colors.white : Colors.lblue,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.42) }]}>{initials(name)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    borderWidth: RING,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.lblue3,
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    color: Colors.lblueDark,
  },
});