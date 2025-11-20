import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useQueryClient } from "@tanstack/react-query";
import { useLogout, useGetUser } from '../../hooks/auth.hook';
import { orthomasterShare } from "../../futils";

interface MenuItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  showWarning?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ iconName, title, subtitle, onPress, isLast, showWarning }) => (
  <TouchableOpacity
    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={Colors.text} />
        {showWarning && (
          <View style={styles.warningBadge}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
          </View>
        )}
      </View>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
  </TouchableOpacity >
);

export const ProfileView = ({ navigation, route }) => {
  const queryClient = useQueryClient();
  const { data: user, refetch } = useGetUser();
  const logout = useLogout();

  const nofi = () => {
    refetch()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={nofi}>
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Info Card */}
          <View style={styles.userCard}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {
              user && user.student_flg == true && user.expires_at !== null &&
              <Text style={styles.userExpiresAt}>Expire le <Text style={{ fontFamily: 'Poppins-Medium', color: Colors.primary }}>{user.expires_at}</Text>
              </Text>
            }

          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compte</Text>
            </View>
            <MenuItem
              iconName="person-outline"
              title="Informations personnelles"
            />
            <MenuItem
              iconName="shield-checkmark-outline"
              title="Sécurité"
              subtitle="Mis à jour votre mot de passe"
              isLast
              showWarning
            />
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Support</Text>
            </View>
            <MenuItem
              iconName="help-circle-outline"
              title="Obtenir de l'aide"
              onPress={() => (Linking.openURL('mailto:question@orthomaster.fr'))}
            />
            <MenuItem
              iconName="document-outline"
              title="Mentions légales"
            />
            <MenuItem
              iconName="document-text-outline"
              title="Politique de confidentialité"
            />
            <MenuItem
              iconName="share-social-outline"
              title="Partager"
              subtitle="Inviter à rejoindre OrthoMaster"
              isLast
              onPress={() => {
                orthomasterShare({
                  message: "Rejoignez le premier écosystème de l'orthopédie !\n" +
                    user.name + " vous invite à découvrir la plateforme OrthoMaster.\n" +
                    "Cliquez sur ce lien ci-dessus et découvrez des centaines de contenus réservés aux professionnels de santé.\n\nhttps://espace.orthomaster.fr/inscription",
                  url: "https://orthomaster.fr"
                }, 'app invite', null)
              }}
            />
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Déconnexion",
                  "Voulez-vous vraiment vous déconnecter ?",
                  [{
                    text: "Annuler",
                    style: "cancel"
                  },
                  {
                    text: "Se déconnecter", onPress: async () => {
                      logout.mutate()
                    }
                  }]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: Colors.grayLight
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
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.lg,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    paddingLeft: Spacings.xxs
  },
  userExpiresAt: {
    marginTop: Spacings.xs,
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
    textAlign: 'right',
  },
  section: {
    marginBottom: Spacings.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacings.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: Spacings.md,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    marginLeft: Spacings.sm,
  },

  // Noti
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  iconContainer: {
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
  },
});