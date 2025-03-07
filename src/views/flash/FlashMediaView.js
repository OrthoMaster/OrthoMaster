import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Text,
  View,
  ScrollView
} from 'react-native';

import SimpleCarousel from '../../component/carousel/SimpleCarousel';
import StackCarousel from '../../component/carousel/StackCarousel';

const movies = [
  {
    id: "1",
    title: "Stranger Things",
    image: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
  },
  {
    id: "2",
    title: "The Witcher",
    image: "https://image.tmdb.org/t/p/w500/zrPpUlehQaBf8YX2NrVrKK8IEpf.jpg",
  },
  {
    id: "3",
    title: "Dark",
    image: "https://image.tmdb.org/t/p/w500/uAQrHntCccFpvxp75XdQgqexlJd.jpg",
  },
  {
    id: "4",
    title: "Money Heist",
    image: "https://image.tmdb.org/t/p/w500/mo6vQgGHywQmbm5tyN6hL9iR7df.jpg",
  },
  {
    id: "5",
    title: "Breaking Bad",
    image: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
  },
  {
    id: "6",
    title: "Peaky Blinders",
    image: "https://image.tmdb.org/t/p/w500/9X7FovF5n8NQU4y8H5YYJx9Xy2g.jpg",
  },
  {
    id: "7",
    title: "Peaky Blinders",
    image: "https://image.tmdb.org/t/p/w500/9X7FovF5n8NQU4y8H5YYJx9Xy2g.jpg",
  },
  {
    id: "8",
    title: "Peaky Blinders",
    image: "https://image.tmdb.org/t/p/w500/9X7FovF5n8NQU4y8H5YYJx9Xy2g.jpg",
  },
  {
    id: "9",
    title: "Peaky Blinders",
    image: "https://image.tmdb.org/t/p/w500/9X7FovF5n8NQU4y8H5YYJx9Xy2g.jpg",
  },
];

export const FlashMediaView = ({ navigation, route }) => {

  const handleNavigation = (card) => {
    console.log(card);
    navigation.push('flash-media-preview', {
              media: card
            })
  }

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
      <ScrollView>

        {/* <Text style={styles.pageTitle}>Medias</Text> */}
        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Nouveaux sur OrthoMaster</Text>
          <StackCarousel onSelect={handleNavigation}/>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Congrès</Text>
          <SimpleCarousel data={movies} nbElement2Display={4.5} onSelect={handleNavigation} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Travaux pratiques</Text>
          <SimpleCarousel data={movies} nbElement2Display={4.5} onSelect={handleNavigation}/>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Entretiens</Text>
          <SimpleCarousel data={movies} nbElement2Display={4.5} onSelect={handleNavigation} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.categoryTitle}>Reportages</Text>
          <SimpleCarousel data={movies} nbElement2Display={4.5} onSelect={handleNavigation}/>
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