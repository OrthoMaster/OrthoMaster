import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { useStore } from 'react-redux';

import { useQuery } from "react-query"
import { fetchFlashContent } from '../../services/FlashService';
import { fetchQa } from '../../services/QaService';

import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';
import { LoadingView } from '../LoadingView'

import { LinearGradient } from 'expo-linear-gradient';


export const HomeView = ({ navigation }) => {
  const store = useStore()
  const authState = store.getState().auth
  const qaPreview = useQuery("homeQaPreview", () => fetchQa(5), {
    onError: (error) => {
      throw error
    }
  });
  const flashPreview = useQuery("homeFlashPreview", () => fetchFlashContent(0, 5), {
    onError: (error) => {
      throw error
    }
  });

  if (qaPreview.isLoading || flashPreview.isLoading) return <LoadingView />
  if (qaPreview.error || flashPreview.error) return (<Text>Error</Text>);

  return (
    <View>
      <StatusBar
        animated={true}
        backgroundColor="#E45204"
      />
      <LinearGradient
        colors={['#E9650E', '#E65909', '#E24C01']}
        start={{x:0, y: 0}}
        end={{x:1,y:0}}
        locations={[0, 0.5, 1]}
        style={{width: '100%'}}
      >
        <SafeAreaView style={[styles.containerHeader, styles.AndroidSafeArea]}>
          <Image
            style={styles.logo}
            source={require('../../../assets/home/header/logo.png')}
          />
          <View style={styles.headerButtonGroup}>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                navigation.navigate('home-search')
              }}
            >
              <Image
                source={require('../../../assets/navigation/search.png')}
              />
            </TouchableOpacity>



          </View>

        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={{ backgroundColor: 'white' }}>
        <HomeHeader navigation={navigation} userName={authState.userCurrentSession.name} />
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselHeaderTitle}>
              Questions / réponses
            </Text>
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('home-qa')}>
              <Text style={styles.carouselHeaderButtonText}>Voir toutes</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={qaPreview.data} navigation={navigation} />
        </View>

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselHeaderTitle}>
              Flash ortho
            </Text>
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Flash ortho')}>
              <Text style={styles.carouselHeaderButtonText}>Voir tous</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={flashPreview.data} navigation={navigation} />
        </View>
        <View style={{height: 200}}/>
      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 30
  },
  carouselHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15
  },
  carouselHeaderTitle: {
    flex: 2,
    alignSelf: 'flex-start',
    marginLeft: 20,
    fontWeight: '600',
    fontSize: 18,
  },
  carouselHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',

  },
  carouselHeaderButtonText: {
    color: '#F45B11',
    fontWeight: '600',
    fontSize: 14,
    marginEnd: 15
  },
  containerHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    //backgroundColor: 'blue'
  },
  logo: {
    resizeMode: 'contain',
    flex: 2,
    marginLeft: 10
  },
  headerButtonGroup: {
    flex: 2,
    flexDirection: 'row-reverse'
  },
  headerButton: {
    resizeMode: 'contain',
    marginHorizontal: 15
  },
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  }
})

