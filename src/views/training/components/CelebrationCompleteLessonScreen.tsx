// components/CelebrationCompleteLessonScreen.tsx
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

interface CelebrationCompleteLessonScreenProps {
  visible: boolean;
  onClose: () => void;
  onNextLesson?: () => void; // Optional: nếu có thì hiện 2 buttons
}

const successElements = [
  {
    message: "En plein dans le mille !",
    imgUrl: 'https://media.giphy.com/media/QFypAZbq5lz3i/giphy.gif'
  },
  {
    message: "Tu es au sommet de ton art !",
    imgUrl: 'https://media.giphy.com/media/QXqf43mbeBbYFTy4jR/giphy.gif'
  },
  {
    message: "Ramène la coupe à la maison !",
    imgUrl: 'https://media.giphy.com/media/l0EwYc29XZnLR2pB6/giphy.gif'
  },
  {
    message: "\"We are the champion!\"",
    imgUrl: 'https://media.giphy.com/media/1yjZXySg7tSohpcmUM/giphy.gif'
  },
  {
    message: "Tu es en route pour les étoiles !",
    imgUrl: 'https://media.giphy.com/media/sGBMzyeEzKpySD74qv/giphy.gif'
  },
  {
    message: "Bravo ! Tu écrases tout sur ton passage !",
    imgUrl: 'https://media.giphy.com/media/2a5IGQ1n1Ap1e/giphy.gif'
  },
  {
    message: "Bravo ! Tu déchires tout !",
    imgUrl: 'https://media.giphy.com/media/x47soJwGwN5AYCSvfJ/giphy.gif'
  },
  {
    message: "T'es trop fort !",
    imgUrl: 'https://media.giphy.com/media/xFBnkMvpTM6m4/giphy.gif'
  },
  {
    message: "Wow ! Impressionant !",
    imgUrl: 'https://media.giphy.com/media/QTAVEex4ANH1pcdg16/giphy.gif'
  },
  {
    message: "Quel talent !",
    imgUrl: 'https://media.giphy.com/media/xT77XWum9yH7zNkFW0/giphy.gif'
  },
  {
    message: "Félicitations !",
    imgUrl: 'https://media.giphy.com/media/YRuFixSNWFVcXaxpmX/giphy.gif'
  },
  {
    message: "Franchement... Bien joué !",
    imgUrl: 'https://media.giphy.com/media/mGK1g88HZRa2FlKGbz/giphy.gif'
  },
  {
    message: "Bravo, 1000 points pour Griffondor !",
    imgUrl: 'https://media.giphy.com/media/Swx36wwSsU49HAnIhC/giphy.gif'
  },
  {
    message: "T'es au poil !",
    imgUrl: 'https://media.giphy.com/media/12P29BwtrvsbbW/giphy.gif'
  },
  {
    message: "Houra banana !",
    imgUrl: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif'
  },
  {
    message: "Bien joué !",
    imgUrl: 'https://media.giphy.com/media/vcKEsYOdjoCeJRpn95/giphy.gif'
  },
  {
    message: "Et c'est gagnééé !",
    imgUrl: 'https://media.giphy.com/media/geL1pDlmZwpvqVQp6V/giphy.gif'
  },
  {
    message: "Quel feu d'artifice !",
    imgUrl: 'https://media.giphy.com/media/IjmMzurYulKEw/giphy.gif'
  },
  {
    message: "Avec toi est la force de l'orthopédie",
    imgUrl: 'https://media.giphy.com/media/Le5BxgkiTShtS/giphy.gif'
  }
];

const CelebrationCompleteLessonScreen: React.FC<CelebrationCompleteLessonScreenProps> = ({ 
  visible, 
  onClose,
  onNextLesson
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState(successElements[0]);
  const confettiIdCounter = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Colors for confetti - success themed
  const confettiColors = [
    Colors.success,
    '#34D399', // Emerald
    '#FFD700', // Gold
    '#FCD34D', // Yellow
    '#10B981', // Green
    '#6EE7B7', // Light green
  ];

  const confettiIcons = [
    'trophy',
    'medal',
    'star',
    'ribbon',
    'checkmark-circle',
    'sparkles',
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
      // Select random success element
      const randomElement = successElements[Math.floor(Math.random() * successElements.length)];
      setSelectedElement(randomElement);

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      buttonsOpacity.setValue(0);
      setButtonsEnabled(false);
      confettiIdCounter.current = 0;

      // Initial confetti burst
      const initialConfetti = Array.from({ length: 20 }, () => createConfettiPiece());
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

      // Show buttons after 2 seconds
      buttonTimerRef.current = setTimeout(() => {
        setButtonsEnabled(true);
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 3000);

    } else {
      // Cleanup when closing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (buttonTimerRef.current) {
        clearTimeout(buttonTimerRef.current);
        buttonTimerRef.current = null;
      }
      setConfettiPieces([]);
      setButtonsEnabled(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (buttonTimerRef.current) {
        clearTimeout(buttonTimerRef.current);
        buttonTimerRef.current = null;
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
        backgroundColor={Colors.success}
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
          {/* Success Image - Circular Frame */}
          <View style={styles.iconContainer}>
            <View style={styles.imageCircle}>
              <Image 
                source={{ uri: selectedElement.imgUrl }} 
                style={styles.celebrationImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{selectedElement.message}</Text>

          {/* Message - Now using random message */}
          <Text style={styles.message}>🎓 Vous avez terminé la leçon avec succès ! </Text>

          {/* Decorative Elements */}
          <View style={styles.decorativeRow}>
            <Ionicons name="medal" size={32} color="#FFD700" />
            <Ionicons name="star" size={28} color="#FCD34D" />
            <Ionicons name="ribbon" size={32} color="#34D399" />
          </View>

          {/* Buttons Container - Always rendered but initially invisible */}
          <Animated.View 
            style={{ opacity: buttonsOpacity }}
            pointerEvents={buttonsEnabled ? 'auto' : 'none'}
          >
            {onNextLesson ? (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={onClose}
                  disabled={!buttonsEnabled}
                >
                  <Text style={styles.secondaryButtonText}>Retourner</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={onNextLesson}
                  disabled={!buttonsEnabled}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.singleButton} 
                onPress={onClose}
                disabled={!buttonsEnabled}
              >
                <Text style={styles.singleButtonText}>Retourner</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.success,
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
    marginBottom: Spacings.md,
  },
  imageCircle: {
    width: width - 2 * Spacings.lg,
    height: (width - 2 * Spacings.lg) * 9 / 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
  },
  celebrationImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  message: {
    fontSize: 16,
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
  // Styles cho 2 buttons
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacings.md,
    width: '100%',
    paddingHorizontal: Spacings.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
  // Style cho 1 button
  singleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  singleButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
});

export default CelebrationCompleteLessonScreen;