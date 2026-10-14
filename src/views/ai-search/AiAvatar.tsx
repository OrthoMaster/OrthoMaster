import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';

/** Personnage de l'assistant, en avatar rond (bulles de chat, accueil du chat). */
export const AI_AVATAR_URL = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/ai/ai_avatar.png';

/**
 * Personnage en pied pour la carte d'invitation de la recherche (AiAssistantCard).
 * La carte a un fond rouge clair : il faut une image à fond TRANSPARENT (PNG ou WebP),
 * sinon un carré blanc apparaît autour du personnage.
 */
export const AI_CHARACTER_URL = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/ai/ai_avatar_min-removebg-preview.png';

/*
 * Image entière dans le cercle, légèrement réduite et posée vers le bas : le chapeau
 * tient sous le bord supérieur, les épaules sont coupées par le bas du cercle comme
 * sur un portrait.
 */
const IMAGE_SCALE = 0.92;
const IMAGE_OFFSET_Y = 0.08;

type Props = {
  size: number;
  /** Pastille rouge aux étoiles, en bas à droite. */
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Portrait rond sur fond rouge clair, fine bordure rouge. Les proportions (pastille,
 * icône) suivent la taille, de l'avatar de bulle (34 px) à l'accueil du chat (~110 px) ;
 * la pastille reprend la même épaisseur de bordure que le cercle.
 */
export const AiAvatar: React.FC<Props> = ({ size, showBadge = true, style }) => {
  const border = size >= 80 ? 1.5 : 1;
  // Pastille discrète : environ un quart de l'avatar, même épaisseur de bordure que lui.
  const badge = Math.max(12, Math.round(size * 0.28));
  const badgeIcon = Math.max(7, Math.round(badge * 0.5));

  const imageSize = size * IMAGE_SCALE;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, borderWidth: border },
        ]}
      >
        <Image
          source={{ uri: AI_AVATAR_URL }}
          resizeMode="contain"
          style={{
            position: 'absolute',
            width: imageSize,
            height: imageSize,
            left: (size - imageSize) / 2,
            top: size * IMAGE_OFFSET_Y,
          }}
        />
      </View>

      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              borderWidth: border,
              // Posée sur le bord du cercle, sans en sortir franchement.
              right: -Math.round(badge * 0.05),
              bottom: -Math.round(badge * 0.05),
            },
          ]}
        >
          <Ionicons name="sparkles" size={badgeIcon} color={Colors.white} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderColor: Colors.red,
    backgroundColor: Colors.red3,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    borderColor: Colors.white,
  },
});