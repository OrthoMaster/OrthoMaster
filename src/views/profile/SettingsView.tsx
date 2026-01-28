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
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../hooks/auth.hook';
import { getPreFormData, updateSettings } from '../../services/v2/AuthService';

const { width, height } = Dimensions.get('window');
const topicWidth = (width - 2 * Spacings.lg - 2 * Spacings.sm) / 3 - 10;

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

interface SettingItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onToggle: (topicId: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onToggle }) => (
  <TouchableOpacity
    style={[styles.topicCard, { width: topicWidth }]}
    onPress={() => onToggle(topic.id)}
    activeOpacity={0.8}
  >
    <View style={[
      styles.topicImageContainer,
      { width: topicWidth, height: topicWidth },
      isSelected && styles.topicImageContainerSelected
    ]}>
      {topic.image ? (
        <Image
          source={{ uri: process.env.EXPO_PUBLIC_S3_URL + topic.image }}
          style={[styles.topicImage, { opacity: isSelected ? 1 : 0.6 }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.topicImagePlaceholder}>
          <Ionicons name="image-outline" size={24} color={Colors.gray} />
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
        {description &&
          <Text style={styles.settingItemDescription}>{description}</Text>
        }
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
        <TouchableOpacity style={styles.backButton} onPress={back}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes centres d'intérêt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasChanges ? 130 : Spacings.xxl }}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications pour rester informé</Text>
          <Text style={styles.topicSectionDescription}>Aucune publicité, que du contenu pédagogique 😉</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              iconName="notifications-outline"
              title="Recevoir l’actualité de mes centres d’intérêts par notification"
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              isLast
            />
          </View>
        </View>

        {/* Favorite Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d'intérêt</Text>
          <Text style={styles.topicSectionDescription}>
            Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.topicSection}>
              {/* Topics Grid */}
              {isLoadingTopics ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
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
                  <Ionicons name="albums-outline" size={48} color={Colors.gray} />
                  <Text style={styles.emptyText}>Aucun centre d'intérêt disponible</Text>
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
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
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
    fontSize: 13,
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
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
  },

  // Topic Section Styles
  topicSection: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicSectionDescription: {
    fontSize: 12,
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
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    textAlign: 'center',
    lineHeight: 14,
  },
  topicCardTextSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Bold',
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