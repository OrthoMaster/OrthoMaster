import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import {
  CopilotStep,
  walkthroughable,
  useCopilot
} from "react-native-copilot";

import { useQuery } from "react-query"
import { fetchFlashContent } from '../../services/FlashService';

import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';
import FeedDisplayer from './components/FeedDisplayer';

const CopilotText = walkthroughable(Text);

export const HomeView = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const flashPreview = useQuery(["flash-preview"], () => fetchFlashContent(0, 5));
  // const copilote = useCopilot()


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    flashPreview.refetch(0, 5)
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);



  return (

    <View>
      <StatusBar
        animated={true}
        barStyle={Platform.OS === "android" ? 'light-content' : 'dark-content'}
        backgroundColor={"#000"}
      />
      <ScrollView style={{ backgroundColor: 'white' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader navigation={navigation} />

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <CopilotStep text="step 2" order={2} name="flash">
              <CopilotText style={styles.carouselHeaderTitle}>Nos derniers contenus</CopilotText>
            </CopilotStep>
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Flash ortho')}>
              <Text style={[styles.carouselHeaderButtonText, { color: "#ffaf31" }]}>Voir tous</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={flashPreview.data} navigation={navigation} />
        </View>

        <FeedDisplayer />

      </ScrollView>


    </View>
  );
}


const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 40
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
    fontSize: 18,
  },
  carouselHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',

  },
  carouselHeaderButtonText: {
    fontWeight: '600',
    fontSize: 14,
    marginEnd: 15
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

