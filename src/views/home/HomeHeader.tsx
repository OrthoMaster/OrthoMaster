import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SendQuestionInfoModal from './components/SendQuestionInfoModal';

// Flèche de l'arrondi du bas : le fond suit une courbe sur toute la largeur, comme sur le web.
const HERO_CURVE = 40;

const S3_HOME = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/settings/home';
export const HOME_SHORTCUT_IMAGES = {
  question: `${S3_HOME}/question.gif`,
  tool: `${S3_HOME}/tool.gif`,
  search: `${S3_HOME}/search.gif`,
};
const PROFILE_IMAGE = `${S3_HOME}/profile.png`;

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
  const { width } = useWindowDimensions();
  const radius = (width * width / 4 + HERO_CURVE * HERO_CURVE) / (2 * HERO_CURVE);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Libellés coupés à la main : toujours deux lignes, pour que les trois raccourcis restent alignés.
  const shortcuts = [
    { key: 'question', label: 'Poser une\nquestion', image: HOME_SHORTCUT_IMAGES.question, onPress: () => setShowInfoModal(true) },
    { key: 'tool', label: 'Prise en\ncharge', image: HOME_SHORTCUT_IMAGES.tool, onPress: onToolPress },
    { key: 'search', label: 'Chercher\nun contenu', image: HOME_SHORTCUT_IMAGES.search, onPress: onSearchPress },
  ];

  return (
    <>
      {/* Le fond crème passe sous la barre d'état : la marge du haut vient des insets. */}
      <View style={[styles.hero, { paddingTop: insets.top + Spacings.sm }]}>
        <View
          pointerEvents="none"
          style={[styles.heroBackground, { width: radius * 2, height: radius * 2, borderRadius: radius, left: width / 2 - radius }]}
        />
        <View style={styles.topRow}>
          <Image style={styles.logo} source={require('../../../assets/v2_images/logo/logo_primary_1024.png')} />
          <Text style={styles.brand}>OrthoMaster</Text>
          <Pressable
            style={styles.profileButton}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel={hasUnreadNotification ? 'Profil, notifications non lues' : 'Profil'}
          >
            <Image source={{ uri: PROFILE_IMAGE }} style={styles.profileIcon} />
            {hasUnreadNotification && <View style={styles.profileDot} />}
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
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
              <Text style={styles.shortcutLabel} numberOfLines={2}>{item.label}</Text>
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
    overflow: 'hidden',
    paddingHorizontal: Spacings.md,
    paddingBottom: 20 + HERO_CURVE / 2,
    gap: Spacings.sm,
  },
  // Très grand cercle dont seul le bas dépasse : arrondi continu au lieu de deux coins.
  heroBackground: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.primaryLightBackground,
  },
  greetingBlock: {
    alignItems: 'center',
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
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  // Pas de fond blanc : un orange pâle cerclé, plus foncé que la crème, avec une ombre chaude pour qu'il ressorte.
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFE1B5',
    borderWidth: 1.5,
    borderColor: '#FFC370',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  // Même silhouette que l'onglet Profil, en dégradés de primary pour rester dans les tons de l'en-tête.
  profileIcon: {
    width: 21,
    height: 25,
    resizeMode: 'contain',
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
    borderColor: '#FFE1B5',
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
    textAlign: 'center',
    color: Colors.text,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Raccourcis ---- */
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  // Sans fond, comme sur le web : l'illustration est posée directement sur la crème.
  shortcut: {
    flex: 1,
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingTop: Spacings.xxs,
  },
  shortcutPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  shortcutImage: {
    width: 64,
    height: 64,
  },
  shortcutLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
});
