// components/CelebrationScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  icon: string;
}

const CelebrationScreen = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const confettiIdCounter = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Colors for confetti
  const confettiColors = [
    Colors.warning,
    Colors.success,
    Colors.info,
    '#FFD700',
    '#FF69B4',
    '#00CED1',
  ];

  const confettiIcons = [
    'star',
    'heart',
    'sparkles',
    'ribbon',
    'trophy',
    'gift',
  ];

  // Function to create a new confetti piece
  const createConfettiPiece = (): ConfettiPiece => {
    const id = confettiIdCounter.current++;
    return {
      id,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      icon: confettiIcons[Math.floor(Math.random() * confettiIcons.length)],
    };
  };

  // Function to animate a confetti piece
  const animateConfetti = (piece: ConfettiPiece) => {
    const fallDuration = 3000 + Math.random() * 2000;

    Animated.parallel([
      // Fall down
      Animated.timing(piece.y, {
        toValue: height + 100,
        duration: fallDuration,
        useNativeDriver: true,
      }),
      // Rotate
      Animated.loop(
        Animated.timing(piece.rotate, {
          toValue: 360,
          duration: 1000 + Math.random() * 1000,
          useNativeDriver: true,
        })
      ),
      // Swing left-right
      Animated.loop(
        Animated.sequence([
          Animated.timing(piece.x, {
            toValue: piece.x._value + (Math.random() * 100 - 50),
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.x._value,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start(() => {
      // Remove this confetti piece when animation completes
      setConfettiPieces((prev) => prev.filter((p) => p.id !== piece.id));
    });
  };

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiIdCounter.current = 0;

      // Initial confetti burst
      const initialConfetti = Array.from({ length: 15 }, () => createConfettiPiece());
      setConfettiPieces(initialConfetti);
      initialConfetti.forEach((piece) => animateConfetti(piece));

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

      // Continuously create new confetti pieces
      intervalRef.current = setInterval(() => {
        const newPieces = Array.from({ length: 3 }, () => createConfettiPiece());
        setConfettiPieces((prev) => [...prev, ...newPieces]);
        newPieces.forEach((piece) => animateConfetti(piece));
      }, 300); // Create new confetti every 300ms

    } else {
      // Cleanup when closing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setConfettiPieces([]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.green}
      />
      <View style={styles.container}>
        {/* Confetti */}
        {confettiPieces.map((piece) => (
          <Animated.View
            key={piece.id}
            style={[
              styles.confetti,
              {
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  {
                    rotate: piece.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { scale: piece.scale },
                ],
              },
            ]}
          >
            <Ionicons name={piece.icon as any} size={24} color={piece.color} />
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
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>🎉 Succès! 🎉</Text>

          {/* Message */}
          <Text style={styles.message}>
            Les formations sont maintenant disponible
          </Text>

          {/* Decorative Elements */}
          <View style={styles.decorativeRow}>
            <Ionicons name="trophy" size={32} color={Colors.warning} />
            <Ionicons name="star" size={28} color={Colors.primaryLight} />
            <Ionicons name="ribbon" size={32} color={Colors.info} />
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueButtonText}>Retourner</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    zIndex: 1,
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
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.md,
  },
  message: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  decorativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.lg,
    marginBottom: Spacings.xl,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.xl,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.green,
  },
});

export default CelebrationScreen;