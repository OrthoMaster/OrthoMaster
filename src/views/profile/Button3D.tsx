import React, { useState } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Épaisseur du bouton : la tranche visible sous la face. */
const DEPTH = 5;

interface Button3DProps {
  /** Couleur de la face (bas du dégradé). */
  color: string;
  /** Haut du dégradé, plus clair. */
  light: string;
  /** Tranche sous la face, plus sombre. */
  edge: string;
  radius?: number;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Contenu posé sur la face (texte). */
  children: React.ReactNode;
  /** Illustration qui déborde de la face (positionnée en absolu par l'appelant). */
  decoration?: React.ReactNode;
  faceStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bouton « 3D » (mobile) : une face en dégradé avec un liseré clair en haut, posée sur une tranche
 * plus sombre ; à l'appui, la face s'enfonce sur la tranche. L'illustration peut déborder de la face.
 */
export const Button3D: React.FC<Button3DProps> = ({
  color,
  light,
  edge,
  radius = 40,
  onPress,
  accessibilityLabel,
  children,
  decoration,
  faceStyle,
  style,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, style]}
    >
      {/* Tranche + ombre portée */}
      <View style={[styles.edge, { backgroundColor: edge, borderRadius: radius }]} />

      <View style={[styles.face, { transform: [{ translateY: pressed ? DEPTH - 1 : 0 }] }]}>
        <LinearGradient
          colors={[light, color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.gradient, { borderRadius: radius }, faceStyle]}
        >
          {children}
        </LinearGradient>
        {decoration}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: DEPTH,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DEPTH,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  face: {
    // Au-dessus de la tranche (Android : l'élévation de la tranche la ferait passer devant).
    elevation: 5,
    zIndex: 1,
  },
  gradient: {
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
});
