import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from "../../../../constants/Colors";

const LessonLogoIcon = ({
  color = Colors.primaryLight,
  size = 100,
  image = null,
  type = 'lesson',
  selected = false,
  passed = true
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  const getBorderColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * 0.9)}, ${Math.floor(g * 0.9)}, ${Math.floor(b * 0.9)})`;
  };

  const borderColor = getBorderColor(color);
  const borderWidth = size * 0.08;

  useEffect(() => {
    if (selected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 1
      Animated.loop(
        Animated.timing(wave1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Wave 2
      setTimeout(() => {
        Animated.loop(
          Animated.timing(wave2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      }, 600);
    } else {
      bounceAnim.setValue(0);
      wave1.setValue(0);
      wave2.setValue(0);
    }
  }, [selected]);

  const getWaveStyle = (waveAnim) => {
    const scale = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1.3],
    });

    const opacity = waveAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.7, 0.4, 0],
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
        <>
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: (size * 1.1) / 2,
                borderColor: color,
                borderWidth: 3,
              },
              getWaveStyle(wave1),
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: (size * 1.1) / 2,
                borderColor: color,
                borderWidth: 3,
              },
              getWaveStyle(wave2),
            ]}
          />
        </>
      )}

      {/* Coin */}
      <Animated.View
        style={[
          styles.coin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: passed ? color : Colors.gray,
            borderWidth: borderWidth,
            borderColor: passed ? borderColor : getBorderColor(Colors.gray),
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        {image ? (
          <Image
            source={typeof image === 'string' ? { uri: process.env.EXPO_PUBLIC_S3_URL + image } : image}
            style={[
              styles.image,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: (size * 0.5) / 2,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <>
            {type == 'lesson' && (<MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={size * 0.5}
              color={passed ? Colors.white : Colors.grayLight}
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}
            />
            )}

            {type == 'test' && (<MaterialCommunityIcons
              name="sticker-check"
              size={size * 0.5}
              color={passed ? Colors.white : Colors.grayLight}
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}
            />
            )}
          </>
        )}
      </Animated.View>
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
  coin: {
    justifyContent: 'center',
    alignItems: 'center',
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
  image: {
    overflow: 'hidden',
  },
});

export default LessonLogoIcon;