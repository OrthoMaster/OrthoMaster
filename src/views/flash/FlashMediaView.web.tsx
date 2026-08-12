import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import Modal from 'react-native-modal';
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from "@tanstack/react-query";

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { fetchMedias } from '../../services/FlashMediasService';
import { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarouselWeb';
import { IContent } from '../../utils/interfaces';
import { PreviewMediaParams } from './PreviewMediaView';

import { getEvents, getNewests, getTrends, getCategories, getContent } from '../../services/v2/ContentService';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

export const FlashMediaView = ({ navigation, route }) => {
  const queryClient = useQueryClient();

  const { data: trendContent, isLoading: trendIsLoading } = useQuery({
    queryKey: ["trend-media"],
    queryFn: getTrends,
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

  const verifyRoute = async () => {
    if (route.path && route.path.includes("media-preview")) {
      if (route.params && route.params.id) {
        setOpenMediaIsLoading(true);
        handleOpenMediaLink(route.params.id)
          .then((media) => {
            setOpenMediaIsLoading(false)
            navigation.push('flash-media-preview', {
              media: media
            } as PreviewMediaParams)
          })
          .catch(errorMessage => {
            setOpenMediaErrorMessage(errorMessage)
            setTimeout(() => {
              setOpenMediaIsLoading(false)
            }, 1000);
          })
      }
    }
  }

  useEffect(() => {
    verifyRoute();
  }, [route.params?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Médias</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity onPress={() => { navigation.navigate('flash-search') }}>
              <Ionicons name="search" size={34} color={Colors.white} />
            </TouchableOpacity>
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
            openMediaErrorMessage == null &&
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