import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface SendQuestionInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const SendQuestionInfoModal: React.FC<SendQuestionInfoModalProps> = ({
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.sendQuestionInfoModalOverlay,
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
            styles.sendQuestionInfoModalContent,
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
            source={require('../../../../assets/v2_images/icon/rgpd.png')}
          />
          <TouchableOpacity style={styles.sendQuestionInfoIconWrapper} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.sendQuestionInfoHeader}>
            <Text style={styles.sendQuestionInfoTitle}>RGPD</Text>
          </View>
          {/* Content */}
          <ScrollView style={styles.sendQuestionInfoBody}>
            <Text style={styles.sendQuestionInfoDescription}>
              Merci de ne transmettre <Text style={styles.textBold}>aucune donnée identifiable</Text> concernant un patient.{'\n'}
            </Text>
            <Text style={styles.sendQuestionInfoDescription}>
              Tous les documents doivent être <Text style={styles.textBold}>anonymisés</Text> avant envoi.{'\n'}
              (ordonnances, comptes rendus, imagerie…)
            </Text>
          </ScrollView>

          <View style={styles.acceptButtonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                handleClose();
                Linking.openURL('mailto:question@orthomaster.fr');
              }}
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
  sendQuestionInfoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  sendQuestionInfoModalContent: {
    backgroundColor: Colors.yellow3,
    borderRadius: 16,
    width: Platform.OS === 'web' ? 600 : '100%',
    maxHeight: '90%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible',
    paddingTop: 80,
  },
  sendQuestionInfoHeader: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    position: 'absolute',
    top: -90,
    left: '50%',
    zIndex: 10,
  },
  sendQuestionInfoIconWrapper: {
    position: 'absolute',
    right: Spacings.md,
    top: Spacings.md,
    marginLeft: Spacings.sm,
    backgroundColor: Colors.warning,
    padding: Spacings.xs,
    borderRadius: 40,
    zIndex: 99999,
  },
  sendQuestionInfoTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.warning,
  },
  sendQuestionInfoBody: {
    padding: Spacings.lg,
  },
  sendQuestionInfoDescription: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'justify'
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
  sendQuestionInfoSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingRight: Spacings.sm,
  },
  expandIcon: {
    marginLeft: Spacings.xs,
  },
  sendQuestionInfoSection: {
    marginTop: Spacings.xs,
    width: '100%',
  },
  sendQuestionInfoListContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.sm,
  },
  sendQuestionInfoBullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginLeft: Spacings.xs,
    flexWrap: 'wrap',
  },
  sendQuestionInfoBulletNumber: {
    width: 20,
    alignItems: 'flex-end',
  },
  sendQuestionInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    padding: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.md,
  },
  acceptButtonContainer: {
    padding: Spacings.md,
    backgroundColor: Colors.yellow3,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
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

export default SendQuestionInfoModal;