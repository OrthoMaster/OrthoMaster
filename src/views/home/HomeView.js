import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useStore } from 'react-redux';

import { useQuery } from "react-query"
import { fetchFlashContent } from '../../services/FlashService';
import { fetchQa } from '../../services/QaService';

import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';
import { LoadingContent } from '../../component/LoadingContent'

import { LinearGradient } from 'expo-linear-gradient';


export const HomeView = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
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
    },

  });


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    flashPreview.refetch(0, 5)
    qaPreview.refetch(5)
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);


  return (
    <View>
      <StatusBar
        animated={true}
        backgroundColor="#E45204"
      />
      <LinearGradient
        colors={['#E9650E', '#E65909', '#E24C01']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0, 0.5, 1]}
        style={{ width: '100%', height: '20%' }}
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

      <ScrollView style={{ backgroundColor: 'white' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
        <View style={{ height: 200 }} />
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
    height: '100%'
  },
  logo: {
    resizeMode: 'contain',
    flex: 3,
    marginLeft: 30,
    margin: 20
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
  },
  notificationIndicator: {
    backgroundColor: 'red',
    width: 10,
    height: 10,
    borderRadius: 100,
    position: 'absolute',
    alignSelf: 'flex-end'
  }
})

