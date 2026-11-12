import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SendQuestionInfoModal from './components/SendQuestionInfoModal';

const S3_HOME = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/settings/home';
export const HOME_SHORTCUT_IMAGES = {
  question: `${S3_HOME}/question.gif`,
  tool: `${S3_HOME}/tool.gif`,
  search: `${S3_HOME}/search.gif`,
};

export interface HomeHeaderProps {
  userName?: string;
  hasUnreadNotification?: boolean;
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onToolPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  hasUnreadNotification = false,
  onProfilePress,
  onSearchPress,
  onToolPress,
}) => {
  const insets = useSafeAreaInsets();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const shortcuts = [
    { key: 'question', label: 'Poser une question', image: HOME_SHORTCUT_IMAGES.question, onPress: () => setShowInfoModal(true) },
    { key: 'tool', label: 'Prise en charge', image: HOME_SHORTCUT_IMAGES.tool, onPress: onToolPress },
    { key: 'search', label: 'Chercher un contenu', image: HOME_SHORTCUT_IMAGES.search, onPress: onSearchPress },
  ];

  return (
    <>
      {/* Le fond crème passe sous la barre d'état : la marge du haut vient des insets. */}
      <View style={[styles.hero, { paddingTop: insets.top + Spacings.sm }]}>
        <View style={styles.topRow}>
          <Image style={styles.logo} source={require('../../../assets/v2_images/logo/logo_primary_1024.png')} />
          <Text style={styles.brand}>OrthoMaster</Text>
          <Pressable
            style={styles.profileButton}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel={hasUnreadNotification ? 'Profil, notifications non lues' : 'Profil'}
          >
            <Ionicons name="person-outline" size={22} color={Colors.primaryInk} />
            {hasUnreadNotification && <View style={styles.profileDot} />}
          </Pressable>
        </View>

        <View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.name} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.shortcut, pressed && styles.shortcutPressed]}
            >
              <Image source={{ uri: item.image }} style={styles.shortcutImage} resizeMode="contain" />
              <Text style={styles.shortcutLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SendQuestionInfoModal visible={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  /* ---- Bloc ---- */
  hero: {
    backgroundColor: Colors.primaryLightBackground,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: Spacings.md,
    paddingBottom: 20,
    gap: Spacings.sm,
  },

  /* ---- Ligne du haut ---- */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  logo: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  brand: {
    flex: 1,
    fontSize: 17,
    color: Colors.primaryInk,
    fontFamily: 'Poppins-Medium',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  /* ---- Salutation ---- */
  greeting: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
  name: {
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Raccourcis ---- */
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  shortcut: {
    flex: 1,
    height: 104,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.xxs,
  },
  shortcutPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  shortcutImage: {
    width: 46,
    height: 46,
  },
  shortcutLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
});
