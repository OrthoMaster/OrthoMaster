import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

/** Accueil web « sans cadre » : les trois illustrations posées sur le fond, sans carte autour. */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  hasUnreadNotification = false,
  onProfilePress,
  onSearchPress,
  onToolPress,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const shortcuts = [
    { key: 'question', label: 'Poser une question', image: HOME_SHORTCUT_IMAGES.question, onPress: () => setShowInfoModal(true) },
    { key: 'tool', label: 'Prise en charge', image: HOME_SHORTCUT_IMAGES.tool, onPress: onToolPress },
    { key: 'search', label: 'Chercher un contenu', image: HOME_SHORTCUT_IMAGES.search, onPress: onSearchPress },
  ];

  return (
    <>
      <View style={styles.hero}>
        <Pressable
          style={styles.profileButton}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel={hasUnreadNotification ? 'Profil, notifications non lues' : 'Profil'}
        >
          <Ionicons name="person-outline" size={22} color={Colors.primaryInk} />
          {hasUnreadNotification && <View style={styles.profileDot} />}
        </Pressable>

        <Text style={styles.greeting}>Bonjour</Text>
        <Text style={styles.name} numberOfLines={1}>
          {userName}
        </Text>

        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Pressable key={item.key} onPress={item.onPress} accessibilityRole="button" style={styles.shortcut}>
              {(state: any) => (
                <>
                  <Image
                    source={{ uri: item.image }}
                    resizeMode="contain"
                    style={[styles.shortcutImage, state.hovered && styles.shortcutImageHovered]}
                  />
                  <View style={[styles.shortcutShadow, state.hovered && styles.shortcutShadowHovered]} />
                  <Text style={styles.shortcutLabel}>{item.label}</Text>
                </>
              )}
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
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56,
    paddingTop: 28,
    paddingBottom: Spacings.xxl,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: Spacings.lg,
    right: Spacings.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    fontSize: 16,
    lineHeight: 22,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
  name: {
    fontSize: 34,
    lineHeight: 44,
    color: Colors.text,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },

  /* ---- Raccourcis ---- */
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: Spacings.xxxl,
    rowGap: Spacings.md,
    marginTop: 22,
  },
  shortcut: {
    width: 220,
    alignItems: 'center',
  },
  shortcutImage: {
    width: 150,
    height: 150,
    transitionProperty: 'transform',
    transitionDuration: '200ms',
  } as any,
  shortcutImageHovered: {
    transform: [{ translateY: -8 }],
  },
  // Ombre au sol : l'illustration paraît flotter, et l'ombre se resserre quand elle monte.
  shortcutShadow: {
    width: 110,
    height: 12,
    borderRadius: 55,
    marginTop: Spacings.xxs,
    backgroundColor: 'rgba(170, 100, 0, 0.14)',
    transitionProperty: 'transform, opacity',
    transitionDuration: '200ms',
  } as any,
  shortcutShadowHovered: {
    transform: [{ scaleX: 0.8 }],
    opacity: 0.7,
  },
  shortcutLabel: {
    marginTop: 10,
    fontSize: 19,
    lineHeight: 26,
    color: Colors.warmDeep,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
});
