import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BouncingDotsProps {
  color?: string;        // Dot color (default: #007AFF)
  size?: number;         // Icon size (default: 12)
  bounceHeight?: number; // Jump height (default: 10)
  containerStyle?: ViewStyle; // Optional container style
}

export const BouncingDots: React.FC<BouncingDotsProps> = ({
  color = '#007AFF',
  size = 12,
  bounceHeight = 10,
  containerStyle,
}) => {
  // Initialize animated values for each dot
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Define the animation sequence for a single dot
    const createAnimation = (value: Animated.Value) => {
      return Animated.sequence([
        // Move up
        Animated.timing(value, {
          toValue: -bounceHeight,
          duration: 300,       // Duration for moving up
          easing: Easing.ease, // Smooth easing
          useNativeDriver: true, // Important: Run on UI thread for performance
        }),
        // Move down
        Animated.timing(value, {
          toValue: 0,
          duration: 300,         // Duration for moving down
          easing: Easing.bounce, // Bounce effect upon impact
          useNativeDriver: true,
        }),
      ]);
    };

    // Create animation configuration for all dots
    const animations = animatedValues.map((value) => createAnimation(value));

    // Start an infinite loop
    Animated.loop(
      // Stagger: Start animations with a 150ms delay to create a wave effect
      Animated.stagger(150, animations)
    ).start();

    // No cleanup required; React Native handles animation cancellation on unmount
  }, [bounceHeight, animatedValues]);

  return (
    <View style={[styles.container, containerStyle]}>
      {animatedValues.map((value, index) => (
        <Animated.View
          key={index}
          style={{
            transform: [{ translateY: value }], // Move vertically
            marginHorizontal: 2, // Horizontal spacing between dots
          }}
        >
          {/* Use a solid circle icon */}
          <Ionicons name="ellipse" size={size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40, // Fixed height to prevent layout shifts during animation
  },
});