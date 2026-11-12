import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SendQuestionInfoModal from './components/SendQuestionInfoModal';
import { HomeBreakpoint, useHomeLayout } from './components/useHomeLayout';

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

/* ---- Tailles par largeur d'écran ---- */
// curve = flèche de l'arrondi du bas : plus l'écran est large, plus elle est profonde pour rester visible.
const SIZES: Record<HomeBreakpoint, {
  name: number;
  greeting: number;
  image: number;
  label: number;
  itemWidth: number;
  columnGap: number;
  paddingTop: number;
  curve: number;
}> = {
  md: { name: 30, greeting: 15, image: 116, label: 16, itemWidth: 176, columnGap: 28, paddingTop: 24, curve: 56 },
  lg: { name: 36, greeting: 16, image: 150, label: 19, itemWidth: 220, columnGap: 64, paddingTop: 28, curve: 88 },
  xl: { name: 42, greeting: 18, image: 184, label: 21, itemWidth: 260, columnGap: 104, paddingTop: 36, curve: 120 },
};

/** Accueil web « sans cadre » : les trois illustrations posées sur le fond, sans carte autour. */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  hasUnreadNotification = false,
  onProfilePress,
  onSearchPress,
  onToolPress,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { breakpoint, pageWidth, padding } = useHomeLayout();
  const size = SIZES[breakpoint];

  // Le fond est un très grand cercle dont seul le bas dépasse : l'arrondi suit toute la largeur,
  // ce qu'un borderRadius de coin ne donne pas sur un écran large.
  const radius = (pageWidth * pageWidth / 4 + size.curve * size.curve) / (2 * size.curve);

  const shortcuts = [
    { key: 'question', label: 'Poser une question', image: HOME_SHORTCUT_IMAGES.question, onPress: () => setShowInfoModal(true) },
    { key: 'tool', label: 'Prise en charge', image: HOME_SHORTCUT_IMAGES.tool, onPress: onToolPress },
    { key: 'search', label: 'Chercher un contenu', image: HOME_SHORTCUT_IMAGES.search, onPress: onSearchPress },
  ];

  return (
    <>
      <View
        style={[
          styles.hero,
          { paddingTop: size.paddingTop, paddingBottom: Spacings.lg + size.curve * 0.5, paddingHorizontal: padding },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.heroBackground,
            { width: radius * 2, height: radius * 2, borderRadius: radius, left: pageWidth / 2 - radius },
          ]}
        />

        <Pressable
          style={[styles.profileButton, { right: padding }]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel={hasUnreadNotification ? 'Profil, notifications non lues' : 'Profil'}
        >
          <Ionicons name="person-outline" size={22} color={Colors.primaryInk} />
          {hasUnreadNotification && <View style={styles.profileDot} />}
        </Pressable>

        <Text style={[styles.greeting, { fontSize: size.greeting, lineHeight: size.greeting + 6 }]}>Bonjour</Text>
        <Text style={[styles.name, { fontSize: size.name, lineHeight: size.name + 10 }]} numberOfLines={1}>
          {userName}
        </Text>

        <View style={[styles.shortcuts, { columnGap: size.columnGap }]}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              accessibilityRole="button"
              style={[styles.shortcut, { width: size.itemWidth }]}
            >
              {(state: any) => (
                <>
                  <Image
                    source={{ uri: item.image }}
                    resizeMode="contain"
                    style={[
                      styles.shortcutImage,
                      { width: size.image, height: size.image },
                      state.hovered && styles.shortcutImageHovered,
                    ]}
                  />
                  <Text style={[styles.shortcutLabel, { fontSize: size.label, lineHeight: size.label + 7 }]}>
                    {item.label}
                  </Text>
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
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroBackground: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.primaryLightBackground,
  },
  profileButton: {
    position: 'absolute',
    top: Spacings.lg,
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
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
  name: {
    color: Colors.text,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },

  /* ---- Raccourcis ---- */
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: Spacings.md,
    marginTop: 22,
  },
  shortcut: {
    alignItems: 'center',
  },
  shortcutImage: {
    transitionProperty: 'transform',
    transitionDuration: '200ms',
  } as any,
  shortcutImageHovered: {
    transform: [{ translateY: -8 }],
  },
  shortcutLabel: {
    marginTop: Spacings.sm,
    color: Colors.warmDeep,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
});
