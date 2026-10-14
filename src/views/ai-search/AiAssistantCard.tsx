import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Animated, Easing, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { AI_CHARACTER_URL } from './AiAvatar';

const { width } = Dimensions.get('window');
const isLarge = Platform.OS === 'web' || width >= 768;

/*
 * Le personnage dépasse largement au-dessus de la carte : elle ne fait que 60 % de sa hauteur.
 * Son image est à fond transparent, il est donc posé directement sur le fond rouge clair.
 */
const CHARACTER_SIZE = isLarge ? 150 : 120;
const CARD_HEIGHT = Math.round(CHARACTER_SIZE * 0.6);
const OVERFLOW = CHARACTER_SIZE - CARD_HEIGHT;

/*
 * Début du texte : juste après l'épaule droite du personnage (le buste s'arrête vers 88 %
 * de la largeur de l'image, le reste est transparent), plus un espace franc.
 */
const TEXT_OFFSET = Math.round(CHARACTER_SIZE * 0.88) + Spacings.md;

/** Épaisseur de la tranche visible sous la carte, qui donne l'effet de relief. */
const DEPTH = 6;

const useNativeDriver = Platform.OS !== 'web';

type Props = {
  onPress: () => void;
};

/**
 * Invitation à ouvrir l'assistant, affichée en tête des suggestions de la recherche
 * (mobile et web). Carte en relief : une face éclairée par le haut posée sur une tranche
 * plus sombre ; au survol elle se soulève, à l'appui elle s'enfonce.
 * Le texte est écrit comme une réplique du personnage.
 */
export const AiAssistantCard: React.FC<Props> = ({ onPress }) => {
  // Petite flèche qui avance puis revient : invite au clic sans clignoter.
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(nudge, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver }),
        Animated.delay(1800),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [nudge]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir l'assistant IA"
      style={styles.wrapper}
    >
      {({ hovered, pressed }: any) => (
        <View style={styles.container}>
          {/* Tranche : reste en place, la face monte ou descend par-dessus */}
          <View style={[styles.edge, hovered && !pressed && styles.edgeHovered]} />

          <View
            style={[
              styles.face,
              hovered && !pressed && styles.faceHovered,
              pressed && styles.facePressed,
            ]}
          >
            {/* Lumière venant du haut : plus clair en haut, rouge clair en bas */}
            <LinearGradient
              colors={['#FFF6F7', Colors.red3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.faceBackground}
            />

            {/* Ancré en bas de la carte, il dépasse par le haut */}
            <Image source={{ uri: AI_CHARACTER_URL }} style={styles.character} resizeMode="contain" />

            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>Je vous guide !</Text>
              {/* Deux lignes au maximum : sur un écran étroit, la police se réduit un peu plutôt que de couper. */}
              <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {'Décrivez-moi votre besoin,\nje trouve les bonnes vidéos.'}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.cta,
                { transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }] },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </Animated.View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const RADIUS = 18;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacings.lg,
    // Place pour la partie du personnage qui dépasse.
    marginTop: Spacings.md + OVERFLOW,
    marginBottom: Spacings.xs + DEPTH,
  },
  container: {
    position: 'relative',
  },

  /* ---- Relief ---- */
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DEPTH,
    bottom: -DEPTH,
    borderRadius: RADIUS,
    backgroundColor: '#E8A9B0',
    // Ombre portée sur la page, sous la tranche.
    shadowColor: Colors.redDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  edgeHovered: {
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    minHeight: CARD_HEIGHT,
    paddingLeft: TEXT_OFFSET,
    paddingRight: Spacings.md,
    paddingVertical: Spacings.sm,
    borderRadius: RADIUS,
    // Arête supérieure claire, côtés à peine teintés : accentue l'éclairage par le haut.
    borderWidth: 1,
    borderColor: 'rgba(200, 30, 45, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    // Sur Android, elevation fait passer la face devant la tranche.
    elevation: 6,
    transitionDuration: '120ms' as any,
  },
  faceHovered: {
    transform: [{ translateY: -2 }],
  },
  facePressed: {
    transform: [{ translateY: DEPTH - 1 }],
  },
  faceBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
  },
  character: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
  },

  /* ---- Texte ---- */
  info: {
    flex: 1,
  },
  title: {
    fontSize: isLarge ? 17 : 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.redDark,
    lineHeight: isLarge ? 24 : 21,
  },
  text: {
    fontSize: isLarge ? 14 : 13,
    fontFamily: 'Roboto',
    color: Colors.text,
    lineHeight: isLarge ? 20 : 18,
  },

  /* ---- Bouton fléché, lui aussi en relief ---- */
  cta: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    borderBottomWidth: 3,
    borderBottomColor: Colors.redDark,
  },
});