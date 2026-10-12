import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/** Exportée pour que l'écran appelant décide d'afficher la modale ou d'entrer directement. */
export const BOOKING_INTRO_STORAGE_KEY = '@never_open_booking_intro';

interface BookingIntroModalProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé après « Continuer », une fois la modale refermée. */
  onContinue: () => void;
}

const BookingIntroModal: React.FC<BookingIntroModalProps> = ({ visible, onClose, onContinue }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;

  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    return () => loop.stop();
  }, [visible]);

  const animateOut = (then: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 100, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      fadeAnim.setValue(0);
      translateY.setValue(100);
      then();
    });
  };

  const handleClose = () => animateOut(onClose);

  const handleContinue = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(BOOKING_INTRO_STORAGE_KEY, 'true');
      } catch (error) { }
    }
    animateOut(() => {
      onClose();
      onContinue();
    });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
          <Animated.View style={[styles.headerIcon, { transform: [{ translateY: bounceAnim }] }]}>
            <MaterialCommunityIcons name="account-voice" size={44} color={Colors.white} />
          </Animated.View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.body}>
            <Text style={styles.title}>Échanger avec un expert</Text>

            <Text style={styles.description}>
              Réservez un <Text style={styles.textBold}>échange en visio</Text> avec un expert OrthoMaster
              pour approfondir un sujet de votre pratique.
            </Text>
            <Text style={styles.description}>
              Choisissez l'<Text style={styles.textBold}>expert</Text>, le <Text style={styles.textBold}>thème</Text> puis
              les <Text style={styles.textBold}>demi-journées</Text> qui vous conviennent.
            </Text>
            <Text style={styles.description}>
              L'expert confirme votre demande au plus tard <Text style={styles.textBold}>3 jours</Text> après l'envoi.
            </Text>

            <View style={styles.note}>
              <Text style={[styles.description, styles.noteTitle]}>Bon à savoir 💡</Text>
              <Text style={[styles.description, { color: Colors.white }]}>
                <Text style={styles.textBold}>Le lien de la visio</Text> est disponible dans l'application,
                peu avant le rendez-vous.
              </Text>
            </View>
          </ScrollView>

          {/* Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxWrapper}
              onPress={() => setDontShowAgain(!dontShowAgain)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Ionicons name="checkmark" size={18} color={Colors.white} />}
              </View>
              <Text style={styles.checkboxLabel}>Ne plus afficher ce message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  content: {
    backgroundColor: Colors.lblue3,
    borderRadius: 16,
    width: Platform.OS === 'web' ? 600 : '100%',
    maxWidth: 600,
    maxHeight: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible',
  },

  /* ---- En-tête ---- */
  headerIcon: {
    position: 'absolute',
    top: -36,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lblue,
    borderWidth: 4,
    borderColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacings.md,
  },
  closeButton: {
    position: 'absolute',
    right: Spacings.md,
    backgroundColor: Colors.lblue,
    padding: Spacings.xs,
    borderRadius: 40,
    zIndex: 99999,
  },

  /* ---- Texte ---- */
  body: {
    padding: Spacings.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.lblueDark,
    marginTop: Spacings.xl,
    marginBottom: Spacings.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginBottom: Spacings.sm,
  },
  note: {
    backgroundColor: Colors.lblue,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.sm,
    borderRadius: 8,
    marginTop: Spacings.sm,
  },
  noteTitle: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
  textBold: {
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Case à cocher ---- */
  checkboxContainer: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacings.sm,
  },
  checkboxChecked: {
    backgroundColor: Colors.lblueDark,
    borderColor: Colors.lblueDark,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },

  /* ---- Bouton ---- */
  buttonContainer: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.lg,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lblueDark,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});

export default BookingIntroModal;