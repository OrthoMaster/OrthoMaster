import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
  Alert,
  Modal,
  Linking,
  Platform,
  TextInput,
  ActivityIndicator
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../hooks/auth.hook';
import { getPreFormData, updateSettings } from '../../services/v2/AuthService';

interface Topic {
  id: string;
  name: string;
  description?: string;
}

interface SettingItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

interface TopicPillProps {
  topic: Topic;
  onRemove: (topicId: string) => void;
}

const TopicPill: React.FC<TopicPillProps> = ({ topic, onRemove }) => (
  <View style={styles.topicPill}>
    <Text style={styles.topicPillText}>{topic.name}</Text>
    <TouchableOpacity
      onPress={() => onRemove(topic.id)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="close-circle" size={18} color={Colors.primary} />
    </TouchableOpacity>
  </View>
);

interface TopicSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  topics: Topic[];
  selectedTopicIds: string[];
  onToggleTopic: (topicId: string) => void;
  isLoading: boolean;
}

const TopicSelectionModal: React.FC<TopicSelectionModalProps> = ({
  visible,
  onClose,
  topics,
  selectedTopicIds,
  onToggleTopic,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.topicModalContent}>
          {/* Header */}
          <View style={styles.topicModalHeader}>
            <Text style={styles.topicModalTitle} numberOfLines={2}>Personnalisez votre expérience</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher ..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.gray}
            />
          </View>

          {/* Topics List */}
          <ScrollView style={styles.topicsList} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => {
                const isSelected = selectedTopicIds.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicItem,
                      index !== filteredTopics.length - 1 && styles.topicItemBorder
                    ]}
                    onPress={() => onToggleTopic(topic.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.topicItemLeft}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={Colors.white} />
                        )}
                      </View>
                      <View style={styles.topicItemText}>
                        <Text style={styles.topicItemTitle}>{topic.name}</Text>
                        {topic.description && (
                          <Text style={styles.topicItemDescription}>
                            {topic.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={58} color={Colors.gray} />
                <Text style={styles.emptyText}>Aucun centre d’intérêt trouvé</Text>
              </View>
            )}
            <View style={{ height: 100 }}></View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.topicModalFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SettingItem: React.FC<SettingItemProps> = ({
  iconName,
  title,
  description,
  value,
  onValueChange,
  isLast
}) => (
  <View style={[styles.settingItem, !isLast && styles.settingItemBorder]}>
    <View style={styles.settingItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={Colors.text} />
      </View>
      <View style={styles.settingItemText}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        <Text style={styles.settingItemDescription}>{description}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.line, true: Colors.primaryLight || Colors.primary }}
      thumbColor={value ? Colors.primary : Colors.gray}
      ios_backgroundColor={Colors.line}
    />
  </View>
);

export const SettingsView = ({ navigation }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const { data: preData, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['pre-form-data-profile'],
    queryFn: () => getPreFormData(),
  });
  const { data: user, isLoading: isLoadingUser, refetch, isFetching, error } = useGetUser();

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
  const [showTopicModal, setShowTopicModal] = useState(false);

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

  // Get selected topics
  const selectedTopics = useMemo(() => {
    if (!Array.isArray(topics) || !Array.isArray(settings.favoriteTopicIds)) {
      return [];
    }
    return topics.filter(topic =>
      settings.favoriteTopicIds.includes(topic.id)
    );
  }, [topics, settings.favoriteTopicIds]);

  // Handle change any settings
  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    if (key == 'notifications' && value == true && !user.settings?.notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      } else if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications désactivées',
          'Vous avez refusé les notifications. Veuillez les activer dans les paramètres de votre appareil.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Ouvrir les paramètres',
              onPress: () => Linking.openSettings()
            }
          ]
        );
      }

      if (finalStatus == 'granted') {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
      }
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
    }
  };

  const handleToggleTopic = (topicId: string) => {
    setSettings(prev => {
      const isCurrentlySelected = prev.favoriteTopicIds.includes(topicId);
      const newTopicIds = isCurrentlySelected
        ? prev.favoriteTopicIds.filter(id => id !== topicId)
        : [...prev.favoriteTopicIds, topicId];

      return { ...prev, favoriteTopicIds: newTopicIds };
    });
    setHasChanges(true);
  };

  const handleRemoveTopic = (topicId: string) => {
    setSettings(prev => ({
      ...prev,
      favoriteTopicIds: prev.favoriteTopicIds.filter(id => id !== topicId)
    }));
    setHasChanges(true);
  };

  const back = () => {
    if (hasChanges) {
      Alert.alert(
        "Modifications non enregistrées",
        "Voulez-vous enregistrer vos modifications avant de quitter ?",
        [
          {
            text: "Ne pas enregistrer",
            style: "destructive",
            onPress: () => navigation.goBack()
          },
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Enregistrer",
            onPress: handleSave
          }
        ]
      );
    } else {
      navigation.goBack();
    }
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
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centrès d'intérêt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasChanges ? 120 : Spacings.md }}
      >
        {/* Favorite Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d’intérêt</Text>
          <View style={styles.sectionContent}>
            <View style={styles.topicSection}>
              {/* Selected Topics Pills */}
              {selectedTopics.length > 0 ? (
                <View style={styles.topicPillsContainer}>
                  {selectedTopics.map(topic => (
                    <TopicPill
                      key={topic.id}
                      topic={topic}
                      onRemove={handleRemoveTopic}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.noTopicsText}>
                  Sélectionnez vos centres d’intérêt pour personnaliser votre expérience
                </Text>
              )}

              {/* Add Topic Button */}
              <TouchableOpacity
                style={styles.addTopicButton}
                onPress={() => setShowTopicModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addTopicButtonText}>
                  {selectedTopics.length > 0 ? 'Modifier mes centres d’intérêt' : "Ajouter des centres d’intérêt"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              iconName="notifications-outline"
              title="Notifications push"
              description="Recevoir des notifications sur votre appareil"
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              isLast
            />
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

      {/* Topic Selection Modal */}
      <TopicSelectionModal
        visible={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        topics={topics}
        selectedTopicIds={settings.favoriteTopicIds}
        onToggleTopic={handleToggleTopic}
        isLoading={isLoadingTopics}
      />

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
              <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>Succès</Text>
            <Text style={styles.modalMessage}>
              Vos paramètres ont été enregistrés avec succès !
            </Text>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  section: {
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingHorizontal: Spacings.lg,
    marginBottom: Spacings.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
  },

  // Topic Section Styles
  topicSection: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLightBackground,
    paddingVertical: Spacings.xs,
    paddingLeft: Spacings.md,
    paddingRight: Spacings.sm,
    borderRadius: 20,
    gap: Spacings.xs,
  },
  topicPillText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  noTopicsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
    marginBottom: Spacings.md,
    fontStyle: 'italic',
  },
  addTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: Spacings.xs,
    marginTop: Spacings.sm
  },
  addTopicButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },

  // Topic Modal Styles
  topicModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    height: '80%',
    width: '100%',
  },
  topicModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  topicModalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    width: '70%'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    marginHorizontal: Spacings.lg,
    marginVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    gap: Spacings.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    paddingVertical: Spacings.sm,
  },
  topicsList: {
    flex: 1,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  topicItemLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.line,
    marginRight: Spacings.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicItemText: {
    flex: 1,
  },
  topicItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  topicItemDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: 2,
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
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.md,
    textAlign: 'center',
  },
  topicModalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.lg,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacings.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Bottom Section
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

  // Success Modal Styles
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
    shadowOffset: { width: 0, height: 4 },
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