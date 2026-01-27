import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from "../../../../constants/Colors";

const LessonLogoIcon = ({
  color = Colors.blue,
  secondaryColor = Colors.white,
  size = 100,
  image = null,
  type = 'lesson',
  selected = false,
  passed = true,
  blocked = false
}) => {
  const wave = useRef(new Animated.Value(0)).current;

  // Get darker color for 3D effect (bottom border)
  const get3DColor = (hex) => {
    if (!hex || hex === Colors.gray) {
      return '#666666';
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Darker by 30% (multiply by 0.7)
    return `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
  };

  const depth3D = size * 0.12; // 3D depth - same as paddingBottom in HomeHeader

  useEffect(() => {
    if (selected) {
      // Wave animatio
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      wave.setValue(0);
    }
  }, [selected]);

  const getWaveStyle = () => {
    const scale = wave.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    const opacity = wave.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    });

    return {
      transform: [{ scale }],
      opacity,
    };
  };

  return (
    <View style={styles.container}>
      {/* Wave border */}
      {selected && (
        <Animated.View
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              // borderColor: secondaryColor,
              borderColor: Colors.yellowDark,
              borderWidth: 5,
            },
            getWaveStyle(),
          ]}
        />
      )}

      {/* 3D Wrapper - creates the bottom shadow effect */}
      <View
        style={[
          styles.wrapper3D,
          {
            width: size,
            borderRadius: size / 2,
            backgroundColor: passed ? get3DColor(color) : get3DColor(secondaryColor),
            paddingBottom: depth3D, // This creates the 3D depth at bottom
            opacity: passed ? 1 : 0.5,
          },
        ]}
      >
        {/* Coin */}
        <View
          style={[
            styles.coin,
            {
              width: size,
              height: size * 0.96,
              borderRadius: size / 2,
              backgroundColor: passed ? color : Colors.darkBackground,
              opacity: passed ? 1 : 0.6,
              borderColor: color
            },
          ]}
        >
          {image ? (
            <Image
              source={typeof image === 'string' ? { uri: process.env.EXPO_PUBLIC_S3_URL + image } : image}
              style={[
                styles.image,
                {
                  width: size * 0.8,
                  height: size * 0.8,
                  borderRadius: 100,
                },
              ]}
              contentFit="contain"
            />
          ) : (
            <>
              {type == 'lesson' && (<MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={size * 0.5}
                color={blocked ? Colors.white : (passed ? Colors.white : secondaryColor)}
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 3,
                }}
              />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    zIndex: 0,
  },
  waveRing: {
    position: 'absolute',
    zIndex: 0,
    backgroundColor: 'transparent',
  },
  wrapper3D: {
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  coin: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  image: {
    overflow: 'hidden',
  },
});

export default LessonLogoIcon;