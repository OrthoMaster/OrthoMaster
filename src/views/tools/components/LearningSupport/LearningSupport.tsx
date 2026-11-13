/**
 * Supports pédagogiques : liste des planches (anatomie / pathologie) que le pharmacien montre
 * au patient pour expliquer la zone douloureuse. Même composant pour mobile et web.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';

import { IContent } from '../../../../utils/interfaces';
import { fetchSearchList } from '../../../../services/SearchService';
import { getS3Image } from '../../../../services/S3Service';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

const IS_WEB = Platform.OS === 'web';

/* ---- Couleurs : bleu de la carte Supports pédagogiques ---- */
const COLOR = '#5AC4F6';
const COLOR_DARK = '#35A5DA';
const TILE_BACKGROUND = '#F2F8FC';
const TILE_BORDER = '#E3EEF6';

// Web : la boîte fait 700 px, quatre planches par ligne ; mobile : trois.
const COLUMNS = IS_WEB ? 4 : 3;
const SKELETON_COUNT = COLUMNS * 2;

const ACCESS_ICON = require('../../../../../assets/tools/learning-support/access-icon.png');
// Bandeau d'origine de la popup (texte « Support pédagogique » inclus dans l'image).
const HEADER_IMAGE = require('../../../../../assets/tools/learning-support/learning-support.png');
const HEADER_HEIGHT = IS_WEB ? 220 : 170;

type Category = 'anatomie' | 'pathologie';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'anatomie', label: 'Anatomie' },
  { key: 'pathologie', label: 'Pathologie' },
];

/* ---- Bouton d'accès (ancien écran Outils) ---- */

export const LearningSupportButton: React.FC<{ onPress: () => any }> = ({ onPress }) => (
  <TouchableOpacity style={styles.legacyButton} onPress={onPress}>
    <Image source={ACCESS_ICON} style={styles.legacyButtonImage} />
    <Text style={styles.legacyButtonText}>Supports pédagogiques</Text>
  </TouchableOpacity>
);

/* ---- Squelette ---- */

/** Opacité qui pulse doucement, partagée par tous les blocs d'un même squelette. */
const usePulse = () => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 800, useNativeDriver: !IS_WEB }),
        Animated.timing(value, { toValue: 0, duration: 800, useNativeDriver: !IS_WEB }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
};

const GridSkeleton = () => {
  const opacity = usePulse();
  return (
    <>
    <Animated.View style={[styles.skeletonTitle, { opacity }]} />
    <View style={styles.grid}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <View key={index} style={styles.tile}>
          <Animated.View style={[styles.tileImageBox, styles.skeletonBlock, { opacity }]} />
          <Animated.View style={[styles.skeletonLine, { opacity }]} />
          <Animated.View style={[styles.skeletonLine, styles.skeletonLineShort, { opacity }]} />
        </View>
      ))}
    </View>
    </>
  );
};

/* ---- Planche ---- */

const SupportTile: React.FC<{ content: IContent; onPress: (content: IContent) => void }> = ({ content, onPress }) => {
  const { data: imageUrl, isLoading, isError } = useQuery({
    queryKey: ['contentThumbnail', content.id_content, content.title],
    queryFn: () => getS3Image(`${content.s3_path}/${content.title}/logo.png`),
    enabled: !!(content.s3_path && content.title),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  const opacity = usePulse();
  const hasImage = !!imageUrl && !isError;

  return (
    <Pressable
      style={(state: any) => [styles.tile, (state.pressed || state.hovered) && styles.tileActive]}
      onPress={() => onPress(content)}
      accessibilityRole="button"
      accessibilityLabel={content.title}
    >
      <View style={styles.tileImageBox}>
        {isLoading ? (
          <Animated.View style={[StyleSheet.absoluteFill, styles.skeletonBlock, { opacity }]} />
        ) : hasImage ? (
          <Image source={{ uri: imageUrl }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          // Pas de vignette : l'icône de l'outil sur fond bleu plutôt qu'une case vide.
          <View style={styles.tileFallback}>
            <Image source={ACCESS_ICON} style={styles.tileFallbackIcon} resizeMode="contain" />
          </View>
        )}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>{content.title}</Text>
    </Pressable>
  );
};

/* ---- Popup ---- */

type LearningSupportMenuProps = {
  onClose: () => any;
  onStart: (content: IContent) => any;
};

export const LearningSupportMenu: React.FC<LearningSupportMenuProps> = ({ onClose, onStart }) => {
  const { data: toolContents, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['Tools', 'GET', 'Contents'],
    queryFn: () => fetchSearchList({ contentType: ['tool'], filters: null }),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const byCategory = useMemo(() => {
    const list: IContent[] = Array.isArray(toolContents) ? toolContents : [];
    return {
      anatomie: list.filter((content) => content.tags?.includes('anatomie')),
      pathologie: list.filter((content) => content.tags?.includes('pathologie')),
    };
  }, [toolContents]);

  // Toutes les catégories l'une sous l'autre ; une catégorie vide n'est pas affichée.
  const sections = CATEGORIES.filter((category) => byCategory[category.key].length > 0);

  const select = (content: IContent) => {
    onStart(content);
    onClose();
  };

  const loading = isLoading || (isError && isRefetching);

  return (
    <View style={styles.dialog}>
      {/* ---- En-tête : bandeau d'origine ---- */}
      <View style={styles.header}>
        <Image source={HEADER_IMAGE} style={styles.headerImage} resizeMode="contain" accessibilityLabel="Supports pédagogiques" />
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
          <Ionicons name="close" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* ---- Contenu ---- */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {loading && <GridSkeleton />}

        {!loading && isError && (
          <View style={styles.state}>
            <Ionicons name="cloud-offline-outline" size={40} color={COLOR} />
            <Text style={styles.stateTitle}>Impossible de charger les supports</Text>
            <Text style={styles.stateText}>Vérifiez votre connexion puis réessayez.</Text>
            <Pressable style={styles.retry} onPress={() => refetch()} accessibilityRole="button">
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {!loading && !isError && sections.length === 0 && (
          <View style={styles.state}>
            <Ionicons name="images-outline" size={40} color={COLOR} />
            <Text style={styles.stateTitle}>Aucun support disponible</Text>
            <Text style={styles.stateText}>Les planches apparaîtront ici dès leur publication.</Text>
          </View>
        )}

        {!loading && !isError && sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.label}</Text>
            <View style={styles.grid}>
              {byCategory[section.key].map((content) => (
                <SupportTile key={content.id_content} content={content} onPress={select} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Boîte ---- */
  dialog: {
    width: '100%',
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
  },

  /* ---- En-tête ---- */
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: COLOR,
    borderBottomWidth: 4,
    borderBottomColor: COLOR_DARK,
    paddingVertical: Spacings.sm,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    top: Spacings.sm,
    right: Spacings.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Contenu ---- */
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: Spacings.md - 6,
    paddingBottom: Spacings.lg,
  },
  section: {
    marginBottom: Spacings.sm,
  },
  sectionTitle: {
    marginHorizontal: 6,
    marginTop: Spacings.xs,
    marginBottom: Spacings.xs,
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'Poppins-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /* ---- Planche ---- */
  tile: {
    width: `${100 / COLUMNS}%`,
    padding: 6,
    borderRadius: 18,
  },
  tileActive: {
    backgroundColor: TILE_BACKGROUND,
  },
  tileImageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: TILE_BACKGROUND,
    borderWidth: 1,
    borderColor: TILE_BORDER,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileFallback: {
    flex: 1,
    backgroundColor: COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFallbackIcon: {
    width: '45%',
    height: '45%',
  },
  tileTitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Squelette ---- */
  skeletonBlock: {
    backgroundColor: '#E4EEF5',
    borderColor: '#E4EEF5',
  },
  skeletonTitle: {
    width: 120,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 6,
    marginTop: Spacings.sm,
    marginBottom: Spacings.xs,
    backgroundColor: '#E4EEF5',
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    marginTop: 8,
    marginHorizontal: '12%',
    backgroundColor: '#E4EEF5',
  },
  skeletonLineShort: {
    marginHorizontal: '30%',
    marginTop: 6,
  },

  /* ---- États ---- */
  state: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    gap: Spacings.xs,
  },
  stateTitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  stateText: {
    fontSize: 14,
    color: Colors.warmMuted,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  retry: {
    marginTop: Spacings.sm,
    height: 44,
    paddingHorizontal: Spacings.lg,
    borderRadius: 22,
    backgroundColor: COLOR,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Bouton d'accès (ancien) ---- */
  legacyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR,
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
  },
  legacyButtonImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  legacyButtonText: {
    fontSize: 20,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
});
