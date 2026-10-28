import React, { useRef } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/** Hauteur de la tranche : la face s'enfonce d'autant quand on appuie. */
const PRESS_DEPTH = 5;

/** Illustration hébergée sur S3 : modifiable sans nouvelle version de l'application. */
const ILLUSTRATION_URL = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/settings/booking_expert.png';

/**
 * Ratio largeur / hauteur de l'illustration. Fixé en dur pour réserver la place
 * avant le chargement : la carte ne saute pas quand l'image arrive.
 */
const ILLUSTRATION_RATIO = 2.53;

interface BookingEntryCardProps {
  isExpert: boolean;
  onPress: () => void;
}

export const BookingEntryCard: React.FC<BookingEntryCardProps> = ({ isExpert, onPress }) => {
  const press = useRef(new Animated.Value(0)).current;

  const animatePress = (toValue: number) => {
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: true }).start();
  };

  const translateY = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PRESS_DEPTH],
  });

  const title = isExpert ? 'Mon espace expert' : 'Échanger avec un expert';

  return (
    <Pressable
      style={styles.wrapper}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.edge}>
        <Animated.View style={[styles.face, { transform: [{ translateY }] }]}>
          <Image
            source={{ uri: ILLUSTRATION_URL }}
            style={styles.illustration}
            resizeMode="contain"
          />

          <View style={styles.footer}>
            <View style={styles.texts}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {isExpert
                  ? 'Vos demandes, votre agenda et vos disponibilités.'
                  : 'Réservez un échange en visio avec un expert sur un sujet de votre pratique.'}
              </Text>
            </View>

            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={20} color={Colors.greenDark} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte 3D ---- */
  wrapper: {
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.md,
    marginBottom: Spacings.xs,
  },
  edge: {
    backgroundColor: Colors.greenDark,
    borderRadius: 16,
    paddingBottom: PRESS_DEPTH,
  },
  face: {
    backgroundColor: Colors.green,
    borderRadius: 16,
    padding: Spacings.sm,
  },

  /* ---- Illustration ---- */
  illustration: {
    width: '100%',
    aspectRatio: ILLUSTRATION_RATIO,
  },

  /* ---- Contenu ---- */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingTop: Spacings.sm,
    paddingHorizontal: Spacings.xxs,
    paddingBottom: Spacings.xxs,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.white,
  },
  description: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.white,
    marginTop: Spacings.xxxs,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});