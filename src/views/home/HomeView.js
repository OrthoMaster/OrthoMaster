import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  RefreshControl,
  InteractionManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { fetchMedias } from '../../services/FlashMediasService';
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { getContentById } from '../../services/ContentService';
import { getUserRegisteredFormation } from '../../services/FormationService';
import { useGetUser } from '../../hooks/useGetUser.hook';
import { navigate } from '../../navigation/RootNavigation';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

export const HomeView = ({ navigation, route }) => {

  const { data: user, ...userQuery } = useGetUser()
  const [refreshing, setRefreshing] = useState(false);
  const flashPreview = useQuery({
    queryKey: ["flash-preview"], queryFn: () => fetchMedias({
      limit: 6
    })
  });

  const savedArticles = useQuery({ queryKey: ["GET", "liked", "feed"], queryFn: () => fetchLikedArticles() })

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    flashPreview.refetch(0, 5)
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);


  const handleOpenContent = async (id) => {
    getContentById(id)
      .then((content) => {
        if (content.type == "lesson") {
          getUserRegisteredFormation({
            idUserFormation: 0
          }).then((formations) => {
            if (formations && Array.isArray(formations)) {
              const currentFormation = formations.filter((f) => f.id_formation === content.id_formation)

              navigation.navigate('home-content', {
                "content": content,
                "formation": currentFormation[0],
                "type": "lesson",
                "demoMode": !currentFormation[0].certifying && !currentFormation[0].is_paid && !user.is_student
              })

            }
          })
        } else {
          navigate('Médias', {
            screen: 'flash-media-home',
          });

          InteractionManager.runAfterInteractions(() => {
            navigate('flash-media-preview', {
              media: content,
              type: "flash"
            });
          });
        }
      })
  }

  const tmpAsyn = async () => {
  }

  useEffect(() => {
    tmpAsyn()
    if (route.path && route.path.includes("open/content/")) {
      if (route.params && route.params.id) {
        handleOpenContent(route.params.id)
      }
    }
  }, [route.params])

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        animated={true}
        barStyle={'dark-content'}
      />
      <ScrollView style={{ backgroundColor: Colors.white, flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[2]}
      >
        <HomeHeader navigation={navigation} />

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselHeaderTitle}>Nos derniers contenus</Text>
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Médias')}>
              <Text style={styles.carouselHeaderViewMoreButton}>Voir tous</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={flashPreview.data} onSelect={(content) => {
            navigate('Médias', {
              screen: 'flash-media-home',
            });
          }} />
        </View>
      </ScrollView>
    </View>
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
    fontSize: 14,
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

