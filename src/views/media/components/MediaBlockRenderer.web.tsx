/**
 * Rendu du corps d'un média en version 2 (blocs Editor.js) — version web.
 * Même logique que la version native, avec une mise en page centrée
 * et des marges adaptées à un écran large.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import ParagraphBlock from '../../training/components/ParagraphBlock';
import ListBlock from '../../training/components/ListBlock';
import { VideoPlayer } from './VideoPlayer';
import { MediaImageBlock } from './MediaImageBlock';

import MediaQuizBlock from './MediaQuizBlock';
import MediaPodcastBlock from './MediaPodcastBlock';
import MediaInfographicBlock from './MediaInfographicBlock';

export interface MediaBlock {
  id: string;
  type: string;
  data: any;
  tunes?: any;
}

type Props = {
  blocks: MediaBlock[];
  navigation?: any;
  /** Largeur du conteneur de lecture, pour dimensionner le lecteur vidéo */
  contentWidth?: number;
  trackingId?: number | null;
};

const SUPPORTED = ['header', 'paragraph', 'list', 'image', 'video'];
const DEFAULT_WIDTH = 900;

export const MediaBlockRenderer = ({ blocks, navigation, contentWidth = DEFAULT_WIDTH, trackingId }: Props) => {

  /**
   * Index des blocs vidéo suivis immédiatement d'un bloc « chapters ».
   */
  const videosWithChapters = useMemo(() => {
    const set = new Set<number>();

    blocks.forEach((block, i) => {
      if (block.type !== 'video') return;

      const next = blocks[i + 1];
      if (next && next.type === 'chapters') {
        set.add(i);
      }
    });

    return set;
  }, [blocks]);

  const renderBlock = (block: MediaBlock, index: number) => {
    const key = `${block.id}_${index}`;

    // Le bloc chapitres est un simple marqueur : rien à afficher
    if (block.type === 'chapters') return null;

    // Titre
    if (block.type === 'header' && block.data?.text) {
      const level = block.data.level || 3;

      return (
        <View key={key} style={styles.headerBlock}>
          <Text style={styles[`heading${level}`] || styles.heading3}>
            {block.data.text}
          </Text>
        </View>
      );
    }

    // Paragraphe
    if (block.type === 'paragraph' && block.data?.text) {
      const variant = block.tunes?.textVariant || '';

      if (variant === 'call-out') {
        return (
          <View key={key} style={styles.calloutBlock}>
            <ParagraphBlock style={styles.calloutText} htmlContent={block.data.text} />
          </View>
        );
      }

      if (variant === 'citation') {
        return (
          <View key={key} style={styles.citationBlock}>
            <ParagraphBlock style={styles.citationText} type="citation" htmlContent={block.data.text} />
          </View>
        );
      }

      if (variant === 'details') {
        return (
          <View key={key} style={styles.detailsBlock}>
            <ParagraphBlock style={styles.detailsText} type="details" htmlContent={block.data.text} />
          </View>
        );
      }

      return (
        <View key={key} style={styles.paragraphBlock}>
          <ParagraphBlock style={styles.paragraph} htmlContent={block.data.text} />
        </View>
      );
    }

    // Liste
    if (block.type === 'list' && Array.isArray(block.data?.items)) {
      return (
        <View key={key} style={styles.listBlock}>
          <ListBlock items={block.data.items} style={block.data.style} markerStyle={{ color: Colors.subtext }} itemStyle={styles.paragraph} />
        </View>
      );
    }

    // Image
    if (block.type === 'image' && block.data?.file?.url) {
      return (
        <View key={key} style={styles.imageBlock}>
          <MediaImageBlock
            url={block.data.file.url}
            caption={block.data.caption}
            width={contentWidth}
          />
        </View>
      );
    }

    // Vidéo HLS
    if (block.type === 'video' && block.data?.code) {
      return (
        <View key={key} style={styles.videoBlock}>
          <VideoPlayer
            videoCode={block.data.code}
            navigation={navigation}
            embedWidth={contentWidth}
            showChapters={videosWithChapters.has(index)}
            trackingId={trackingId}
          />
        </View>
      );
    }

    // Quiz rattaché : jouable directement dans l'article
    if (block.type === 'quiz' && block.data?.id) {
      return (
        <View key={key} style={styles.linkedBlock}>
          <MediaQuizBlock questionId={block.data.id} fallbackTitle={block.data.title} />
        </View>
      );
    }

    // Podcast rattaché
    if (block.type === 'podcast' && block.data?.id) {
      return (
        <View key={key} style={styles.linkedBlock}>
          <MediaPodcastBlock
            podcastId={block.data.id}
            fallbackTitle={block.data.title}
            navigation={navigation}
          />
        </View>
      );
    }

    // Infographie rattachée
    if (block.type === 'infographic' && block.data?.id) {
      return (
        <View key={key} style={styles.linkedBlock}>
          <MediaInfographicBlock
            infographicId={block.data.id}
            fallbackTitle={block.data.title}
            navigation={navigation}
          />
        </View>
      );
    }

    if (!SUPPORTED.includes(block.type)) return null;

    return null;
  };

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <Text style={styles.emptyText}>Aucun contenu à afficher.</Text>
      </View>
    );
  }

  return <>{blocks.map(renderBlock)}</>;
};

export default MediaBlockRenderer;

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: Spacings.md,
    marginTop: Spacings.xl,
  },
  heading1: { fontSize: 32, fontFamily: 'Poppins-Medium', color: Colors.primary },
  heading2: { fontSize: 26, fontFamily: 'Poppins-Medium', color: Colors.primary },
  heading3: { fontSize: 22, fontFamily: 'Poppins-Medium', color: Colors.text },
  heading4: { fontSize: 19, fontFamily: 'Poppins-Medium', color: Colors.text },

  paragraphBlock: {
    marginBottom: Spacings.md,
  },
  paragraph: {
    textAlign: 'justify',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Roboto',
    color: Colors.subtext2,
  },

  calloutBlock: {
    padding: Spacings.xl,
    backgroundColor: Colors.black,
    marginBottom: Spacings.lg,
  },
  calloutText: {
    textAlign: 'justify',
    fontSize: 16,
    lineHeight: 26,
    color: Colors.white,
  },

  citationBlock: {
    paddingVertical: Spacings.xl,
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight,
    marginBottom: Spacings.lg,
  },
  citationText: {
    textAlign: 'justify',
    fontSize: 16,
    lineHeight: 26,
    color: Colors.text,
  },

  detailsBlock: {
    marginBottom: Spacings.lg,
    paddingLeft: Spacings.lg,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  detailsText: {
    textAlign: 'justify',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },

  listBlock: {
    marginBottom: Spacings.md,
  },

  imageBlock: {
    marginBottom: Spacings.xl,
  },

  videoBlock: {
    marginBottom: Spacings.xl,
  },

  linkedBlock: {
    marginBottom: Spacings.xl,
  },

  emptyBlock: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.subtext,
    fontFamily: 'Poppins-Regular',
  },
});