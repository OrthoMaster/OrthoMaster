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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Spacings from '../../../../constants/Spacings';

interface RemindCreateCompanyModalProps {
  visible: boolean;
  onClose: () => void;
  firstName?: string;
  onCreateTeam?: () => void;
}

const RemindCreateCompanyModal: React.FC<RemindCreateCompanyModalProps> = ({
  visible,
  onClose,
  firstName = '',
  onCreateTeam,
}) => {
  const handleCreateTeam = () => {
    onCreateTeam?.();
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
          <Image
            source={require('../../../../assets/v2_images/icon/remind/image1.gif')}
            style={styles.headerImage}
            resizeMode="cover"
          />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.greeting}>
              {firstName ? `${firstName},` : 'Bonjour,'}
            </Text>

            <Text style={styles.description}>
              Prendre soin de la mobilité de vos patients est l'affaire de <Text style={styles.textHighlight}>toute l'équipe</Text> de votre officine.
            </Text>

            <Text style={styles.descriptionStrong}>
              Alors prenez 2 minutes pour créer la vôtre !
            </Text>

            <Text style={styles.description}>
              Donnez-leur accès à <Text style={styles.textHighlight}>ORTHOMASTER</Text> avec les outils et les modules de micro-formations qui feront d'eux des experts du conseil mobilité.
            </Text>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateTeam}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Je crée mon équipe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
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
    // Deep navy — fait ressortir l'orange du gif et donne un feeling "mission/équipe"
    backgroundColor: '#1E293B',
    borderRadius: 16,
    width: Platform.OS === 'web' ? 560 : '100%',
    height: Platform.OS === 'web' ? '85%' : '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 270 : 300,
    backgroundColor: '#0F172A',
  },
  body: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  bodyContent: {
    paddingBottom: Spacings.md,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: '#FF8A47', // tone orange repris du gif
    marginBottom: Spacings.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#E2E8F0', // gris clair lisible sur navy
    marginBottom: Spacings.sm,
    lineHeight: 22,
  },
  descriptionStrong: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: Spacings.md,
    lineHeight: 24,
  },
  textBold: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  textHighlight: {
    fontFamily: 'Poppins-Medium',
    color: '#FF8A47',
  },
  buttonContainer: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.lg,
    gap: Spacings.sm,
  },
  primaryButton: {
    backgroundColor: '#FF6B35', // orange vif harmonisé avec les combinaisons du gif
    paddingVertical: Spacings.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: Spacings.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#CBD5E1',
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

export default RemindCreateCompanyModal;