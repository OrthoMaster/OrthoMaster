/**
 * Rendu du corps d'un média en version 2 (blocs Editor.js).
 * Types gérés : header, paragraph, list, image, video, chapters.
 *
 * Le bloc « chapters » n'est jamais rendu : il sert uniquement d'indicateur.
 * Placé juste après un bloc vidéo, il déclenche l'affichage du sommaire
 * dans le lecteur, alimenté par fetchVideoAccess.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

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
  trackingId?: number | null;
};

const SUPPORTED = ['header', 'paragraph', 'list', 'image', 'video', 'quiz', 'podcast', 'infographic'];

export const MediaBlockRenderer = ({ blocks, navigation, trackingId }: Props) => {
  const screenWidth = Dimensions.get('window').width;

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

    // Paragraphe (les variantes de texte restent gérées si présentes)
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
          <ListBlock items={block.data.items} style={block.data.style} itemStyle={styles.paragraph} />
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
            width={screenWidth}
          />
        </View>
      );
    }

    // Vidéo HLS : le code provient de la fiche média
    if (block.type === 'video' && block.data?.code) {
      return (
        <View key={key} style={styles.videoBlock}>
          <VideoPlayer
            videoCode={block.data.code}
            navigation={navigation}
            embedWidth={screenWidth}
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

    // Type non pris en charge : on n'affiche rien plutôt qu'un bloc de debug
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
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.md,
    marginTop: Spacings.lg,
  },
  heading1: { fontSize: 26, fontFamily: 'Poppins-Medium', color: Colors.primary },
  heading2: { fontSize: 22, fontFamily: 'Poppins-Medium', color: Colors.primary },
  heading3: { fontSize: 20, fontFamily: 'Poppins-Medium', color: Colors.primary },
  heading4: { fontSize: 18, fontFamily: 'Poppins-Medium', color: Colors.primary },

  paragraphBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.md,
  },
  paragraph: {
    textAlign: 'justify',
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.text,
  },

  calloutBlock: {
    padding: Spacings.lg,
    backgroundColor: Colors.black,
    marginBottom: Spacings.lg,
  },
  calloutText: {
    textAlign: 'justify',
    fontSize: 14,
    color: Colors.white,
  },

  citationBlock: {
    paddingVertical: Spacings.xl,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.grayLight,
  },
  citationText: {
    textAlign: 'justify',
    fontSize: 14,
    lineHeight: 14,
    color: Colors.text,
  },

  detailsBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.lg,
    paddingLeft: Spacings.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  detailsText: {
    textAlign: 'justify',
    fontSize: 12,
    lineHeight: 12,
    color: Colors.text,
  },

  listBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.sm,
  },

  imageBlock: {
    marginBottom: Spacings.lg,
  },

  videoBlock: {
    marginBottom: Spacings.lg,
  },

  linkedBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.xl,
  },

  emptyBlock: {
    marginHorizontal: Spacings.lg,
    paddingVertical: Spacings.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.subtext,
    fontFamily: 'Roboto',
  },
});