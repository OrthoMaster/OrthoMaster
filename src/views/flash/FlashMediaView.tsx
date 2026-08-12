import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  Platform,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from "@tanstack/react-query";

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarousel';
import { IContent } from '../../utils/interfaces';
import { PreviewMediaParams } from './PreviewMediaView';

import { getEvents, getNewests, getTrends, getCategories, getContent } from '../../services/v2/ContentService';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width: screenWidth } = Dimensions.get('screen');
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

export const FlashMediaView = ({ navigation, route }) => {
  const queryClient = useQueryClient();

  const { data: trendContent, isLoading: trendIsLoading, isError: trendIsError } = useQuery({
    queryKey: ["trend-media"],
    queryFn: getTrends
  });

  const { data: newestContent, isLoading: newIsLoading, isError: newIsError } = useQuery({
    queryKey: ['newest-media'],
    queryFn: getNewests,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000
  });

  const { data: mCategories, isLoading: cateIsLoading, isError: cateIsError } = useQuery({
    queryKey: ["categories-media"],
    queryFn: getCategories
  });

  const [openMediaIsLoading, setOpenMediaIsLoading] = useState<boolean>(false)
  const [openMediaErrorMessage, setOpenMediaErrorMessage] = useState<string>('')

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
  };

  const verifyRoute = async () => {
    const id = route.params?.id;
    if (!id) return;

    // Action
    setOpenMediaIsLoading(true);
    handleOpenMediaLink(Number(id))
      .then((media) => {
        setOpenMediaIsLoading(false);
        navigation.push('flash-media-preview', { media } as PreviewMediaParams);
        navigation.setParams({ id: undefined });
      })
      .catch(errorMessage => {
        setOpenMediaErrorMessage(errorMessage);
        navigation.setParams({ id: undefined });
        setTimeout(() => setOpenMediaIsLoading(false), 1000);
      });
  };

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

  // Deeplink: Open direct
  useEffect(() => {
    verifyRoute();
  }, [route.params?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.red} />

      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Médias</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity onPress={() => { navigation.navigate('flash-search') }}>
              <Ionicons name="search" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Trends */}
        {!trendIsError &&
          <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2, paddingBottom: 30, marginTop: 0 }]}>
            <Text style={[styles.categoryTitle, styles.categoryTrending]}>Tendances sur OrthoMaster</Text>
            {
              trendIsLoading ?
                <ActivityIndicator />
                : <PanoramaCarousel onSelect={handleNavigation} data={trendContent} />
            }
          </View>
        }

        {/* Events */}
        <View style={[styles.sectionContainer, { paddingVertical: Spacings.lg }]}>
          {
            !eventsError && !eventsLoading &&
            <>
              <Text style={[styles.categoryTitle]}>Congrès</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
                      style={[styles.eventImage, { width: isTablet ? 150 : 100, height: isTablet ? 150 : 100 }]}
                      resizeMode="cover" />
                    <Text style={[styles.eventName, { width: isTablet ? 150 : 100, fontSize: item.name.length > 20 ? 12 : 14 }]}
                      numberOfLines={3} ellipsizeMode="middle">{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }

          {/* Newests */}
          {!newIsLoading && !newIsError && !!newestContent?.length && (
            <>
              <Text style={[styles.categoryTitle]}>Les derniers contenus</Text>
              <SimpleContentCarousel data={newestContent} nbElement2Display={2.2} onSelect={handleNavigation} />
            </>
          )}
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
        <View style={{ height: Spacings.xxxl + Spacings.xl }}></View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.red,
  },
  header: {
    height: isTablet ? 100 : 60,
    backgroundColor: Colors.red,
  },
  headerContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.white,
  },
  body: {
    backgroundColor: Colors.darkBackground,
  },
  sectionContainer: {
    paddingVertical: 5,
  },
  categoryTitle: {
    fontSize: 18,
    marginTop: Spacings.md,
    marginBottom: Spacings.md,
    paddingLeft: Spacings.lg,
    paddingRight: Spacings.lg,
    paddingVertical: Spacings.xxs,
    fontFamily: 'Poppins-Medium',
    backgroundColor: Colors.red,
    color: Colors.white,
    alignSelf: 'flex-start',
    borderTopEndRadius: 8,
    borderBottomEndRadius: 8
  },
  categoryTrending: {
    marginTop: Spacings.lg,
  },
  categorySubTitle: {
    fontSize: 16,
    marginLeft: Spacings.md,
    color: Colors.white,
    fontFamily: 'Poppins-Regular'
  },
  errorText: {
    fontSize: 14,
    color: Colors.grayLight,
    fontFamily: 'Poppins-Regular',
    padding: Spacings.md
  },

  // Event
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
})