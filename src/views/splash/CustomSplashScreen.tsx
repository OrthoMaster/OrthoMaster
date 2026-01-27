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
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Hide splash screen native
    SplashScreen.hideAsync();

    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 2500);

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
          <Image
            source={require('../../../assets/v2_images/logo/brand_name_white.png')}
            style={styles.brand}
            resizeMode="contain"
          />
        </Animated.View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
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
    height: 30,
    width: 150,
  },
});

export default CustomSplashScreen;