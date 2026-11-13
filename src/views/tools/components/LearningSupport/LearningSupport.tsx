/**
 * Supports pédagogiques : liste des planches (anatomie / pathologie) que le pharmacien montre
 * au patient pour expliquer la zone douloureuse. Même composant pour mobile et web.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const TAB_BACKGROUND = '#EAF5FC';

// Web : la boîte fait 700 px, quatre planches par ligne ; mobile : trois.
const COLUMNS = IS_WEB ? 4 : 3;
const SKELETON_COUNT = COLUMNS * 2;

const ACCESS_ICON = require('../../../../../assets/tools/learning-support/access-icon.png');

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
    <View style={styles.grid}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <View key={index} style={styles.tile}>
          <Animated.View style={[styles.tileImageBox, styles.skeletonBlock, { opacity }]} />
          <Animated.View style={[styles.skeletonLine, { opacity }]} />
          <Animated.View style={[styles.skeletonLine, styles.skeletonLineShort, { opacity }]} />
        </View>
      ))}
    </View>
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

  // Onglets seulement pour les catégories qui ont des planches ; la première non vide est ouverte.
  const tabs = CATEGORIES.filter((category) => byCategory[category.key].length > 0);
  const [active, setActive] = useState<Category>('anatomie');
  const current = tabs.find((tab) => tab.key === active) ? active : tabs[0]?.key;
  const items = current ? byCategory[current] : [];

  const select = (content: IContent) => {
    onStart(content);
    onClose();
  };

  const loading = isLoading || (isError && isRefetching);

  return (
    <View style={styles.dialog}>
      {/* ---- En-tête ---- */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Image source={ACCESS_ICON} style={styles.headerIconImage} resizeMode="contain" />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>Supports pédagogiques</Text>
          <Text style={styles.headerSubtitle}>Choisissez une planche à montrer au patient</Text>
        </View>
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
          <Ionicons name="close" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* ---- Onglets ---- */}
      {!loading && !isError && tabs.length > 1 && (
        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const selected = tab.key === current;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => setActive(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {tab.label} · {byCategory[tab.key].length}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

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

        {!loading && !isError && items.length === 0 && (
          <View style={styles.state}>
            <Ionicons name="images-outline" size={40} color={COLOR} />
            <Text style={styles.stateTitle}>Aucun support disponible</Text>
            <Text style={styles.stateText}>Les planches apparaîtront ici dès leur publication.</Text>
          </View>
        )}

        {!loading && !isError && items.length > 0 && (
          <>
            {tabs.length === 1 && <Text style={styles.sectionTitle}>{tabs[0].label}</Text>}
            <View style={styles.grid}>
              {items.map((content) => (
                <SupportTile key={content.id_content} content={content} onPress={select} />
              ))}
            </View>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: COLOR,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderBottomWidth: 4,
    borderBottomColor: COLOR_DARK,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconImage: {
    width: 32,
    height: 32,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 25,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Onglets ---- */
  tabs: {
    flexDirection: 'row',
    margin: Spacings.md,
    marginBottom: 0,
    padding: 4,
    borderRadius: 999,
    backgroundColor: TAB_BACKGROUND,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: COLOR,
  },
  tabText: {
    fontSize: 14,
    color: COLOR_DARK,
    fontFamily: 'Poppins-Medium',
  },
  tabTextSelected: {
    color: Colors.white,
  },

  /* ---- Contenu ---- */
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: Spacings.md - 6,
    paddingBottom: Spacings.lg,
  },
  sectionTitle: {
    marginHorizontal: 6,
    marginTop: 6,
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
