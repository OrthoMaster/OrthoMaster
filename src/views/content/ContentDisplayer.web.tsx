/**
 * @author Francis
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import XMLParser from 'react-xml-parser';
import { Styles } from "../../../constants/Styles";

import { useQuery } from "@tanstack/react-query";
import { orthomasterShare } from "../../futils";
import { IContent } from "../../utils/interfaces";

import { getContent, trackMedia, getToolContent } from "../../services/v2/ContentService";
import { toggleFavourite } from "../../services/v2/FavouriteService";
import useDebouncedToggle from "../../hooks/useDebouncedToggle";
import { ContentFactory } from "../content/components/ContentFactory";
import { MediaBlockRenderer } from '../media/components/MediaBlockRenderer';
import { MediaContentHeader } from '../media/components/MediaContentHeader';
import LessonSkeleton from '../training/components/LessonSkeleton';

const HEADER_HEIGHT = 100;

export const ContentDisplayer = ({ navigation, route }) => {
  const { content, type = 'flash' } = route.params;

  const [showContent, setShowContent] = useState(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const shareMedia = async (media2share: IContent) => {
    orthomasterShare(
      {
        title: media2share.title,
        message:
          "Voici un contenu intéressant à voir sur OrthoMaster :\n\n" +
          media2share.title +
          " par " +
          media2share.author +
          "\n\n" +
          "https://go.orthomaster.fr/open/media-preview/" +
          media2share.id_content,
      },
      "média",
      media2share.id_content
    );
  };

  // Get first data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['mediaContent', content.id_content],
    queryFn: () => type == 'tool' ? getToolContent(content.id_content) : getContent(content.id_content),
    retry: 2,
    retryDelay: 1000,
  });

  const showActions = data?.type == 'flash';

  // Tracking
  useEffect(() => {
    let cancelled = false;

    trackMedia(content.id_content).then((id) => {
      if (!cancelled) setTrackingId(id ?? null);
    });

    return () => { cancelled = true; };
  }, [content.id_content]);

  useEffect(() => {
    // v1 : contenu XML historique
    if (data?.version == 'v1' && data?.xml_content) {
      const parsed = new XMLParser().parseFromString(data.xml_content);
      setShowContent(parsed);
      setBlocks([]);
      return;
    }

    // v2 : blocs Editor.js stockés dans `blocks.content`
    if (data?.version == 'v2') {
      setShowContent(null);

      try {
        const raw = data?.block?.content;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

        setBlocks(Array.isArray(parsed?.blocks) ? parsed.blocks : []);
      } catch (e) {
        setBlocks([]);
      }
    }
  }, [data]);

  // Handle close modal
  const closeScreen = (): void => {
    navigation.goBack();
  };

  // Handle like
  const [liked, toggleLiked] = useDebouncedToggle(
    !!(data?.has_like ?? content.has_like),
    async () => {
      if (!content?.id_content) return false;

      return await toggleFavourite(content.id_content, 'video');
    },
    { tag: 'content-displayer-web' }
  );

  const handleLike = (): void => {
    if (!content?.id_content) return;
    toggleLiked();
  };

  // Handle share
  const shareContent = (): void => {
    if (content) {
      shareMedia(content);
    }
    return;
  };

  return (
    <SafeAreaView style={Styles.container} edges={['top', 'left', 'right']}>
      {/* Header fixe : bouton retour + actions */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={closeScreen} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={30} color={Colors.text} />
          </TouchableOpacity>

          {showActions && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareContent}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Partager"
              >
                <Ionicons name="share-social" size={26} color={Colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, liked && styles.actionButtonActive]}
                onPress={handleLike}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: liked }}
                accessibilityLabel={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? Colors.danger : Colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
            style={{ zIndex: 9999 }}
          />
        }
      >
        {/* Show error */}
        {error && !isLoading &&
          <View style={[Styles.container, styles.errorContainer]}>
            <Text style={styles.errorText}>Impossible de charger le contenu. Réessayez ou contactez-nous si le problème persiste.</Text>
          </View>
        }

        {/* Show loading for initial load */}
        {isLoading &&
          <LessonSkeleton numberOfObjects={2} />
        }

        {/* v1 : rendu XML */}
        {showContent && (
          <View style={styles.lessonContent}>
            <ContentFactory
              component={showContent}
              contentInfos={data}
              onQuizCompleted={() => { }}
            />
          </View>
        )}

        {/* v2 : en-tête + blocs */}
        {!isLoading && data?.version == 'v2' && (
          <View style={styles.lessonContent}>
            <MediaContentHeader
              title={data?.video?.title || content.title}
              eventName={data?.event?.name}
              editionYear={data?.past_event?.edition_year}
              experts={data?.experts}
            />

            <MediaBlockRenderer
              blocks={blocks}
              navigation={navigation}
              contentWidth={900}
              trackingId={trackingId}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
  },
  backButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: Colors.dangerBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: Spacings.xxxxl,
  },
  lessonContent: {
    alignSelf: 'center',
    width: 900,
    paddingTop: Spacings.lg,
  },

  // Loading and error styles
  errorContainer: {
    marginTop: Spacings.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.danger,
    textAlign: 'center',
    backgroundColor: Colors.dangerBackground,
    marginHorizontal: Spacings.lg,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.danger,
  },
});