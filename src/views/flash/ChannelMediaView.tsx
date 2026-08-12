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

const { width: screenWidth } = Dimensions.get('screen')

import { IContent } from "../../utils/interfaces";
import SimpleCarousel from "../../component/carousel/SimpleContentCarousel";
import { getEventMedias } from '../../services/v2/ContentService';

import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

const ReadMoreButton = ({ value, onPress }) => {
  return (
    <TouchableOpacity style={{
      alignSelf: 'flex-end'
    }} onPress={onPress}>
      <Text style={{ color: Colors.primary, fontFamily: 'Poppins-Medium', fontSize: 12, paddingTop: Spacings.xs }}>{value}</Text>
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

  const { data: eventContent, isLoading: isLoading, isError: isError } = useQuery({
    queryKey: ['media-event', channelParams.targetId],
    queryFn: () => getEventMedias(channelParams.targetId),
    retry: 2,
    retryDelay: 2000
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
                  fontWeight: '400',
                  letterSpacing: 0.4,
                  lineHeight: 18,
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
                style={styles.linkWeb}
                onPress={() => { Linking.openURL(channelParams.website) }}>Voir plus sur le web</Text>
            }
          </View>
        </View>
        <View style={{ paddingVertical: Spacings.md }}>
          {!isLoading && !isError && !!eventContent?.length && (
            eventContent.map((event) => (
              <View key={event.id} style={{
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
                    lineHeight: 18,
                    color: Colors.white,
                    transform: "rotate(-90deg)",
                  }}>{event.edition_year}</Text>
                </View>
                <View style={{ flex: 1, height: '100%' }}>
                  <SimpleCarousel data={event.medias} nbElement2Display={2} onSelect={(content: IContent) => {
                    navigation.push("flash-media-preview", {
                      media: content
                    })
                  }} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: isTablet ? 22 : 18,
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
  linkWeb: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    lineHeight: 20,
    marginTop: Spacings.md,
    color: Colors.blue,
    textDecorationLine: "underline",
  }
})

export default ChannelMediaView