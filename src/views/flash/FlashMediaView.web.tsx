import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import Modal from 'react-native-modal';
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarouselWeb';
import { IContent } from '../../utils/interfaces';
import { PreviewMediaParams } from './PreviewMediaView';

import { getEvents, getTrends, getCategories, getContent } from '../../services/v2/ContentService';
import { useAiSearchAvailable } from '../../hooks/useAiSearchAvailable';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

/* ===================== Loupe animée de l'en-tête ===================== */

/*
 * Quand l'assistant IA est disponible : un cercle blanc se trace autour de la loupe en
 * partant du coin supérieur droit, puis une étoile à quatre branches apparaît à ce point
 * de départ. Le cercle a la taille du fond blanc affiché au survol.
 * Animation CSS (fichier web uniquement) : un seul cycle, sans rendu React à chaque image.
 */
const SEARCH_ICON_SIZE = 34;
const SEARCH_BUTTON_PADDING = 8;
const SEARCH_RING_STROKE = 1;
const SEARCH_STAR_SIZE = 18;
/** Durée d'un cycle complet : tracé, étoile, pause, disparition. */
const SEARCH_CYCLE_S = 3.6;

const searchRingKeyframes = (circumference: number) => `
@keyframes aiSearchRing {
  0%        { stroke-dashoffset: ${circumference}; opacity: 1; }
  32%       { stroke-dashoffset: 0; opacity: 1; }
  82%       { stroke-dashoffset: 0; opacity: 1; }
  94%, 100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes aiSearchStar {
  0%, 32%   { opacity: 0; transform: scale(.2) rotate(0deg); }
  44%       { opacity: 1; transform: scale(1.2) rotate(90deg); }
  52%, 82%  { opacity: 1; transform: scale(1) rotate(90deg); }
  94%, 100% { opacity: 0; transform: scale(1) rotate(90deg); }
}
.ai-search-ring { animation: aiSearchRing ${SEARCH_CYCLE_S}s ease-in-out infinite; }
.ai-search-star { opacity: 0; animation: aiSearchStar ${SEARCH_CYCLE_S}s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ai-search-ring { animation: none; stroke-dashoffset: 0; }
  .ai-search-star { animation: none; opacity: 1; }
}
`;

const AiSearchHeaderButton = ({ onPress }: { onPress: () => void }) => {
  const isAiAvailable = useAiSearchAvailable();

  const box = SEARCH_ICON_SIZE + SEARCH_BUTTON_PADDING * 2;
  const center = box / 2;
  const radius = center - SEARCH_RING_STROKE / 2;
  const circumference = 2 * Math.PI * radius;

  // Point de départ du tracé, en haut à droite (45°) : c'est là qu'apparaît l'étoile.
  const starX = center + radius * Math.SQRT1_2;
  const starY = center - radius * Math.SQRT1_2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isAiAvailable ? 'Rechercher un média, assistant IA disponible' : 'Rechercher un média'}
      style={({ hovered, pressed }: any) => [
        styles.searchButton,
        (hovered || pressed) && styles.searchButtonActive,
      ]}
    >
      <Ionicons name="search" size={SEARCH_ICON_SIZE} color={Colors.white} />

      {isAiAvailable && (
        <>
          <style>{searchRingKeyframes(circumference)}</style>

          <svg
            width={box}
            height={box}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
          >
            {/* Le tracé d'un cercle SVG part de 3 h : rotation de -45° pour partir du coin supérieur droit */}
            <circle
              className="ai-search-ring"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={Colors.white}
              strokeWidth={SEARCH_RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              transform={`rotate(-45 ${center} ${center})`}
              opacity={0.7}
            />
          </svg>

          <div
            className="ai-search-star"
            style={{
              position: 'absolute',
              left: starX - SEARCH_STAR_SIZE / 2,
              top: starY - SEARCH_STAR_SIZE / 2,
              width: SEARCH_STAR_SIZE,
              height: SEARCH_STAR_SIZE,
              pointerEvents: 'none',
            }}
          >
            <MaterialCommunityIcons name="star-four-points" size={SEARCH_STAR_SIZE} color={Colors.white} />
          </div>
        </>
      )}
    </Pressable>
  );
};

/* ===================== Écran ===================== */

export const FlashMediaView = ({ navigation, route }) => {
  const queryClient = useQueryClient();

  const { data: trendContent, isLoading: trendIsLoading } = useQuery({
    queryKey: ["trend-media"],
    queryFn: getTrends
  });

  const { data: mCategories, isLoading: cateIsLoading, isError: cateIsError } = useQuery({
    queryKey: ["categories-media"],
    queryFn: getCategories
  });

  const [eventsCarouselItems, setEventsCarouselItems] = useState<CarouselItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(false);

        const data = await getEvents();
        if (data) {
          setEventsCarouselItems(data);
        }
      } catch (error) {
        setEventsError(true);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const [openMediaIsLoading, setOpenMediaIsLoading] = useState<boolean>(false);
  const [openMediaErrorMessage, setOpenMediaErrorMessage] = useState<string>('');

  const handleNavigation = (card: IContent) => {
    navigation.push('flash-media-preview', {
      media: card
    } as PreviewMediaParams)
  }

  const handleOpenMediaLink = async (id: number) => {
    const media = await queryClient.fetchQuery({
      queryKey: ["mediaContent", id],
      queryFn: () => getContent(id),
      retry: 2,
      retryDelay: 1000,
    });

    if (!media) {
      throw new Error("Média introuvable");
    }

    return media;
  }

  const handleOpenEvent = (item: CarouselItem) => {
    const params = {
      channelType: 'event',
      name: item.name,
      logoUrl: item.logo_url,
      image: item.image,
      description: item.description,
      targetId: item.id,
      website: item.website
    }
    navigation.navigate("flash-media-channel", params)
  }

  const handledMediaRef = useRef<string | null>(null);
  const handledEventRef = useRef<string | null>(null);

  // ---------- Deeplink: media ----------
  useEffect(() => {
    const id = route.params?.id;

    if (!id) {
      handledMediaRef.current = null;
      return;
    }
    if (handledMediaRef.current === String(id)) return;
    handledMediaRef.current = String(id);

    setOpenMediaIsLoading(true);
    handleOpenMediaLink(Number(id))
      .then((media) => {
        setOpenMediaIsLoading(false);
        navigation.push('flash-media-preview', { media } as PreviewMediaParams);
        navigation.setParams({ id: undefined });
      })
      .catch((error) => {
        setOpenMediaErrorMessage(error?.message ?? 'Média introuvable');
        navigation.setParams({ id: undefined });
        setTimeout(() => {
          setOpenMediaIsLoading(false);
          setOpenMediaErrorMessage('');
        }, 1000);
      });
  }, [route.params?.id]);

  // ---------- Deeplink: event ----------
  useEffect(() => {
    const eventId = route.params?.eventId;

    if (!eventId) {
      handledEventRef.current = null;
      return;
    }
    if (handledEventRef.current === String(eventId)) return;

    // events chưa load xong -> chờ, effect sẽ chạy lại khi eventsLoading = false
    if (eventsLoading) {
      setOpenMediaIsLoading(true);
      return;
    }

    handledEventRef.current = String(eventId);
    const event = eventsCarouselItems.find((e) => String(e.id) === String(eventId));

    navigation.setParams({ eventId: undefined });

    if (event) {
      setOpenMediaIsLoading(false);
      handleOpenEvent(event);
    } else {
      setOpenMediaErrorMessage('Congrès introuvable');
      setTimeout(() => {
        setOpenMediaIsLoading(false);
        setOpenMediaErrorMessage('');
      }, 1500);
    }
  }, [route.params?.eventId, eventsLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Médias</Text>
          <View style={styles.headerRightIcons}>
            {/* Loupe animée (étoiles) quand l'assistant IA est disponible */}
            <AiSearchHeaderButton onPress={() => { navigation.navigate('flash-search') }} />
          </View>
        </View>
      </View>

      <ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Tendances sur OrthoMaster</Text>
          {
            trendIsLoading ?
              <ActivityIndicator color={Colors.white} />
              : <PanoramaCarousel onSelect={handleNavigation} data={trendContent} />
          }
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Congrès</Text>
          {
            eventsLoading ?
              <ActivityIndicator color={Colors.white} />
              : eventsError
                ? <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.eventScrollViewContent}
                  style={styles.eventScrollView}
                >
                  {eventsCarouselItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.eventSlide}
                      onPress={() => { handleOpenEvent(item) }}
                    >
                      <Image
                        source={{ uri: process.env.EXPO_PUBLIC_S3_URL + item.image }}
                        style={[styles.eventImage, { width: 160, height: 160 }]}
                        resizeMode="cover" />
                      <Text style={[styles.eventName, { width: 160, fontSize: item.name.length > 20 ? 12 : 16 }]}
                        numberOfLines={3} ellipsizeMode="middle">{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
          }
        </View>

        {/* Categories */}
        {!cateIsLoading && !cateIsError && !!mCategories?.length && (
          mCategories.map((category) => (
            <View key={category.id} style={styles.sectionContainer}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              <SimpleContentCarousel data={category.medias} nbElement2Display={2.2} onSelect={handleNavigation} />
            </View>
          ))
        )}
      </ScrollView>

      <Modal isVisible={openMediaIsLoading}
        backdropColor='#999999'
      >
        <View style={{
          backgroundColor: '#F1F1F1',
          padding: 20,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5
        }}>
          <Text style={{ fontSize: 20, marginBottom: 10 }}>
            {openMediaErrorMessage ? openMediaErrorMessage : "Ouverture..."}</Text>
          {
            !openMediaErrorMessage &&
            <ActivityIndicator size={"large"} />
          }
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  header: {
    backgroundColor: Colors.red,
    paddingHorizontal: Spacings.lg,
    height: 100,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.white,
  },
  headerContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loupe animée : le fond du survol et le cercle tracé ont la même taille
  searchButton: {
    padding: SEARCH_BUTTON_PADDING,
    borderRadius: 999,
    transitionDuration: '150ms' as any,
  },
  searchButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ scale: 1.06 }],
  },

  sectionContainer: {
    marginTop: Spacings.md,
    paddingVertical: 5,
  },
  categoryTitle: {
    fontSize: 18,
    marginVertical: 5,
    paddingLeft: 10,
    paddingRight: 20,
    paddingVertical: 3,
    fontFamily: 'Poppins-Medium',
    backgroundColor: Colors.red,
    color: '#fff',
    alignSelf: 'flex-start',
    borderTopEndRadius: 7,
    borderBottomEndRadius: 7,
  },
  categorySubTitle: {
    fontSize: 15,
    marginLeft: 10,
    color: '#fff',
    fontFamily: 'Poppins-Regular'
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins-Regular',
  },

  eventScrollView: {
    marginLeft: Spacings.sm,
    paddingVertical: Spacings.md
  },
  eventScrollViewContent: {
    gap: Spacings.md,
  },
  eventSlide: {
    overflow: 'hidden',
  },
  eventImage: {
    borderRadius: 16,
    resizeMode: 'cover'
  },
  eventName: {
    marginTop: Spacings.md,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  }
});