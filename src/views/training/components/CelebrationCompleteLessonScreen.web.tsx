import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  icon: string;
  swing: number;
}

interface CelebrationCompleteLessonScreenProps {
  visible: boolean;
  onClose: () => void;
  onNextLesson?: () => void;
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
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [selectedElement, setSelectedElement] = useState(successElements[0]);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  const confettiColors = [
    Colors.success,
    '#34D399',
    '#FFD700',
    '#FCD34D',
    '#10B981',
    '#6EE7B7',
  ];

  const confettiIcons = [
    'trophy',
    'medal',
    'star',
    'ribbon',
    'checkmark-circle',
    'sparkles',
  ];

  useEffect(() => {
    if (visible) {
      const randomElement = successElements[Math.floor(Math.random() * successElements.length)];
      setSelectedElement(randomElement);

      const pieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 3000,
        duration: 3000 + Math.random() * 2000,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        icon: confettiIcons[Math.floor(Math.random() * confettiIcons.length)],
        swing: -30 + Math.random() * 60,
      }));

      setConfetti(pieces);

      const timer = setTimeout(() => {
        setButtonsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
      setButtonsVisible(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-50px',
            animation: `fall ${piece.duration}ms linear ${piece.delay}ms infinite, 
                       swing ${piece.duration}ms ease-in-out ${piece.delay}ms infinite,
                       rotate 2000ms linear ${piece.delay}ms infinite`,
          }}
        >
          <Ionicons name={piece.icon as any} size={24} color={piece.color} />
        </div>
      ))}

      <div style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.imageCircle}>
              <Image
                source={{ uri: selectedElement.imgUrl }}
                style={styles.celebrationImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <Text style={styles.title}>{selectedElement.message}</Text>

          <Text style={styles.message}>🎓 Vous avez terminé la leçon avec succès !</Text>

          <View style={styles.decorativeRow}>
            <Ionicons name="medal" size={32} color="#FFD700" />
            <Ionicons name="star" size={28} color="#FCD34D" />
            <Ionicons name="ribbon" size={32} color="#34D399" />
          </View>

          <div
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transition: 'opacity 0.5s ease',
              width: '100%',
            }}
          >
            {onNextLesson ? (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClose}
                  disabled={!buttonsVisible}
                >
                  <Text style={styles.secondaryButtonText}>Retourner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onNextLesson}
                  disabled={!buttonsVisible}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.singleButton}
                onPress={onClose}
                disabled={!buttonsVisible}
              >
                <Text style={styles.singleButtonText}>Retourner</Text>
              </TouchableOpacity>
            )}
          </div>
        </View>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(calc(100vh + 100px));
          }
        }
        
        @keyframes swing {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(50px);
          }
          75% {
            transform: translateX(-50px);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.success,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    overflow: 'hidden',
  },
  contentWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 700,
    padding: Spacings.xl,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: Spacings.md,
    width: '100%',
  },
  imageCircle: {
    width: '100%',
    maxWidth: 600,
    aspectRatio: 16 / 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  celebrationImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  message: {
    fontSize: 20,
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
    cursor: 'pointer',
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
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
  singleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.xl,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
  },
  singleButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
});

export default CelebrationCompleteLessonScreen;