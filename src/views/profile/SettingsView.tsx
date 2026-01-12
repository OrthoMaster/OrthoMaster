import React, { useEffect, useState } from 'react';
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
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useGetUser } from '../../hooks/auth.hook';
import { updateSettings } from '../../services/v2/AuthService';

interface SettingItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

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

  const { data: user, isLoading: isLoadingUser, refetch, isFetching, error } = useGetUser();


  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    notifications: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Set values
  useEffect(() => {
    setSettings({
      notifications: user.settings?.notifications || false
    });
    setIsLoading(false);
  }, [user]);

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    if (key == 'notifications' && value == true && !user.settings?.notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // When not asked yet
      if (existingStatus !== 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // When is denied
      else if (finalStatus !== 'granted') {
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
    setIsLoading(true);

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
      setIsLoading(false);
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
        <Text style={styles.headerTitle}>Paramètres généraux</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasChanges ? 120 : Spacings.md }}
      >
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
              isLoading && styles.saveButtonDisabled
            ]}
            disabled={isLoading}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
            {/* Icon */}
            <View style={styles.modelIconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Succès</Text>

            {/* Message */}
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

  // Modal Styles
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