import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface ContractInfoModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const ContractInfoModal: React.FC<ContractInfoModalProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const sections: Section[] = [
    {
      id: 'fifpl',
      title: '• Vous êtes au FIFPL / Responsable d\'équipe',
      content: (
        <View style={styles.contractInfoNote}>
          <View style={styles.contractInfoSection}>
            <View style={styles.contractInfoListContainer}>
              <View style={styles.contractInfoBulletNumber}>
                <Text style={styles.contractInfoBullet}>1.</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractInfoBullet}>
                  Créer <Text style={styles.textBold}>votre Espace Pro</Text> sur la page{' '}
                  <Text style={styles.textBold}>Profil</Text>
                </Text>
              </View>
            </View>
            <View style={styles.contractInfoListContainer}>
              <View style={styles.contractInfoBulletNumber}>
                <Text style={styles.contractInfoBullet}>2.</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractInfoBullet}>
                  Remplissez les informations et rejoignez la page{' '}
                  <Text style={styles.textBold}>Équipe</Text>.
                </Text>
              </View>
            </View>
            <View style={styles.contractInfoListContainer}>
              <View style={styles.contractInfoBulletNumber}>
                <Text style={styles.contractInfoBullet}>3.</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractInfoBullet}>
                  Cliquez sur <Text style={styles.textBold}>Ajouter des formations</Text> et{' '}
                  <Text style={styles.textBold}>Faire dossier FIFPL</Text>.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.moveToPageButton}
              onPress={() => {
                onClose();
                navigation.navigate('profile', { screen: 'profile-view' });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moveToPageButtonText}>Accéder à la page</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      id: 'opco',
      title: '• Vous êtes à l\'OPCO-EP / Membre d\'équipe',
      content: (
        <View style={styles.contractInfoNote}>
          <View style={styles.contractInfoSection}>
            <View style={styles.contractInfoListContainer}>
              <Text style={styles.contractInfoBullet}>
                Seul votre responsable peut constituer et valider votre dossier.{'\n\n'}
                En cas de difficulté,
              </Text>
            </View>
            <TouchableOpacity
              style={styles.moveToPageButton}
              onPress={() => {
                onClose();
                Linking.openURL('mailto:question@orthomaster.fr');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moveToPageButtonText}>Contactez-nous</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      id: 'other',
      title: '• Vous êtes à un autre organisme (FAFPM, FPH, OPCO-SANTE ...)',
      content: (
        <View style={styles.contractInfoNote}>
          <View style={styles.contractInfoSection}>
            <TouchableOpacity
              style={styles.moveToPageButton}
              onPress={() => {
                onClose();
                Linking.openURL('mailto:question@orthomaster.fr');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moveToPageButtonText}>Contactez-nous</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      id: 'unknown',
      title: '• Je ne connais pas mon Organisme',
      content: (
        <View style={styles.contractInfoNote}>
          <View style={styles.contractInfoSection}>
            <TouchableOpacity
              style={styles.moveToPageButton}
              onPress={() => {
                onClose();
                Linking.openURL('https://quel-est-mon-opco.francecompetences.fr');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moveToPageButtonText}>Quel est mon OPCP ?</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.contractInfoModalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.contractInfoModalContent}>
          {/* Header */}
          <View style={styles.contractInfoHeader}>
            <View style={styles.contractInfoIconWrapper}>
              <FontAwesome6 name="file-signature" size={20} color={Colors.blue} />
            </View>
            <Text style={styles.contractInfoTitle}>
              Demander un dossier de prise en charge
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.contractInfoBody}>
            <Text style={styles.contractInfoDescription}>
              Vous avez la possibilité de faire financer toute ou partie de cette formation
              par votre <Text style={styles.textBold}>organisme de compétence</Text>.
            </Text>

            {sections.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
                <View key={section.id}>
                  <TouchableOpacity
                    style={styles.sectionTitleContainer}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.contractInfoSectionTitle}>{section.title}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.blue}
                      style={styles.expandIcon}
                    />
                  </TouchableOpacity>

                  {isExpanded && section.content}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.acceptButtonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contractInfoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  contractInfoModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  contractInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  contractInfoIconWrapper: {
    marginRight: Spacings.sm,
  },
  contractInfoTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  contractInfoBody: {
    padding: Spacings.lg,
  },
  contractInfoDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'justify',
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
  contractInfoSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingRight: Spacings.sm,
  },
  expandIcon: {
    marginLeft: Spacings.xs,
  },
  contractInfoSection: {
    marginTop: Spacings.xs,
    width: '100%',
  },
  contractInfoListContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.sm,
  },
  contractInfoBullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginLeft: Spacings.xs,
    flexWrap: 'wrap',
  },
  contractInfoBulletNumber: {
    width: 20,
    alignItems: 'flex-end',
  },
  contractInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    padding: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.md,
  },
  acceptButtonContainer: {
    padding: Spacings.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
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

export default ContractInfoModal;