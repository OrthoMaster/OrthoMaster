import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import { useQuery } from "@tanstack/react-query";

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { fetchMedias } from '../../services/FlashMediasService';
import SimpleAdaptiveCarouselWeb, { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarouselWeb';
import { IContent, IEvent } from '../../utils/interfaces';
import { PreviewMediaParams } from './PreviewMediaView';
import { getCdnContentAccessUrl } from '../../services/ContentService';
import { getEvents } from '../../services/v2/ContentService';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const LIMIT_LAST_RELEASE = 5

export const FlashMediaView = ({ navigation, route }) => {
  const lastRelease = useQuery({
    queryKey: ["media-last-release"],
    queryFn: () => fetchMedias({ limit: LIMIT_LAST_RELEASE })
  })
  const categories = useQuery({
    queryKey: ["medias-categories-content"],
    queryFn: () => fetchMedias({ group_by: "category" })
  })

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

  const [openMediaIsLoading, setOpenMediaIsLoading] = useState<boolean>(false)
  const [openMediaErrorMessage, setOpenMediaErrorMessage] = useState<string>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleNavigation = (card: IContent) => {
    navigation.push('flash-media-preview', {
      media: card
    } as PreviewMediaParams)
  }

  const handleOpenMediaLink = async (id: number) => {
    return new Promise(async (resolve, reject) => {
      setOpenMediaIsLoading(true)
      for await (const category of Object.keys(categories.data)) {
        for await (const media of categories.data[category] as IContent[]) {
          if (media.id_content == id) {
            return resolve(media)
          }
        }
      }
      return reject("Média introuvable")
    })
  }

  const verifyRoute = async () => {
    if (route.path && route.path.includes("open/media-preview/")) {
      if (route.params && route.params.id) {
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
    if (categories.data) {
      verifyRoute()
    }
  }, [route.params, categories.data])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Médias</Text>
      </View>

      <ScrollView
        scrollEnabled={!isSearching}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Tendances sur OrthoMaster</Text>
          {
            lastRelease.isLoading ?
              <ActivityIndicator color={Colors.white} />
              : lastRelease.isError ?
                <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <PanoramaCarousel onSelect={handleNavigation} data={lastRelease.data} />
          }
        </View>
        {/* <View style={[styles.sectionContainer]}>
          <TouchableOpacity style={{
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 10,
            alignSelf: 'center',
            width: "90%",
            marginHorizontal: 20
          }}
            onPress={() => setIsSearching(true)}
          >
            <Text style={{ color: 'gray' }}>Rechercher ...</Text>
          </TouchableOpacity>
        </View> */}

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Congrès</Text>
          <Text style={styles.categorySubTitle}>Les sociétés savantes</Text>
          {
            eventsLoading ?
              <ActivityIndicator color={Colors.white} />
              : eventsError ?
                <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <SimpleAdaptiveCarouselWeb
                  items={eventsCarouselItems}
                  navigation={navigation}
                />
          }
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Travaux pratiques</Text>
          {
            categories.isLoading ?
              <ActivityIndicator color={Colors.white} />
              : categories.isError ?
                <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                :
                <SimpleContentCarousel data={categories.data["Travaux pratiques"]} nbElement2Display={2.2} onSelect={handleNavigation} />
          }

        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Entretiens</Text>
          {
            categories.isLoading ?
              <ActivityIndicator color={Colors.white} />
              : categories.isError ?
                <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                :
                <SimpleContentCarousel data={categories.data["Entretiens"]} nbElement2Display={2.2} onSelect={handleNavigation} />

          }

        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Reportages</Text>
          {
            categories.isLoading ?
              <ActivityIndicator color={Colors.white} />
              : categories.isError ?
                <View>
                  <Text style={styles.errorText}>Une erreur s'est produite lors du chargement</Text>
                </View>
                :
                <SimpleContentCarousel data={categories.data["Reportages"]} nbElement2Display={2.2} onSelect={handleNavigation} />
          }

        </View>
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
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.white,
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
  }
});