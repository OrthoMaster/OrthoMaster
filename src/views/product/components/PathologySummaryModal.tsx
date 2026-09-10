import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Modal, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { getPathologySummary } from '../../../services/v2/ProductService';
import { MarkdownText } from './MarkdownText';

type Props = {
  visible: boolean;
  // db_id from the rules.json child. Null → nothing to fetch.
  dbId?: string | null;
  // Fallback heading. The API row may have no title of its own, so the
  // child's label is what the user actually recognises.
  fallbackTitle: string;
  onClose: () => void;
};

// Full memo sheet. Styled as the same yellow paper as
// PathologyPreviewCard — opening the note should feel like picking that
// note up, not like landing on a different screen.
export function PathologySummaryModal({ visible, dbId, fallbackTitle, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pathology-summary', dbId],
    queryFn: () => getPathologySummary(dbId as string),
    enabled: visible && !!dbId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const hasContent = !!data?.content && data.content.trim() !== '';
  const heading = data?.title?.trim() || fallbackTitle;

  // ---------- entrance choreography ----------
  // clip snaps on → text sweeps left-to-right → button pops in.
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  // Modal's own fade has no completion callback, so onShow is what tells
  // us the sheet is on screen and the sequence can start.
  const [shown, setShown] = useState(false);
  const [bodyW, setBodyW] = useState(0);

  useEffect(() => {
    if (!visible) {
      // Reset, otherwise the next open would show everything already in
      // place with no animation.
      setShown(false);
      bodyAnim.setValue(0);
      btnAnim.setValue(0);
    }
  }, [visible, bodyAnim, btnAnim]);

  // Body sweep waits for both the sheet AND the content, then the button
  // follows it. Chaining means the button never appears over text that
  // hasn't finished arriving.
  const canSweep = shown && !isLoading && bodyW > 0;
  useEffect(() => {
    if (!canSweep) return;
    Animated.sequence([
      Animated.timing(bodyAnim, {
        toValue: 1,
        duration: 460,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(btnAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 13,
        bounciness: 12,
      }),
    ]).start();
  }, [canSweep, bodyAnim, btnAnim]);

  // scaleX pivots around the centre, so translateX compensates to keep
  // the left edge fixed: at scale s the left edge sits at -w*s/2, and we
  // want it at -w/2 — hence a shift of (w/2)(s-1).
  const bodyScaleX = bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 1] });
  const bodyShiftX = bodyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-bodyW / 2, 0],
  });

  const btnScale = btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const btnRise = btnAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => setShown(true)}
    >
      {/* Backdrop is a SIBLING of the card, not its parent. Wrapping the
          card in a Pressable (to swallow taps) made that Pressable win
          the touch responder, so dragging never reached the ScrollView
          and the body wouldn't scroll. */}
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fermer"
        />

        <View style={styles.holder}>
          <View style={styles.card}>
            <Text style={styles.headTitle}>Fiche Mémo</Text>

            <View style={styles.identity}>
              <View style={styles.identityIcon}>
                <MaterialCommunityIcons name="lightbulb-variant" size={26} color="#7A6418" />
              </View>
              <View style={{ flex: 1 }}>
                {!!data?.segment && <Text style={styles.segment}>{data.segment}</Text>}
                <Text style={styles.title} numberOfLines={3}>{heading}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Body */}
            {isLoading ? (
              <View style={styles.state}>
                <ActivityIndicator size="small" color="#7A6418" />
                <Text style={styles.stateText}>Chargement de la fiche …</Text>
              </View>
            ) : isError ? (
              <View style={styles.state}>
                <Ionicons name="cloud-offline-outline" size={30} color="#8A7226" />
                <Text style={styles.stateText}>Impossible de charger la fiche.</Text>
              </View>
            ) : !hasContent ? (
              <View style={styles.state}>
                <Ionicons name="document-outline" size={30} color="#8A7226" />
                <Text style={styles.stateText}>
                  Aucune information disponible pour cette pathologie.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
              >
                {/* Sweeps open left-to-right, like ink laid down across
                    the sheet. onLayout feeds the pivot compensation. */}
                <Animated.View
                  onLayout={e => setBodyW(e.nativeEvent.layout.width)}
                  style={{
                    opacity: bodyAnim,
                    transform: [
                      { translateX: bodyShiftX },
                      { scaleX: bodyScaleX },
                    ],
                  }}
                >
                  <MarkdownText content={data!.content} />
                </Animated.View>
              </ScrollView>
            )}
          </View>

          <Animated.View
            style={[
              styles.closeWrap,
              { opacity: btnAnim, transform: [{ translateY: btnRise }, { scale: btnScale }] },
            ]}
            pointerEvents={btnAnim ? 'box-none' : 'none'}
          >
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const PAPER = '#fae679';
const BTN_H = 46;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(40, 34, 10, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  holder: {
    paddingTop: 18,
    flexShrink: 1,
    alignItems: 'center',
  },
  card: {
    backgroundColor: PAPER,
    borderRadius: 3,
    paddingBottom: 0,
    maxHeight: '100%',
    flexShrink: 1,
    shadowColor: '#4A3D0C',
    shadowOffset: { width: 3, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
    maxWidth: 600,
  },

  headTitle: {
    fontSize: 13,
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#7A6418',
    textAlign: 'center',
    paddingTop: 14,
    paddingBottom: 12,
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  identityIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3D63F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#8A7226',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#332D14',
  },

  divider: { height: 1, backgroundColor: '#E4C93A' },

  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 8,
    // Clears the floating button so the last line stays readable.
    paddingBottom: 60,
  },
  state: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 82,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    fontFamily: 'Roboto',
    color: '#6B6244',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 19,
  },

  // Wrapper carries the animation; the button keeps its own styling so
  // the pill shape isn't distorted by the parent's scale.
  closeWrap: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeBtn: {
    paddingHorizontal: 34,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#332D14',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  closeText: {
    color: PAPER,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.4,
  },
});