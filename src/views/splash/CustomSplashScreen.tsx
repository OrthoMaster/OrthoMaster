import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ImageBackground, StyleSheet, Animated, Image, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

SplashScreen.preventAutoHideAsync();

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Hide splash screen native
    SplashScreen.hideAsync();

    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={require('../../../assets/v2_images/logo/background_primary.webp')}
        resizeMode="cover"
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/v2_images/logo/logo_white_1024.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>OrthoMaster</Text>
        </Animated.View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: Spacings.md,
  },
  brand: {
    fontSize: 30,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});

export default CustomSplashScreen;