import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import { initials } from '../bookingFormat';

interface ExpertAvatarProps {
  uri: string | null;
  name: string;
  size: number;
  ringColor?: string;
  ringWidth?: number;
  /** Fond et couleur des initiales quand il n'y a pas de photo. */
  fillColor?: string;
  initialsColor?: string;
}

/** Photo de l'expert, initiales à défaut ; même rendu partout dans l'espace rendez-vous. */
export const ExpertAvatar: React.FC<ExpertAvatarProps> = ({
  uri,
  name,
  size,
  ringColor = Colors.lblue3,
  ringWidth = 3,
  fillColor = Colors.lblue3,
  initialsColor = Colors.lblueDark,
}) => {
  const inner = size - ringWidth * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: ringColor,
          backgroundColor: fillColor,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.32), color: initialsColor }]}>{initials(name)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
  },
});