import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  NativeSyntheticEvent,
  TextInputChangeEventData
} from 'react-native';
import Modal from 'react-native-modal';
import { useQuery } from "@tanstack/react-query";

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { fetchMedias } from '../../services/FlashMediasService';
import { fetchEvents } from '../../services/EventsService';
import SimpleAdaptiveCarousel, { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarousel';
import { IContent, IEvent } from '../../utils/interfaces';
import { ChannelMediaViewParams } from './ChannelMediaView';
import { PreviewMediaParams } from './PreviewMediaView';
import SearchModalComponent from '../../component/SearchModalComponent';
import { getCdnContentAccessUrl } from '../../services/ContentService';


const LIMIT_LAST_RELEASE = 5
const CAROUSEL_SIZE = 180
const { width: screenWidth } = Dimensions.get('screen')

type EventCardProp = {
  event: IEvent, onSelect: (event: IEvent) => any
}
const EventCard: React.FC<EventCardProp> = ({ event, onSelect }) => {

  const logo_url = useQuery({
    queryKey: ['event-logo', event.id],
    queryFn: () => getCdnContentAccessUrl(event.logo_url),
    enabled: !!event.logo_url
  })
  return <TouchableOpacity style={{
    width: screenWidth / 4, height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // backgroundColor: '#fff',
  }}
    onPress={() => {
      onSelect({
        ...event,
        logo_url: logo_url.data
      } as IEvent)
    }}>
    <View style={{
      width: screenWidth / 4,
      height: screenWidth / 4,

    }}>
      <Image
        source={{ uri: logo_url.data }}
        style={{
          backgroundColor: '#fff',
          width: '100%', height: '100%',
          objectFit: 'contain',
          borderRadius: 10
        }}
      />
    </View>
    <Text style={{
      textAlign: 'center',
      fontSize: 10,
      fontWeight: 'bold',
      marginTop: 5,
      color: '#fff',
    }}>{event.name}</Text>
  </TouchableOpacity>
}


export const FlashMediaView = ({ navigation, route }) => {

  const lastRelease = useQuery({
    queryKey: ["media-last-release"],
    queryFn: () => fetchMedias({ limit: LIMIT_LAST_RELEASE })
  })
  const categories = useQuery({
    queryKey: ["medias-categories-content"],
    queryFn: () => fetchMedias({ group_by: "category" })
  })
  const { isError: eventsError, isLoading: eventsLoading } = useQuery({queryKey: ["events"], queryFn: () => fetchEvents()})


  const [eventsCarouselItems, setEventsCarouselItems] = useState<CarouselItem[]>([])
  const [openMediaIsLoading, setOpenMediaIsLoading] = useState<boolean>(false)
  const [openMediaErrorMessage, setOpenMediaErrorMessage] = useState<string>(null)
  const [isSearching, setIsSearching] = useState(false)


  const handleNavigation = (card: IContent) => {
    navigation.push('flash-media-preview', {
      media: card
    } as PreviewMediaParams)
  }

  const createEventCard = (data) => {
    let evtsCards: CarouselItem[] = [];
    data.forEach(evt => {
      evtsCards.push({
        key: evt.name,
        content: <EventCard event={evt} onSelect={(event) => {
          const params: ChannelMediaViewParams = {
            channelType: 'event',
            name: event.name,
            logoUrl: event.logo_url,
            description: event.description,
            targetId: event.id,
            website: event.website
          }
          navigation.navigate("flash-media-channel", params)
        }} />
      })
    });
    setEventsCarouselItems(evtsCards)
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
      createEventCard(categories.data)
      verifyRoute()
    }
  }, [route.params, categories.data])

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>

      <ScrollView
        scrollEnabled={!isSearching}
        nestedScrollEnabled={true}
      >

        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2, paddingBottom: 30, marginTop: 0 }]}>
          <Text style={[styles.categoryTitle, {
            color: "#fff",
            backgroundColor: 'none'
          }]}>Tendances sur OrthoMaster</Text>
          {
            lastRelease.isLoading ?
              <ActivityIndicator />
              : lastRelease.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <PanoramaCarousel onSelect={handleNavigation} data={lastRelease.data} />
          }

        </View>
        <View style={[styles.sectionContainer]}>
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
            <Text style={{ color: 'gray' }}>Rechercher...</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionContainer, { paddingTop: 20 }]}>
          <Text style={[styles.categoryTitle]}>Congrès</Text>
          <Text style={[styles.categorySubTitle, { marginBottom: 5 }]}>Les sociétés savantes</Text>
          {
            eventsLoading ?
              <ActivityIndicator />
              : eventsError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <SimpleAdaptiveCarousel
                  items={eventsCarouselItems}
                  widthPercent={1}
                  height={170}
                  cardSpacing={5}
                />
          }

          <Text style={[styles.categorySubTitle, { marginBottom: 10 }]}>Les derniers contenus</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <View style={{ height: CAROUSEL_SIZE }}>
                  <SimpleContentCarousel data={categories.data["Congrès"].slice(0, 15)} nbElement2Display={2.2} onSelect={handleNavigation} />
                </View>

          }
        </View>

        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2.2 }]}>
          <Text style={styles.categoryTitle}>Travaux pratiques</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <View style={{ height: CAROUSEL_SIZE }}>
                  <SimpleContentCarousel data={categories.data["Travaux pratiques"]} nbElement2Display={2.2} onSelect={handleNavigation} />
                </View>
          }

        </View>

        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2.2 }]}>
          <Text style={styles.categoryTitle}>Entretiens</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <View style={{ height: CAROUSEL_SIZE }}>
                  <SimpleContentCarousel data={categories.data["Entretiens"]} nbElement2Display={2.2} onSelect={handleNavigation} />
                </View>

          }

        </View>

        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2.2 }]}>
          <Text style={styles.categoryTitle}>Reportages</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <View style={{ height: CAROUSEL_SIZE }}>
                  <SimpleContentCarousel data={categories.data["Reportages"]} nbElement2Display={2.2} onSelect={handleNavigation} />
                </View>
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
      <SearchModalComponent
        isVisible={isSearching}
        contentType='flash'
        keyId='search-media'
        onSelect={(media) => {
          handleNavigation(media)
          setIsSearching(false)
        }}
        onClose={() => setIsSearching(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    backgroundColor: '#303030',
    // backgroundColor: '#F1F1F1'
  },
  sectionContainer: {
    // marginTop: 5,
    paddingVertical: 5,
    // backgroundColor: '#fff'
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5
  },
  categoryTitle: {
    fontSize: 20,
    marginVertical: 5,
    paddingLeft: 10, paddingRight: 20,
    paddingVertical: 3,
    fontWeight: "bold",
    backgroundColor: "#ffaf31",
    color: '#fff',
    alignSelf: 'flex-start',
    borderTopEndRadius: 7,
    borderBottomEndRadius: 7
  },
  categorySubTitle: {
    fontSize: 15,
    marginLeft: 10,
    color: '#fff'
  }
})