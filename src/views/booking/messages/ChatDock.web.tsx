import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { ConversationList } from './ConversationList';
import { ConversationThread } from './ConversationThread';
import { chatDock, useChatDock } from './chatDock';

const PANEL_WIDTH = 360;
const WINDOW_WIDTH = 340;
const WINDOW_HEIGHT = 470;
const MINIMIZED_HEIGHT = 56;
const EDGE = Spacings.md;
/** Barre latérale commune (AppTab.web) et demi-largeur de la barre d'onglets flottante, centrée. */
const SIDEBAR_WIDTH = 200;
const TAB_BAR_HALF = 190;

/**
 * Version WEB de la messagerie, à la manière de Facebook, par-dessus la page :
 *  - panneau flottant à droite (bouton Messages de la barre d'onglets) : liste des conversations ;
 *  - fenêtres de discussion ancrées en bas à droite, réductibles, deux au plus.
 * Toucher une conversation ou « Échanger avec l'expert » ouvre sa fenêtre.
 */
export const ChatDock = () => {
  const { panelOpen, windows } = useChatDock();
  const { width } = useWindowDimensions();

  // Les fenêtres ne recouvrent pas la barre d'onglets centrée : autant qu'il en tient à sa droite.
  const freeWidth = (width - SIDEBAR_WIDTH) / 2 - TAB_BAR_HALF - EDGE;
  const fitting = Math.max(1, Math.floor(freeWidth / (WINDOW_WIDTH + Spacings.sm)));
  const visible = windows.slice(0, fitting);

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.dock]}>
      {/* ---- Panneau des conversations ---- */}
      {panelOpen ? (
        <>
          {/* Clic à côté : le panneau se referme, sans voile sur la page. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => chatDock.togglePanel(false)} />
          <Animated.View entering={FadeInUp.duration(180)} exiting={FadeOut.duration(120)} style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Messages</Text>
              <Pressable
                onPress={() => chatDock.togglePanel(false)}
                style={({ hovered }: any) => [styles.round, hovered && styles.roundHovered]}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ConversationList
              active
              showTitle={false}
              onOpen={(conversation) => chatDock.open(conversation)}
              selectedId={windows[0]?.conversationId ?? null}
            />
          </Animated.View>
        </>
      ) : null}

      {/* ---- Fenêtres de discussion : la plus récente à droite ---- */}
      {visible.map((w, i) => (
        <Animated.View
          key={w.conversationId}
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(120)}
          style={[
            styles.window,
            { right: EDGE + i * (WINDOW_WIDTH + Spacings.sm), height: w.minimized ? MINIMIZED_HEIGHT : WINDOW_HEIGHT },
          ]}
        >
          <ConversationThread
            conversationId={w.conversationId}
            preview={w.preview}
            active={!w.minimized}
            minimized={w.minimized}
            onMinimize={() => chatDock.setMinimized(w.conversationId, true)}
            onExpand={() => chatDock.setMinimized(w.conversationId, false)}
            onClose={() => chatDock.close(w.conversationId)}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Au-dessus des écrans et de la barre d'onglets.
  dock: {
    zIndex: 20,
  },
  panel: {
    position: 'absolute',
    top: EDGE,
    right: EDGE,
    width: PANEL_WIDTH,
    maxWidth: '92%',
    height: '78%',
    maxHeight: 640,
    borderRadius: 16,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    zIndex: 30,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.xs,
  },
  panelTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grayLight,
  },
  roundHovered: {
    backgroundColor: Colors.border,
  },
  window: {
    position: 'absolute',
    bottom: 0,
    width: WINDOW_WIDTH,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    zIndex: 40,
  },
});
