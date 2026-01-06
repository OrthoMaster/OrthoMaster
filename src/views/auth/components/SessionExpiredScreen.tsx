// components/SessionExpiredScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const { width, height } = Dimensions.get('window');

interface FloatingIcon {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface SessionExpiredScreenProps {
  visible: boolean;
  onLoginPress: () => void;
}

const SessionExpiredScreen: React.FC<SessionExpiredScreenProps> = ({ visible, onLoginPress }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([]);
  const iconIdCounter = useRef(0);

  // Function to create floating icon
  const createFloatingIcon = (): FloatingIcon => {
    const id = iconIdCounter.current++;
    return {
      id,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(height + 50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.3 + 0.3),
      opacity: new Animated.Value(0.3),
    };
  };

  // Function to animate floating icon
  const animateFloatingIcon = (icon: FloatingIcon) => {
    const riseDuration = 8000 + Math.random() * 4000;

    Animated.parallel([
      // Float up
      Animated.timing(icon.y, {
        toValue: -100,
        duration: riseDuration,
        useNativeDriver: true,
      }),
      // Gentle rotation
      Animated.loop(
        Animated.timing(icon.rotate, {
          toValue: 360,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        })
      ),
      // Gentle swing
      Animated.loop(
        Animated.sequence([
          Animated.timing(icon.x, {
            toValue: icon.x._value + (Math.random() * 60 - 30),
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(icon.x, {
            toValue: icon.x._value,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start(() => {
      setFloatingIcons((prev) => prev.filter((i) => i.id !== icon.id));
    });
  };

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      iconIdCounter.current = 0;

      // Create initial floating icons
      const initialIcons = Array.from({ length: 8 }, () => createFloatingIcon());
      setFloatingIcons(initialIcons);
      initialIcons.forEach((icon) => animateFloatingIcon(icon));

      // Animate main content
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Create new floating icons periodically
      const interval = setInterval(() => {
        const newIcon = createFloatingIcon();
        setFloatingIcons((prev) => [...prev, newIcon]);
        animateFloatingIcon(newIcon);
      }, 1500);

      return () => clearInterval(interval);
    } else {
      setFloatingIcons([]);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onLoginPress}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />
      <View style={styles.container}>
        {/* Floating Icons */}
        {floatingIcons.map((icon) => (
          <Animated.View
            key={icon.id}
            style={[
              styles.floatingIcon,
              {
                transform: [
                  { translateX: icon.x },
                  { translateY: icon.y },
                  {
                    rotate: icon.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { scale: icon.scale },
                ],
                opacity: icon.opacity,
              },
            ]}
          >
            <Ionicons name="lock-closed" size={24} color={Colors.white} />
          </Animated.View>
        ))}

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-account-outline" size={70} color={Colors.white} />
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Session expirée</Text>

          {/* Message */}
          <Text style={styles.message}>
            Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter pour continuer à utiliser l'application.
          </Text>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
            <Text style={styles.loginButtonText}>Se reconnecter</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            Cette déconnexion automatique protège votre compte
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingIcon: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    zIndex: 1,
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: Spacings.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.md,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.sm,
    lineHeight: 24,
  },
  
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.xl * 1.5,
    paddingVertical: Spacings.md + 2,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: Spacings.lg,
    marginTop: Spacings.xl,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SessionExpiredScreen;