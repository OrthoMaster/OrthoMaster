import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, ScrollView, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { CONSULT_COLOR, CONSULT_COLOR_DARK } from '../bookingKinds';

const IS_WEB = Platform.OS === 'web';
/** Hauteur de la tranche : la face s'enfonce d'autant quand on appuie. */
const PRESS_DEPTH = 5;
const WEB_MAX_WIDTH = 640;

interface ChoiceCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  points: string[];
  face: string;
  edge: string;
  onPress: () => void;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ icon, title, description, points, face, edge, onPress }) => {
  const press = useRef(new Animated.Value(0)).current;
  const animatePress = (toValue: number) =>
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: !IS_WEB }).start();
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.edge, { backgroundColor: edge }]}>
        <Animated.View style={[styles.face, { backgroundColor: face, transform: [{ translateY }] }]}>
          <View style={styles.cardHead}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={26} color={edge} />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.arrow}>
              <Ionicons name="arrow-forward" size={18} color={edge} />
            </View>
          </View>
          <Text style={styles.cardText}>{description}</Text>
          <View style={styles.points}>
            {points.map((point) => (
              <View key={point} style={styles.point}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

/**
 * Premier écran de l'onglet Experts (mobile et web) : deux façons de réserver un expert.
 *  - Thèmes : liste Experts | Thèmes, puis thème et demi-journées.
 *  - Consultation : experts qui la proposent, puis la demande (sujet, durée, horaire).
 */
export const BookingChoiceView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + Spacings.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, IS_WEB && styles.innerWeb]}>
          <Text style={styles.title}>Comment souhaitez-vous échanger ?</Text>
          <Text style={styles.subtitle}>Deux façons de profiter de l'expérience d'un confrère.</Text>

          <View style={styles.cards}>
            <ChoiceCard
              icon="bulb-outline"
              title="Thèmes"
              description="Choisissez un thème proposé par un expert, en visio ou sur place."
              points={['Programme préparé par l\'expert', 'Par demi-journées', 'Recherche par expert ou par thème']}
              face={Colors.lblue}
              edge={Colors.lblueDark}
              onPress={() => navigation.push('experts-list')}
            />
            <ChoiceCard
              icon="chatbubbles-outline"
              title="Consultation"
              description="Posez votre question à l'expert de votre choix, sur le sujet de votre choix."
              points={['Toujours en visio', 'Par tranches de 30 minutes', 'Dans son agenda ou à une autre date']}
              face={CONSULT_COLOR}
              edge={CONSULT_COLOR_DARK}
              onPress={() => navigation.push('experts-list', { purpose: 'consultation' })}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  inner: {
    gap: Spacings.xs,
  },
  innerWeb: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Roboto',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.subtext2,
  },
  cards: {
    gap: Spacings.lg,
    marginTop: Spacings.lg,
  },

  /* ---- Carte 3D ---- */
  edge: {
    borderRadius: 20,
    paddingBottom: PRESS_DEPTH,
  },
  face: {
    borderRadius: 20,
    padding: Spacings.lg,
    gap: Spacings.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.white,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.white,
  },
  points: {
    gap: 6,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  pointText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.white,
  },
});
