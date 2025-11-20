import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from "@tanstack/react-query"
import { fetchMedias } from '../../services/FlashMediasService';
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { IContent } from '../../utils/interfaces';

import MediaSkeleton from '../../views/media/components/MediaSkeleton';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

export const HomeView = ({ navigation, route }) => {
  const {
    data: flashData,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useQuery({
    queryKey: ['flash-preview'],
    queryFn: () =>
      fetchMedias({
        limit: 6,
      }),
  });

  const handleNavigation = (card: IContent) => {
    navigation.navigate('Médias', {
      screen: 'flash-media-preview',
      params: {
        media: card,
      },
    });
  }
  const isFlashLoading = isLoading || isFetching;
  const reload = () => { refetch(); };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" animated={true} backgroundColor={Colors.white} />

      <ScrollView style={{ backgroundColor: Colors.white, flex: 1 }}>
        <HomeHeader navigation={navigation} />

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselHeaderTitle}>Nos derniers contenus</Text>
            {isFlashLoading ? (
              <View style={[styles.carouselHeaderButton, { marginRight: Spacings.lg }]}>
                <ActivityIndicator size="small" color={Colors.gray} />
              </View>
            ) : isError ? (
              <Pressable style={styles.carouselHeaderButton} onPress={reload}>
                <Text style={styles.carouselHeaderViewMoreButton}>Recharger</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Médias')}>
                <Text style={styles.carouselHeaderViewMoreButton}>Voir tous</Text>
              </Pressable>
            )}
          </View>
          {isFlashLoading && (
            <MediaSkeleton numberOfObjects={3} />
          )}
          {!isFlashLoading && !isError && (
            <OrthoCarousel entries={flashData} onSelect={handleNavigation} />
          )}
        </View>
      </ScrollView >
    </SafeAreaView >
  );
}


const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: Spacings.md
  },
  carouselHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: Spacings.md,
    alignItems: 'center'
  },
  carouselHeaderTitle: {
    flex: 2,
    alignSelf: 'flex-start',
    marginLeft: Spacings.lg,
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  carouselHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  carouselHeaderViewMoreButton: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginRight: Spacings.lg,
  },
  notificationIndicator: {
    backgroundColor: Colors.danger,
    width: 10,
    height: 10,
    borderRadius: 100,
    position: 'absolute',
    alignSelf: 'flex-end'
  },
})

