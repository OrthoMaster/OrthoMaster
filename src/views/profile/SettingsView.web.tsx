import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, Button } from 'react-native-paper';

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../hooks/auth.hook';
import { getPreFormData, updateSettings } from '../../services/v2/AuthService';

const { width, height } = Dimensions.get('window');
const topicWidth = (width - 2 * Spacings.lg - 8 * Spacings.sm) / 9;

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onToggle: (topicId: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onToggle }) => (
  <TouchableOpacity
    style={[styles.topicCard, {
      width: topicWidth
    }]}
    onPress={() => onToggle(topic.id)}
    activeOpacity={0.8}
  >
    <View style={[
      styles.topicImageContainer,
      {
        width: topicWidth,
        height: topicWidth
      },
      isSelected && styles.topicImageContainerSelected,
      {
        opacity: isSelected ? 1 : 0.6
      }
    ]}>
      {topic.image ? (
        <Image
          source={{
            uri: process.env.EXPO_PUBLIC_S3_URL + topic.image
          }}
          style={styles.topicImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.topicImagePlaceholder}>
          <Ionicons
            name="image-outline"
            size={24}
            color={Colors.gray}
          />
        </View>
      )}
    </View>
    <Text
      style={[
        styles.topicCardText,
        isSelected && styles.topicCardTextSelected
      ]}
      numberOfLines={2}
    >
      {topic.name}
    </Text>
  </TouchableOpacity>
);

export const SettingsView = ({ navigation }) => {
  const {
    data: preData,
    isLoading: isLoadingTopics,
    refetch: refetchPreData,
  } = useQuery({
    queryKey: ['pre-form-data-profile'],
    queryFn: () => getPreFormData(),
    staleTime: 0,
    retry: 2,
    retryDelay: 2000,
  });

  useFocusEffect(
    useCallback(() => {
      refetchPreData();
    }, [refetchPreData])
  );

  const { data: user, isLoading: isLoadingUser, refetch, isFetching, error } = useGetUser();
  
  useFocusEffect(
    useCallback(() => {
      refetchPreData();
      refetch();
    }, [refetchPreData, refetch])
  );

  // Settings state
  const [settings, setSettings] = useState({
    notifications: false,
    favoriteTopicIds: [] as string[],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);

  // Dialog states
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Load topics from database
  useEffect(() => {
    if (preData?.data?.topics) {
      setTopics(preData?.data?.topics);
    }
  }, [preData]);

  // Set values from user data
  useEffect(() => {
    setSettings({
      notifications: user.settings?.notifications || false,
      favoriteTopicIds: user.settings?.topics ?? [],
    });
    setIsLoading(false);
  }, [user]);

  const handleToggleTopic = (topicId: string) => {
    setSettings(prev => {
      const isCurrentlySelected = prev.favoriteTopicIds.includes(topicId);
      const newTopicIds = isCurrentlySelected
        ? prev.favoriteTopicIds.filter(id => id !== topicId)
        : [...prev.favoriteTopicIds, topicId];

      return {
        ...prev,
        favoriteTopicIds: newTopicIds
      };
    });
    setHasChanges(true);
  };

  const back = () => {
    if (hasChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    navigation.goBack();
  };

  const handleSaveAndExit = async () => {
    setShowUnsavedChangesDialog(false);
    await handleSave();
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateSettings(settings);

      if (result == true) {
        refetch();
        setShowSuccessModal(true);
        setHasChanges(false);
        setTimeout(() => navigation.goBack(), 2500);
      } else {
        setErrorMessage("Une erreur est survenue lors de l'enregistrement");
        setShowErrorDialog(true);
      }
    } catch (error) {
      setErrorMessage("Une erreur est survenue lors de l'enregistrement");
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={back}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Mes centres d'intérêt
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Favorite Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Centres d'intérêt
          </Text>
          <Text style={styles.topicSectionDescription}>
            Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.topicSection}>
              {/* Topics Grid */}
              {isLoadingTopics ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                  />
                </View>
              ) : topics.length > 0 ? (
                <View style={styles.topicsGrid}>
                  {topics.map(topic => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isSelected={settings.favoriteTopicIds.includes(topic.id)}
                      onToggle={handleToggleTopic}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="albums-outline"
                    size={48}
                    color={Colors.gray}
                  />
                  <Text style={styles.emptyText}>
                    Aucun centre d'intérêt disponible
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled
            ]}
            disabled={isLoading || isSubmitting}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modelIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={50}
                color={Colors.success}
              />
            </View>
            <Text style={styles.modalTitle}>
              Succès
            </Text>
            <Text style={styles.modalMessage}>
              Vos paramètres ont été enregistrés avec succès !
            </Text>
          </View>
        </View>
      </Modal>

      {/* Portal Dialogs */}
      <Portal>
        {/* Unsaved Changes Dialog */}
        <Dialog
          visible={showUnsavedChangesDialog}
          onDismiss={() => setShowUnsavedChangesDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Modifications</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Voulez-vous enregistrer vos modifications avant de quitter ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={handleDiscardChanges}
            >
              Ne pas enregistrer
            </Button>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowUnsavedChangesDialog(false)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.green}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={handleSaveAndExit}
            >
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog
          visible={showErrorDialog}
          onDismiss={() => setShowErrorDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              {errorMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowErrorDialog(false)}
            >
              Fermer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 100,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  section: {
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingHorizontal: Spacings.lg,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.white,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  settingItemLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacings.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
  },
  topicSection: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicSectionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  topicCard: {
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  topicImageContainer: {
    borderRadius: 120,
    overflow: 'hidden',
    marginBottom: Spacings.xs,
    backgroundColor: Colors.white,
    padding: 2,
  },
  topicImageContainerSelected: {
    borderWidth: 5,
    borderColor: Colors.primary,
  },
  topicImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  topicImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.grayLight,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicCardText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    textAlign: 'center',
  },
  topicCardTextSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.md,
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modelIconContainer: {
    marginBottom: Spacings.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  modalMessage: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: Spacings.xxs,
    marginBottom: Spacings.md,
    width: '70%',
  },
});