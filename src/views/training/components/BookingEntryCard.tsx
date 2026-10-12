import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/** Hauteur de la tranche : la face s'enfonce d'autant quand on appuie. */
const PRESS_DEPTH = 5;

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

  return (
    <Pressable
      style={styles.wrapper}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
    >
      <View style={styles.edge}>
        <Animated.View style={[styles.face, { transform: [{ translateY }] }]}>
          <View style={styles.medallion}>
            <MaterialCommunityIcons
              name={isExpert ? 'calendar-account' : 'account-voice'}
              size={30}
              color={Colors.lblueDark}
            />
          </View>

          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={1}>
              {isExpert ? 'Mon espace expert' : 'Échanger avec un expert'}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {isExpert
                ? 'Vos demandes, votre agenda et vos disponibilités.'
                : 'Réservez un échange en visio avec un expert sur un sujet de votre pratique.'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color={Colors.white} />
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
    backgroundColor: Colors.lblueDark,
    borderRadius: 16,
    paddingBottom: PRESS_DEPTH,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: Colors.lblue,
    borderRadius: 16,
    paddingVertical: Spacings.md,
    paddingLeft: Spacings.md,
    paddingRight: Spacings.sm,
  },

  /* ---- Contenu ---- */
  medallion: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
    marginTop: Spacings.xxxs,
  },
});