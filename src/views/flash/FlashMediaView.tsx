import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';

import SimpleContentCarousel from '../../component/carousel/SimpleContentCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { useQuery } from 'react-query';
import { fetchMedias } from '../../services/FlashMediasService';
import CongresCaroussel from './caroussels/CongresCaroussel';
import { fetchEvents } from '../../services/EventsService';
import SimpleAdaptiveCarousel, { CarouselItem } from '../../component/carousel/SimpleAdaptiveCarousel';
import { IContent, IEvent } from '../../interfaces';
import { ChannelMediaViewParams } from './ChannelMediaView';
import { PreviewMediaParams } from './PreviewMediaView';


const LIMIT_LAST_RELEASE = 5
const {width: screenWidth} = Dimensions.get('screen')

type EventCardProp = {
  event: IEvent, onSelect: (event: IEvent) => any
}
const EventCard: React.FC<EventCardProp> = ({event, onSelect}) => {
  return <TouchableOpacity style={{
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    width: screenWidth / 4, height: '100%',
    padding: 10,
    alignItems: 'center'
  }}
  onPress={()=>onSelect(event)}>
    <Image
      source={{uri: event.logo_url}}
      style={{
        width: "100%", height: "70%",
        objectFit: 'contain'
      }}
    />
    <Text style={{
      textAlign: 'center',
      fontSize: 10,
      fontWeight: 'bold',
      position: 'absolute', bottom: 5
    }}>{event.name}</Text>
  </TouchableOpacity>
}


export const FlashMediaView = ({ navigation, route }) => {

  const lastRelease = useQuery(["media-last-release"], () => fetchMedias({ limit: LIMIT_LAST_RELEASE }))
  const categories = useQuery(["medias-categories-content"], () => fetchMedias({ group_by: "category" }))
  const { isError: eventsError, isLoading: eventsLoading } = useQuery(["events"], () => fetchEvents(), {
    onSuccess: data => {
      let evtsCards: CarouselItem[] = [];
      data.forEach(evt => {
        evtsCards.push({
          key: evt.name,
          content: <EventCard event={evt} onSelect={(event)=> {
            const params : ChannelMediaViewParams = {
              channelType: 'event',
              name: event.name,
              logoUrl: event.logo_url,
              description: event.description,
              targetId: event.id
            }
            navigation.navigate("flash-media-channel", params)
          }}/>
        })
      });
      setEventsCarouselItems(evtsCards)
    }
  })

  const [eventsCarouselItems, setEventsCarouselItems] = useState<CarouselItem[]>([])



  const handleNavigation = (card: IContent) => {
    navigation.push('flash-media-preview', {
      media: card
    } as PreviewMediaParams)
  }

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
      <ScrollView >

        {/* <Text style={styles.pageTitle}>Medias</Text> */}
        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2, paddingBottom: 30, marginTop: 0 }]}>
          <Text style={styles.categoryTitle}>Tendances sur OrthoMaster</Text>
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
          <Text style={styles.categoryTitle}>Trouver un média</Text>
          <TextInput style={{
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 10,
            width: "90%",
            alignSelf: 'center'
          }} placeholder="Rechercher par mots clés"
            clearButtonMode="always"
          />
        </View>

        <View style={[styles.sectionContainer,
        {
          // backgroundColor: "#6E7DA6",
          // backgroundColor: "#fff",
          // width: "100%",
          // alignSelf: 'center',
          // borderRadius: 5,
          // borderColor: '#203864',
          // borderWidth: 1,
          // shadowOffset: {
          //   width: 0, height: 0
          // },
          // shadowOpacity: 0.3,
          // shadowRadius: 3,
        }]}>
          <Text style={[styles.categoryTitle]}>Congrès</Text>
          <Text style={styles.categorySubTitle}>Les sociétés savantes</Text>
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
                  height={100}
                  cardSpacing={5}
                />
          }

          <Text style={[styles.categorySubTitle, {marginTop: 10}]}>Les derniers contenus</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <SimpleContentCarousel data={categories.data["Congrès"].slice(0, 15)} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleContentCarousel data={categories.data["Travaux pratiques"]} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleContentCarousel data={categories.data["Entretiens"]} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleContentCarousel data={categories.data["Reportages"]} nbElement2Display={2.2} onSelect={handleNavigation} />
          }

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    // backgroundColor: '#fffefd',
    backgroundColor: '#F1F1F1'
  },
  sectionContainer: {
    marginTop: 5, paddingVertical: 5,
    backgroundColor: '#fff'
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5
  },
  categoryTitle: {
    fontSize: 18,
    marginVertical: 5,
    marginLeft: 5,
    fontWeight: "bold"
  },
  categorySubTitle: {
    fontSize: 15,
    marginLeft: 10,
  }
})