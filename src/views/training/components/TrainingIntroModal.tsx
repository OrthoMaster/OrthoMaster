import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface TrainingIntroModalProps {
  visible: boolean;
  onClose: () => void;
}

const STORAGE_KEY = '@never_open_training_intro';

const TrainingIntroModal: React.FC<TrainingIntroModalProps> = ({
  visible,
  onClose
}) => {
  // Animation for bounce icon
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for modal fade in/out
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(100)).current;
  const translateY = useRef(new Animated.Value(100)).current;

  // Bounce animation for icon
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, bounceAnim]);

  // Fade in animation when modal open
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Function close modal with animation
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      fadeAnim.setValue(0);
      translateX.setValue(100);
      translateY.setValue(100);
      onClose();
    });
  };

  const handleContinue = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
      } catch (error) { }
    }
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.trainingIntroModalOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.trainingIntroModalContent,
            {
              transform: [
                { translateX },
                { translateY },
              ],
            }
          ]}
        >
          <Animated.Image
            style={[
              styles.headerIcon,
              {
                transform: [
                  { translateY: bounceAnim },
                  { translateX: -100 }
                ]
              }
            ]}
            source={require('../../../../assets/v2_images/icon/training-info.png')}
          />
          {/* Header */}
          <View style={styles.trainingIntroHeader}>
            <TouchableOpacity style={styles.trainingIntroIconWrapper} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.trainingIntroBody}>
            <Text style={styles.trainingIntroTitle}>Votre Espace Formation</Text>

            <Text style={styles.trainingIntroDescription}>
              Découvrez une offre de <Text style={styles.textBold}>formations certifiantes</Text> (DPC) pensée pour les professionnels de santé.
            </Text>
            <Text style={styles.trainingIntroDescription}>
              <Text style={styles.textBold}>Composez librement</Text> votre parcours en sélectionnant les modules adaptés à vos besoins et à ceux de votre équipe.
            </Text>
            <Text style={styles.trainingIntroDescription}>
              Ajoutez-les à votre <Text style={styles.textBold}>Cartable</Text> !
            </Text>
            <Text style={styles.trainingIntroDescription}>
              OrthoMaster vous accompagne dans une <Text style={styles.textBold}>prise en charge financière</Text> en temps réel selon votre <Text style={styles.textBold}>organisme financeur</Text>, et selon vos droits.
            </Text>

            <View style={styles.trainingIntroNote}>
              <Text style={[styles.trainingIntroDescription, { color: Colors.white, fontFamily: 'Poppins-Medium' }]}>Bon à Savoir 💡 </Text>
              <Text style={[styles.trainingIntroDescription, { color: Colors.white }]}><Text style={styles.textBold}>Le contenu des formations activées reste accessible à vie !</Text></Text>
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
                {dontShowAgain && (
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Ne plus afficher ce message
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.acceptButtonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  trainingIntroModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  trainingIntroModalContent: {
    backgroundColor: Colors.lgreen3,
    borderRadius: 16,
    width: Platform.OS === 'web' ? 600 : '100%',
    maxHeight: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible',
  },
  trainingIntroHeader: {
    alignItems: 'center',
    marginTop: Spacings.md
  },
  trainingIntroIconWrapper: {
    position: 'absolute',
    right: Spacings.md,
    marginLeft: Spacings.sm,
    backgroundColor: Colors.lgreen,
    padding: Spacings.xs,
    borderRadius: 40,
    zIndex: 99999,
  },
  headerIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    zIndex: 10,
    borderRadius: 100,
  },
  trainingIntroTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.lgreenDark,
    marginTop: Spacings.xl,
    marginBottom: Spacings.md
  },
  trainingIntroBody: {
    padding: Spacings.lg,
  },
  trainingIntroDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginBottom: Spacings.sm
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacings.sm,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm,
    borderTopWidth: 1,
    borderColor: Colors.line,
  },
  trainingIntroSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingRight: Spacings.sm,
  },
  expandIcon: {
    marginLeft: Spacings.xs,
  },
  trainingIntroSection: {
    marginTop: Spacings.xs,
    width: '100%',
  },
  trainingIntroNote: {
    backgroundColor: Colors.lgreen,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.sm,
    borderRadius: 8,
    marginTop: Spacings.sm,
  },
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
    backgroundColor: Colors.lgreenDark,
    borderColor: Colors.lgreenDark,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },
  acceptButtonContainer: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.lg,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lgreenDark,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  moveToPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    padding: Spacings.xs,
    marginHorizontal: Spacings.xs,
    borderRadius: 8,
  },
  moveToPageButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  textBold: {
    fontFamily: 'Poppins-Bold',
  },
});

export default TrainingIntroModal;