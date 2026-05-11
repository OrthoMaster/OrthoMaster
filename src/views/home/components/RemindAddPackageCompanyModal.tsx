import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface RemindAddPackageCompanyModalProps {
  visible: boolean;
  onClose: () => void;
  firstName?: string;
  onUnlockTrainings?: () => void;
}

const TOPICS = [
  'A quoi sert VRAIMENT une ceinture double serrage et pourquoi ça change tout ?',
  'Quelles sont les contre-indications des ceintures ?',
  'Comment faire de la proprioception un conseil associé puissant ?',
  'Prise en charge experte de l\'entorse 3 temps.',
  'Comment aider concrètement les patients avec arthrose ?',
  'Chaud / froid, compression / contention... on fait quoi et comment ?',
  'Pourquoi une coudière élastique ne sert à rien sur une épicondylite ?',
];

const BENEFITS = [
  '100 % prises en charge',
  'Accessibles à vie',
  'Orientées pratique et opérationnel',
  'Supervisées par le titulaire',
];

const RemindAddPackageCompanyModal: React.FC<RemindAddPackageCompanyModalProps> = ({
  visible,
  onClose,
  firstName = '',
  onUnlockTrainings,
}) => {
  const handleUnlock = () => {
    onUnlockTrainings?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.modalContent} edges={['bottom']}>
          {/* Full-width header image */}
          <View>
            <Image
              source={require('../../../../assets/v2_images/icon/remind/image2.gif')}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <Text style={styles.imageDescription}>
              Malheureusement, les compétences ne viennent pas comme ça.
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Scrollable body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.greeting}>
              {firstName ? `${firstName},` : 'Bonjour,'}
            </Text>

            <Text style={styles.description}>
              N'attendez pas pour <Text style={styles.textHighlight}>débloquer des dizaines de micro-leçons certifiantes</Text> pour vous et votre équipe, et découvrez des sujets passionnants comme par exemple :
            </Text>

            {/* Topics list */}
            <View style={styles.topicsContainer}>
              {TOPICS.map((topic, index) => (
                <View key={index} style={styles.topicItem}>
                  <View style={styles.topicBullet}>
                    <Text style={styles.topicBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
              <View style={styles.ellipsisItem}>
                <Text style={styles.topicEllipsis}>...</Text>
              </View>
            </View>

            <Text style={styles.reminderTitle}>
              Pour rappel, nos micro-formations sont :
            </Text>

            {/* Benefits list */}
            <View style={styles.benefitsContainer}>
              {BENEFITS.map((benefit, index) => (
                <View
                  key={index}
                  style={[
                    styles.benefitItem,
                    index === BENEFITS.length - 1 && { marginBottom: 0 },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Buttons */}
          <LinearGradient
            colors={['rgba(250, 247, 242, 0)', 'rgba(250, 247, 242, 0.95)', '#FAF7F2']}
            locations={[0, 0.4, 1]}
            style={styles.buttonContainer}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUnlock}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                Je débloque les micro-formations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContent: {
    // Off-white chaud — feeling "papier/manuel scolaire", complète bien le rouge du gif
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    width: Platform.OS === 'web' ? 580 : '100%',
    maxHeight: Platform.OS === 'web' ? '90%' : '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  headerImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 300 : 280,
    backgroundColor: '#1F2937',
  },
  imageDescription: {
    position: 'absolute',
    bottom: 0,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    width: '100%',
    color: Colors.grayLight,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  body: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  bodyContent: {
    paddingBottom: 200,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
    marginBottom: Spacings.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1F2937',
    marginBottom: Spacings.sm,
    lineHeight: 22,
  },
  textBold: {
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  textHighlight: {
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
  },
  topicsContainer: {
    marginTop: Spacings.sm,
    marginBottom: Spacings.md,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.sm,
    gap: Spacings.xs,
  },
  topicBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  topicBulletText: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
  },
  topicText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  ellipsisItem: {
    paddingLeft: 32,
    marginTop: -Spacings.xs,
  },
  topicEllipsis: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
    letterSpacing: 2,
  },
  reminderTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1F2937',
    marginTop: Spacings.sm,
    marginBottom: Spacings.sm,
  },
  benefitsContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.sm,
    gap: Spacings.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1F2937',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xl + Spacings.md,
    paddingBottom: Spacings.lg,
    gap: Spacings.sm,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: Spacings.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: Spacings.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },

  closeButton: {
    position: 'absolute',
    top: Platform.OS == 'web' ? Spacings.md : Spacings.xxxl,
    right: Spacings.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

export default RemindAddPackageCompanyModal;