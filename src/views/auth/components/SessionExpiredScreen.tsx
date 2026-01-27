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
  Modal,
  Image
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
  
  // Animation cho icon giống thần đèn
  const floatAnim = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animation hiển thị màn hình
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation lắc qua lắc lại (swing)
      Animated.loop(
        Animated.sequence([
          Animated.timing(swingAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(swingAnim, {
            toValue: -1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(swingAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation bay lên xuống (floating)
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation pulse nhẹ
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  // Chuyển đổi giá trị swing thành góc xoay
  const rotateInterpolate = swingAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

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
          {/* Icon với animation thần đèn */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { translateY: floatAnim },
                  { rotate: rotateInterpolate },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <Image
              style={styles.iconCircle}
              resizeMode="contain"
              source={require('../../../../assets/v2_images/icon/exp_session.png')}
            />
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
    width: 180,
    height: 180,
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    width: '70%'
  },
});

export default SessionExpiredScreen;