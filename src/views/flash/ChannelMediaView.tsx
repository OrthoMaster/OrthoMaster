import React, { useState, useEffect } from "react";
import {
  StyleSheet, View,
  Text,
  Image,
  Dimensions,
  ScrollView,
  Linking,
  TouchableOpacity,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import ReadMore from 'react-native-read-more-text';
import { useQuery } from "@tanstack/react-query";
import { fetchMedias } from "../../services/FlashMediasService";

const { width: screenWidth } = Dimensions.get('screen')

import { IContent } from "../../utils/interfaces";
import { fetchPastEvents } from "../../services/EventsService";
import SimpleCarousel from "../../component/carousel/SimpleContentCarousel";

import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

const ReadMoreButton = ({ value, onPress }) => {
  return (
    <TouchableOpacity style={{
      alignSelf: 'flex-end'
    }} onPress={onPress}>
      <Text style={{ color: '#ffaf31', fontWeight: 'bold', fontSize: 12 }}>{value}</Text>
    </TouchableOpacity>
  )
}


export type ChannelMediaViewParams = {
  channelType: 'event' | 'author';
  logoUrl: string;
  image: string;
  name: string;
  description: string;
  targetId: number;
  website: string;
}
const ChannelMediaView: React.FC<any> = ({ navigation, route }) => {
  const channelParams: ChannelMediaViewParams = route.params
  const allMediaFromChannel = useQuery({
    queryKey: ["medias-channel", channelParams.name],
    queryFn: () => fetchMedias({ event: channelParams.targetId })
  })
  const pastEvents = useQuery({
    queryKey: ["past-events", channelParams.targetId],
    queryFn: () => fetchPastEvents({ eventID: channelParams.targetId }),
    enabled: channelParams.channelType === "event"
  })
  const [eventCarousels, setEventCarousels] = useState<React.ReactNode[]>([])

  const getEventCarousels = async () => {
    let carousels: React.ReactNode[] = []
    for await (const pastEventsElem of pastEvents.data) {
      let contents = await allMediaFromChannel.data.filter((ct: IContent) => ct.id_past_event == pastEventsElem.id)
      carousels.push(
        <View key={pastEventsElem.id} style={{
          marginVertical: Spacings.md,
          flexDirection: "row",
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: Colors.primary,
            alignSelf: 'stretch',
            justifyContent: 'center'
          }}>
            <Text style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 16,
              color: Colors.white,
              transform: "rotate(-90deg)",
            }}>{pastEventsElem.edition_year}</Text>
          </View>
          <View style={{ flex: 1, height: '100%' }}>
            <SimpleCarousel data={contents} nbElement2Display={2} onSelect={(content: IContent) => {
              // onSelectContent(content)
              navigation.push("flash-media-preview", {
                media: content
              })

            }} />
          </View>
        </View>
      )
    }
    setEventCarousels(carousels)
  }

  useEffect(() => {
    if (allMediaFromChannel.data && pastEvents.data) {
      getEventCarousels()
    }
  }, [allMediaFromChannel.data, pastEvents.data])

  return <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <Ionicons name="chevron-back" size={25} color={Colors.text} />
    </TouchableOpacity>
    <ScrollView>
      <View style={{ paddingHorizontal: Spacings.lg, paddingTop: isTablet ? Spacings.xxxl : Spacings.md }}>
        <Image
          source={{ uri: process.env.EXPO_PUBLIC_S3_URL + channelParams.image }}
          style={{
            height: screenWidth * 0.25,
            width: screenWidth * 0.25,
            alignSelf: 'center',
            objectFit: 'cover',
            backgroundColor: Colors.gray,
            borderRadius: 20,
          }}
        />
        <View style={{ paddingVertical: Spacings.md }}>
          <Text style={styles.headerTitle}>{channelParams.name}</Text>
          {
            channelParams.description &&
            <ReadMore
              numberOfLines={4}
              renderTruncatedFooter={(truncated) => {
                return <ReadMoreButton value="Lire la suite" onPress={truncated} />
              }}
              renderRevealedFooter={(revealed) => {
                return <ReadMoreButton value="Voir moins" onPress={revealed} />
              }}
            >
              <Text style={{
                fontSize: 14,
                fontFamily: 'Roboto',
                textAlign: 'justify',
                color: Colors.white,
              }}
                numberOfLines={4}
              >{channelParams.description}</Text>
            </ReadMore>
          }
          {
            channelParams.website &&
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                lineHeight: 20,
                marginTop: Spacings.md,
                color: Colors.primary,
                textDecorationLine: "underline",
              }}
              onPress={() => { Linking.openURL(channelParams.website) }}>Site internet </Text>
          }
        </View>
      </View>

      <View style={{ paddingVertical: Spacings.md }}>
        {eventCarousels}
      </View>
    </ScrollView>
  </SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? 22 : 16,
    textAlign: 'center',
    marginBottom: Spacings.md,
    color: Colors.white,
    marginTop: Spacings.md,
  },
  backButton: {
    position: 'absolute',
    left: Spacings.lg,
    top: Spacings.xxxl,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    shadowOpacity: 0.5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
})

export default ChannelMediaView