import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationScreenProps {
  visible: boolean;
  onComplete?: () => void;
}

interface Confetti {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
}

const CelebrationScreen: React.FC<CelebrationScreenProps> = ({ visible, onComplete }) => {
  // Create 60 confetti pieces
  const confetti = useRef<Confetti[]>(
    Array.from({ length: 60 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(-50),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      confetti.forEach((item) => {
        item.x.setValue(0);
        item.y.setValue(-50);
        item.opacity.setValue(1);
      });

      // Create falling confetti animations
      const animations = confetti.map((item, index) => {
        // Random horizontal position
        const startX = Math.random() * width;
        // Random swing amplitude
        const swingAmount = -50 + Math.random() * 100;
        // Stagger the start time
        const delay = Math.random() * 800;

        return Animated.parallel([
          // Fall down
          Animated.timing(item.y, {
            toValue: height + 50,
            duration: 3000 + Math.random() * 1000,
            delay,
            useNativeDriver: true,
          }),
          // Swing horizontally
          Animated.sequence([
            Animated.delay(delay),
            Animated.loop(
              Animated.sequence([
                Animated.timing(item.x, {
                  toValue: startX + swingAmount,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(item.x, {
                  toValue: startX - swingAmount,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
              { iterations: 3 }
            ),
          ]),
          // Fade out near the end
          Animated.sequence([
            Animated.delay(delay + 2500),
            Animated.timing(item.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      // Start all animations
      Animated.parallel([...animations]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  // Confetti types with colors and shapes
  const confettiTypes = [
    { emoji: '🎓', color: '#4A90E2' }, // Graduation cap
    { emoji: '⭐', color: '#FFD700' }, // Star
    { emoji: '🎉', color: '#FF6B9D' }, // Party popper
    { emoji: '🌸', color: '#FF69B4' }, // Flower
    { emoji: '✨', color: '#FFA07A' }, // Sparkles
    { emoji: '🎊', color: '#87CEEB' }, // Confetti ball
    { emoji: '💐', color: '#FF1493' }, // Bouquet
    { emoji: '🏆', color: '#FFD700' }, // Trophy
  ];

  const shapes = ['square', 'circle', 'rectangle', 'emoji'];
  const colors = [
    '#FF6B9D', '#4ECDC4', '#FFD700', '#FF6F61', 
    '#95E1D3', '#FFA07A', '#FF1493', '#00CED1',
    '#9B59B6', '#3498DB', '#E74C3C', '#F39C12'
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Falling confetti */}
      {confetti.map((item, index) => {
        const startX = Math.random() * width;
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const confettiType = confettiTypes[Math.floor(Math.random() * confettiTypes.length)];
        
        return (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              shape === 'emoji' ? styles.emoji : styles.confettiPiece,
              {
                left: startX,
                opacity: item.opacity,
                transform: [
                  { translateX: item.x },
                  { translateY: item.y },
                ],
              },
              shape === 'square' && { 
                backgroundColor: color,
                width: 10,
                height: 10,
              },
              shape === 'circle' && { 
                backgroundColor: color,
                width: 12,
                height: 12,
                borderRadius: 6,
              },
              shape === 'rectangle' && { 
                backgroundColor: color,
                width: 14,
                height: 8,
              },
            ]}
          >
            {shape === 'emoji' && (
              <Text style={styles.emojiText}>{confettiType.emoji}</Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
  },
  emoji: {
    position: 'absolute',
  },
  emojiText: {
    fontSize: 24,
  },
});

export default CelebrationScreen;