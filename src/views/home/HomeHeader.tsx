import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = (width - (Spacings.xl * 2) - (Spacings.md * 2)) / 3;

interface HomeHeaderProps {
  userName?: string;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onToolPress?: () => void;
  hasNotification?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  onNotificationPress,
  onSearchPress,
  onToolPress,
  hasNotification = false,
}) => {
  // Animation cho notification icon
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasNotification) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(shakeAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: -1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: -1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.delay(1500),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      scaleAnim.setValue(1);
      shakeAnim.setValue(0);
    }
  }, [hasNotification]);

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      {/* Top Row: Logo and Notifications */}
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../../assets/v2_images/logo/logo_primary_1024.png')}
          />
          <Text style={styles.logoText}>OrthoMaster</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          {hasNotification ? (
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateInterpolate },
                ],
              }}
            >
              <Ionicons name="notifications" size={28} color={Colors.primary} />
            </Animated.View>
          ) : (
            <Ionicons name="notifications" size={28} color={Colors.gray} />
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>Bonjour</Text>
        <Text style={styles.userNameText}>{userName}</Text>
      </View>

      {/* Square Cards in V Formation */}
      <View style={styles.cardsContainer}>
        {/* Left Card - Question */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard]}
              onPress={() => Linking.openURL('mailto:question@orthomaster.fr')}
              activeOpacity={0.8}
            >
              <Image
                style={[styles.icons]}
                source={require('../../../assets/v2_images/icon/home/question.gif')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText]}>Poser une{'\n'}Question</Text>
        </View>

        {/* Center Card (Bottom) - Outils */}
        <View style={[styles.cardWrapper]}>
          <View style={[styles.card3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard]}
              onPress={onToolPress}
              activeOpacity={0.8}
            >
              <Image
                style={[styles.icons, {width: CARD_SIZE - 5, height: CARD_SIZE - 5, borderRadius: 16}]}
                source={require('../../../assets/v2_images/icon/home/tool.gif')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText]}>Prise en{'\n'}Charge</Text>
        </View>

        {/* Right Card - Search */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard]}
              onPress={onSearchPress}
              activeOpacity={0.8}
            >
              <Image
                style={[styles.icons]}
                source={require('../../../assets/v2_images/icon/home/search.gif')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText]}>Chercher un{'\n'}Contenu</Text>
        </View>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.lg,
    backgroundColor: Colors.white,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    resizeMode: 'contain',
    width: 25,
    height: 25,
    marginRight: Spacings.xs
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },

  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  greetingSection: {
    marginBottom: Spacings.sm,
    alignItems: 'center',
    position: 'relative',
  },
  greetingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: -4,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: Spacings.xxs,
    gap: Spacings.md,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  centerCardWrapper: {
    marginTop: Spacings.xl,
  },
  
  // 3D Wrapper for cards
  card3DWrapper: {
    borderRadius: 20,
    paddingBottom: 4,
    backgroundColor: Colors.grayLight,
  },
  question3DWrapper: {
    backgroundColor: Colors.greenDark,
  },
  outil3DWrapper: {
    backgroundColor: Colors.lblueDark,
  },
  search3DWrapper: {
    backgroundColor: Colors.primary,
  },
  
  squareCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + Spacings.xs,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: Colors.white,
  },
  searchCard: {
    backgroundColor: Colors.primaryLight,
  },
  outilCard: {
    backgroundColor: Colors.lblue,
  },
  questionCard: {
    backgroundColor: Colors.green,
  },
  cardText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.sm,
    textAlign: 'center',
  },
  icons: {
    resizeMode: 'contain',
    width: 70,
    height: 70,
  }
});