import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface CelebrationScreenProps {
  visible: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  swing: number;
  shape: string;
  color: string;
  emoji?: string;
}

const CelebrationScreen: React.FC<CelebrationScreenProps> = ({ visible, onComplete }) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (visible) {
      const confettiTypes = [
        { emoji: '🎓' },
        { emoji: '⭐' },
        { emoji: '🎉' },
        { emoji: '🌸' },
        { emoji: '✨' },
        { emoji: '🎊' },
        { emoji: '💐' },
        { emoji: '🏆' },
      ];

      const shapes = ['square', 'circle', 'rectangle', 'emoji'];
      const colors = [
        '#FF6B9D', '#4ECDC4', '#FFD700', '#FF6F61',
        '#95E1D3', '#FFA07A', '#FF1493', '#00CED1',
        '#9B59B6', '#3498DB', '#E74C3C', '#F39C12'
      ];

      const pieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, index) => {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const confettiType = confettiTypes[Math.floor(Math.random() * confettiTypes.length)];

        return {
          id: index,
          left: Math.random() * 100,
          delay: Math.random() * 800,
          duration: 3000 + Math.random() * 1000,
          swing: -50 + Math.random() * 100,
          shape,
          color,
          emoji: shape === 'emoji' ? confettiType.emoji : undefined,
        };
      });

      setConfetti(pieces);

      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.contentArea}>
        {confetti.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: `${piece.left}%`,
              top: '-50px',
              animation: `fall ${piece.duration}ms linear ${piece.delay}ms forwards, 
                         swing ${piece.duration}ms ease-in-out ${piece.delay}ms forwards,
                         fadeOut 1000ms ease-out ${piece.delay + 2500}ms forwards`,
              animationIterationCount: '1, 3, 1',
            }}
          >
            {piece.shape === 'emoji' ? (
              <Text style={styles.emojiText}>{piece.emoji}</Text>
            ) : (
              <div
                style={{
                  width: piece.shape === 'square' ? '10px' : piece.shape === 'circle' ? '12px' : '14px',
                  height: piece.shape === 'square' ? '10px' : piece.shape === 'circle' ? '12px' : '8px',
                  backgroundColor: piece.color,
                  borderRadius: piece.shape === 'circle' ? '50%' : '0',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(calc(100vh + 50px));
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
        
        @keyframes fadeOut {
          to {
            opacity: 0;
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  contentArea: {
    position: 'relative',
    width: '100%',
    maxWidth: 700,
    height: '100%',
    overflow: 'hidden',
  },
  emojiText: {
    fontSize: 24,
  },
});

export default CelebrationScreen;