import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

type SourceVideo = {
  id: string | number;
  title?: string | null;
  thumbnail?: string | null;
};

type Props = {
  video?: SourceVideo | null;
  onPress: () => void;
  /**
   * compact : ligne horizontale, fond sombre (lecteur podcast)
   * large   : vignette 16:9 pleine largeur, fond clair (résultat du quiz)
   */
  variant?: 'compact' | 'large';
  label?: string;
};

const DEFAULT_LABELS = {
  compact: 'Extrait du média',
  large: 'Pour aller plus loin',
};

const isWeb = Platform.OS === 'web';

export const SourceVideoCard = ({
  video,
  onPress,
  variant = 'compact',
  label,
}: Props) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (!video) return null;

  const resolvedLabel = label ?? DEFAULT_LABELS[variant];
  const showImage = !!video.thumbnail && !imageFailed;
  const isLarge = variant === 'large';

  const fallback = (
    <View style={styles.thumbFallback}>
      <Ionicons
        name="videocam"
        size={isLarge ? 28 : 18}
        color={isLarge ? Colors.gray : Colors.subtext2}
      />
    </View>
  );

  if (isLarge) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${resolvedLabel} : ${video.title ?? ''}. Ouvrir la vidéo`}
        style={styles.largeCard}
      >
        <Text style={styles.largeLabel}>{resolvedLabel}</Text>

        <View style={styles.largeThumbWrapper}>
          {showImage ? (
            <Image
              source={{ uri: video.thumbnail! }}
              style={styles.thumb}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            fallback
          )}

          <View style={styles.largePlayBadge}>
            <Ionicons name="play" size={20} color={Colors.white} />
          </View>
        </View>

        <View style={styles.largeTitleRow}>
          <Text style={styles.largeTitle} numberOfLines={2}>
            {video.title ?? 'Voir la vidéo'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${resolvedLabel} : ${video.title ?? ''}. Ouvrir la vidéo`}
      style={styles.compactCard}
    >
      <View style={styles.compactThumbWrapper}>
        {showImage ? (
          <Image
            source={{ uri: video.thumbnail! }}
            style={styles.thumb}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          fallback
        )}

        <View style={styles.compactPlayBadge}>
          <Ionicons name="play" size={11} color={Colors.white} />
        </View>
      </View>

      <View style={styles.compactTextBlock}>
        <Text style={styles.compactLabel} numberOfLines={1}>
          {resolvedLabel}
        </Text>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {video.title ?? 'Voir la vidéo'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.subtext2} />
    </TouchableOpacity>
  );
};

const COMPACT_THUMB_WIDTH = 84;
const COMPACT_THUMB_HEIGHT = 47; // 16:9

const styles = StyleSheet.create({
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Variante compact (fond sombre) ---- */
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacings.md,
  },
  compactThumbWrapper: {
    width: COMPACT_THUMB_WIDTH,
    height: COMPACT_THUMB_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlayBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  compactTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  compactLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: isWeb ? Colors.white : Colors.subtext2,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    lineHeight: 18,
  },

  /* ---- Variante large (fond clair) ---- */
  largeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacings.sm,
  },
  largeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    letterSpacing: 0.3,
    marginBottom: Spacings.xs,
  },
  largeThumbWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largePlayBadge: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
  },
  largeTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    lineHeight: 20,
  },
});

export default SourceVideoCard;