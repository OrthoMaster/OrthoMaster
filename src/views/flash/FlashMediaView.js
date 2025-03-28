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
  Dimensions
} from 'react-native';

import SimpleCarousel from '../../component/carousel/SimpleCarousel';
import PanoramaCarousel from '../../component/carousel/PanoramaCarousel';
import { useQuery } from 'react-query';
import { fetchLastReleaseMedias, fetchMediaByCategories } from '../../services/FlashMediasService';


const LIMIT_LAST_RELEASE = 5

export const FlashMediaView = ({ navigation, route }) => {

  const lastRelease = useQuery(["media-last-release"], () => fetchLastReleaseMedias({ limit: LIMIT_LAST_RELEASE }))
  const categories = useQuery(["medias-categories-content"], () => fetchMediaByCategories(), {
    onSuccess: (data) => { initCaroussels(data) }
  })
  const [congresCaroussel, setCongresCaroussel] = useState([])
  const [tpCaroussel, setTpCaroussel] = useState([])
  const [entretiensCaroussel, setEntretiensCaroussel] = useState([])
  const [reportagesCaroussel, setReportagesCaroussel] = useState([])



  const initCaroussels = async (caroussels) => {
    generateCongresCarousselData
    setCongresCaroussel(caroussels["Congrès"])
    setTpCaroussel(caroussels["Travaux pratiques"])
    setEntretiensCaroussel(caroussels["Entretiens"])
    setReportagesCaroussel(caroussels["Reportages"])
  }

  const generateCongresCaroussel = () => {

  }

  const handleNavigation = (card) => {
    navigation.push('flash-media-preview', {
      media: card
    })
  }

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
      <View style={{
        backgroundColor: '#ffaf31',
        padding: 15
      }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>Médias</Text>
      </View>
      <ScrollView style={{ marginBottom: 50 }}>

        {/* <Text style={styles.pageTitle}>Medias</Text> */}
        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2 }]}>
          <Text style={styles.categoryTitle}>Nouveaux sur OrthoMaster</Text>
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
        <View style={[styles.sectionContainer, { minHeight: Dimensions.get("screen").width / 2.2 }]}>
          <Text style={styles.categoryTitle}>Congrès</Text>
          {
            categories.isLoading ?
              <ActivityIndicator />
              : categories.isError ?
                <View>
                  <Text>Une erreur s'est produite lors du chargement</Text>
                </View>
                : <SimpleCarousel data={congresCaroussel} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleCarousel data={tpCaroussel} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleCarousel data={entretiensCaroussel} nbElement2Display={2.2} onSelect={handleNavigation} />
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
                : <SimpleCarousel data={reportagesCaroussel} nbElement2Display={2.2} onSelect={handleNavigation} />
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
    backgroundColor: '#fffefd',
  },
  sectionContainer: {
    marginTop: 10
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5
  },
  categoryTitle: {
    fontSize: 18,
    marginVertical: 5,
    marginLeft: 2,
    fontWeight: "bold"
  }
})