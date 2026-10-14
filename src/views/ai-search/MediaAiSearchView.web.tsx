import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../../../constants/Colors';

import { AiSearchVideo } from '../../services/v2/ContentService';
import { AiSearchPanel } from './AiSearchPanel';

/*
 * Écran de lecture d'une vidéo selon la pile d'où l'assistant est ouvert : chaque pile
 * a ses propres noms d'écran, naviguer vers un écran d'une autre pile donne une 404.
 */
const PREVIEW_SCREENS = {
  media: 'flash-media-preview',
} as const;

type OpenFrom = keyof typeof PREVIEW_SCREENS;

/** Même largeur que le panneau de recherche. */
const PANEL_WIDTH = 800;

/**
 * Version web de l'écran flash-ai-search, pour une ouverture directe (lien, autre écran).
 * Depuis la recherche, l'assistant s'affiche à l'intérieur du panneau de recherche
 * (FlashSearchView.web) sans passer par cet écran : pas de nouvelle animation de pile.
 */
export const MediaAiSearchView = ({ navigation, route }) => {
  const openFrom: OpenFrom = route.params?.openFrom ?? 'media';
  const initialMessage: string | undefined = route.params?.initialMessage;

  // Stable pour toute la vie de l'écran : le panneau n'envoie le message qu'une fois.
  const pendingMessage = useMemo(
    () => (initialMessage ? { text: initialMessage, nonce: 1 } : null),
    [initialMessage]
  );

  const openVideo = (video: AiSearchVideo) => {
    navigation.navigate(PREVIEW_SCREENS[openFrom], { media: video });
  };

  return (
    // Clic sur le voile = fermeture, comme le panneau de recherche.
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => navigation.goBack()}>
      <TouchableOpacity activeOpacity={1} style={styles.panel} onPress={(e) => e.stopPropagation()}>
        <AiSearchPanel
          onBack={() => navigation.goBack()}
          onOpenVideo={openVideo}
          pendingMessage={pendingMessage}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    cursor: 'default' as any,
  },
  panel: {
    width: PANEL_WIDTH,
    maxWidth: '100%',
    height: '100%',
    backgroundColor: Colors.grayLight,
    shadowColor: Colors.black,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    cursor: 'default' as any,
  },
});