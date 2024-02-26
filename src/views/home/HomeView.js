import React, { useEffect, useState, useCallback } from 'react';
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
import { useStore } from 'react-redux';
import {
  CopilotStep,
  walkthroughable,
  useCopilot
} from "react-native-copilot";



import { useQuery } from "react-query"
import { fetchFlashContent } from '../../services/FlashService';
import { fetchQa } from '../../services/QaService';

import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';
const CopilotText = walkthroughable(Text);

export const HomeView = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const store = useStore()
  const authState = store.getState().auth
  const qaPreview = useQuery(['Home', 'GET', "qaPreview"], () => fetchQa(5));
  const flashPreview = useQuery(['Home', 'GET', "flashPreview"], () => fetchFlashContent(0, 5));
  const copilote = useCopilot()


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    flashPreview.refetch(0, 5)
    qaPreview.refetch(5)
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);


  // if (introHasBeenDisplayed == false) {

  // }

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
        <HomeHeader navigation={navigation} userName={authState.userCurrentSession.name} />
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            {/* <Text style={styles.carouselHeaderTitle}>
              Questions / réponses
            </Text> */}
            <CopilotStep text="This is a hello world example!" order={1} name="hello">
              <CopilotText style={styles.carouselHeaderTitle}>Questions / réponses</CopilotText>
            </CopilotStep>
            <Pressable style={styles.carouselHeaderButton} onPress={() => copilote.start()}>
              {/* <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Flash ortho')}> */}
              <Text style={[styles.carouselHeaderButtonText, { color: "#ffaf31" }]}>Voir toutes</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={qaPreview.data} navigation={navigation} />
        </View>

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <CopilotStep text="step 2" order={2} name="flash">
              <CopilotText style={styles.carouselHeaderTitle}>Flash ortho</CopilotText>
            </CopilotStep>
            {/* <Text style={[styles.carouselHeaderTitle]}>
              Flash ortho
            </Text> */}
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Flash ortho')}>
              <Text style={[styles.carouselHeaderButtonText, { color: "#ffaf31" }]}>Voir tous</Text>
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

