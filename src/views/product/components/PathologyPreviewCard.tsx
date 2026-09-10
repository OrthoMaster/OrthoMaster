import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { getPathologySummary } from '../../../services/v2/ProductService';
import { extractIntro } from '../lib/MarkdownIntro';
import { palette } from '../lib/Theme';

type Props = {
  dbId: string;
  fallbackTitle: string;
  onOpen: () => void;
};

// Inline preview of a pathology memo, styled as a yellow sticky note
// held by a metal clip. Shares its query key with
// PathologySummaryModal, so opening the full sheet is instant.
//
// Renders nothing until the memo has arrived — a skeleton would claim
// the space first, and the unroll would then play against an outline
// that was already there, reading as a flicker rather than a sheet of
// paper being laid down.
export function PathologyPreviewCard({ dbId, fallbackTitle, onOpen }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pathology-summary', dbId],
    queryFn: () => getPathologySummary(dbId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Paper unrolls left-to-right, then the clip snaps down onto it.
  const [paperW, setPaperW] = useState(0);
  const unroll = useRef(new Animated.Value(0)).current;
  const clip = useRef(new Animated.Value(0)).current;
  const played = useRef(false);

  useEffect(() => {
    if (paperW === 0 || played.current) return;
    played.current = true;

    Animated.sequence([
      Animated.timing(unroll, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(clip, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 14,
      }),
    ]).start();
  }, [paperW, unroll, clip]);

  const intro = extractIntro(data?.content);
  const hasMemo = !!data?.content && data.content.trim() !== '';
  if (isLoading || isError || !data || !hasMemo) return null;

  const heading = data.title?.trim() || fallbackTitle;

  // scaleX pivots around the centre, so translateX compensates to keep
  // the left edge fixed: at scale s the left edge sits at -w*s/2, and we
  // want it at -w/2 — hence a shift of (w/2)(s-1).
  const scaleX = unroll.interpolate({ inputRange: [0, 1], outputRange: [0.02, 1] });
  const shiftX = unroll.interpolate({
    inputRange: [0, 1],
    outputRange: [-paperW / 2, 0],
  });
  const tilt = unroll.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: ['-3.5deg', '-1.2deg', '-0.7deg'],
  });

  const clipDrop = clip.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const clipScale = clip.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        onLayout={e => setPaperW(e.nativeEvent.layout.width)}
        style={[
          styles.paper,
          {
            opacity: unroll,
            transform: [
              { translateX: shiftX },
              { scaleX },
              { rotate: tilt },
            ],
          },
        ]}
      >
        <Pressable onPress={onOpen}>
          <View style={styles.head}>
            <MaterialCommunityIcons
              name="lightbulb-variant"
              size={30}
              color="#7A6418"
              style={styles.headIcon}
            />
            <Text style={styles.headTitle}>Fiche Mémo</Text>
          </View>

          <View style={styles.body}>
            {!!data.segment && <Text style={styles.segment}>{data.segment}</Text>}
            <Text style={styles.heading} numberOfLines={2}>{heading}</Text>

            {intro !== '' && <Text style={styles.intro}>{intro}</Text>}

            <View style={styles.more}>
              <Text style={styles.moreText}>Voir fiche complète</Text>
              <Ionicons name="arrow-forward" size={15} color="#1B4E86" />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.clip,
          {
            opacity: clip, transform: [
              { translateY: clipDrop },
              { scale: clipScale },
              { rotate: '18deg' },
            ]
          },
        ]}
      >
        <MaterialCommunityIcons name="paperclip" size={38} color="#8A9099" />
      </Animated.View>
    </View>
  );
}

const PAPER = '#FCE45C';

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderColor: palette.border,
    marginTop: 10,
    // Room for the clip's loop reaching above the paper's top edge.
    paddingTop: 22,
  },
  paper: {
    backgroundColor: PAPER,
    borderRadius: 2,
    shadowColor: '#6B5A1A',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 4,
  },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 9,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E4C93A',
  },
  // Absolute so the title stays optically centred on the note rather
  // than being pushed right by the icon's width.
  headIcon: {
    position: 'absolute',
    left: 12,
    top: 10,
  },
  headTitle: {
    fontSize: 13,
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#7A6418',
  },

  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  segment: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#8A7226',
    marginBottom: 2,
  },
  heading: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#332D14',
  },
  intro: {
    fontSize: 15,
    fontFamily: 'Roboto',
    lineHeight: 22,
    textAlign: 'justify',
    color: '#494229',
    marginTop: 8,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  moreText: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Medium',
    color: '#1B4E86',
  },

  clip: {
    position: 'absolute',
    top: 0,
    right: 22,
    // Tilted so it looks placed by hand rather than stamped on.
    transform: [{ rotate: '18deg' }],
  },
});