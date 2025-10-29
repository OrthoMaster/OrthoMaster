/**
 * @author Francis
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

import { useQuery } from "@tanstack/react-query";
import { getLessonContent } from "../../services/v2/LessonService";

const HEADER_HEIGHT = 120;
const SCROLL_THRESHOLD = 5;

type ScrollDirection = 'up' | 'down' | null;

export const TrainingListView = ({ navigation, route }) => {

  // Handle scrolls
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 3, HEADER_HEIGHT],
    outputRange: [0.9, 0.95, 1],
    extrapolate: 'clamp',
  });

  // Handle scroll direction changes
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      const diff = value - lastScrollY;
      // Fix scroll down to reload of scroll view
      if (value <= 0) {
        setScrollDirection('up');
      }

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (newDirection !== scrollDirection) {
          setScrollDirection(newDirection);
          animateHeader(newDirection, value);
        }
        setLastScrollY(value);
      }
    });

    return () => scrollY.removeListener(listenerId);
  }, [lastScrollY, scrollDirection, scrollY]);

  const animateHeader = (direction: ScrollDirection, scrollValue: number): void => {
    const shouldHideHeader = direction === 'down' && scrollValue > 20;
    const toValue = shouldHideHeader ? -HEADER_HEIGHT : 0;
    const opacityValue = shouldHideHeader ? 0.3 : 1;
    const scaleValue = shouldHideHeader ? 0.95 : 1;

    Animated.parallel([
      Animated.spring(headerTranslateY, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(headerOpacity, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: scaleValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const paddingToBottom = 100;

        // Check if user scrolled near bottom
        if (contentOffset.y + layoutMeasurement.height + paddingToBottom >= contentSize.height) {
          // loadMore();
        }
      }
    }
  );

  // Handle close modal
  const closeScreen = (): void => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      {/* Enhanced Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ],
            opacity: Animated.multiply(headerOpacity, headerBackgroundOpacity),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Formation</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity onPress={closeScreen}>
              <Ionicons name="trophy-outline" size={24} color={Colors.blue}></Ionicons>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeScreen}>
              <Ionicons name="cart-outline" size={24} color={Colors.blue}></Ionicons>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeScreen}>
              <Ionicons name="search-outline" size={24} color={Colors.blue}></Ionicons>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header bottom border with animation */}
        <Animated.View
          style={[
            styles.headerBorder,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 80, 120],
                outputRange: [0, 0.5, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        <View style={styles.lgTrainingWrapper}>
          <View style={styles.lgTrainingContainer}>
            <Text style={styles.lgTrainingTitle} numberOfLines={2} ellipsizeMode='tail'>Les bases de l'appareillage de série</Text>
            <View style={styles.lgTrainingMeta}>
              <Ionicons name="extension-puzzle-outline" size={12} color={Colors.white} />
              <Text style={styles.lgTrainingMetaText}>6 Paquets - 24 Lessons</Text>
            </View>
            <TouchableOpacity style={styles.lgTrainingButton}>
              <Text style={styles.lgTrainingButtonText}>Découvrir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.trainingWrapper}>
              <View style={styles.trainingContainer}>
                <View style={styles.trainingImageContainer}>
                  {/* <Image
                    source={require('../../../assets/v2_images/logo/logo_primary_1024.png')}
                    style={styles.trainingImage}
                    resizeMode="cover"
                  /> */}
                  <View style={[styles.trainingImageOverlay,
                  item % 3 === 1 && styles.overlay1,
                  item % 3 === 2 && styles.overlay2,
                  item % 3 === 0 && styles.overlay3]} />
                </View>
                <View style={styles.trainingDescription}>
                  <Text style={styles.trainingTitle} numberOfLines={2} ellipsizeMode='tail'>Les clés de la délivrance Orthopédique</Text>
                  {item === 3 ?
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTextContainer}>
                        <Text style={styles.progressText}>4/6 Lessons</Text>
                        <Text style={styles.progressText}>40%</Text>
                      </View>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: '40%' },
                            item % 3 === 1 && styles.overlay1,
                            item % 3 === 2 && styles.overlay2,
                            item % 3 === 0 && styles.overlay3
                          ]}
                        />
                      </View>

                    </View>
                    :
                    <View style={styles.trainingMeta}>
                      <View style={styles.trainingLesson}>
                        <Ionicons name="book-outline" size={14} color={Colors.gray} />
                        <Text style={styles.trainingMetaText}>6 lessons</Text>
                      </View>
                      <View style={styles.trainingDuration}>
                        <Ionicons name="time-outline" size={14} color={Colors.gray} />
                        <Text style={styles.trainingMetaText}>1 hr 30 mins</Text>
                      </View>
                    </View>
                  }
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: HEADER_HEIGHT,
    backgroundColor: Colors.grayLight,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xxxl,
    paddingBottom: Spacings.md,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.black,
  },
  headerBorder: {
    height: 1,
    backgroundColor: Colors.grayLight,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  scrollView: {
    flex: 1,
    paddingTop: Spacings.md,
  },
  scrollContainer: {
    paddingTop: HEADER_HEIGHT - Spacings.xxl,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: Spacings.lg,
    paddingLeft: Spacings.sm,
    paddingRight: Spacings.lg,
  },

  // Training
  lgTrainingWrapper: {
    width: '100%',
    paddingHorizontal: Spacings.lg,
  },
  lgTrainingContainer: {
    backgroundColor: Colors.blue,
    padding: Spacings.lg,
    borderRadius: 8,
  },
  lgTrainingTitle: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 20,
    color: Colors.white,
    width: '70%',
  },
  lgTrainingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacings.sm,
    gap: Spacings.xxs
  },
  lgTrainingMetaText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.white,
  },
  lgTrainingButton: {
    alignSelf: "flex-start",
    marginTop: Spacings.xl,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  lgTrainingButtonText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.blue,
  },

  trainingWrapper: {
    width: '50%',
    paddingLeft: Spacings.sm,
    paddingBottom: Spacings.md,
  },
  trainingContainer: {
    borderRadius: 8,
  },
  trainingImageContainer: {
    height: 100,
    position: "relative",
  },
  trainingImage: {
    height: 100,
    width: '100%'
  },
  trainingImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderTopStartRadius: 8,
    borderTopEndRadius: 8,
  },
  overlay1: {
    backgroundColor: Colors.blue,
  },
  overlay2: {
    backgroundColor: Colors.green,
  },
  overlay3: {
    backgroundColor: Colors.primaryLight,
  },

  trainingDescription: {
    position: "relative",
    height: 125,
    padding: Spacings.md,
    backgroundColor: Colors.white,
    borderBottomEndRadius: 8,
    borderBottomStartRadius: 8
  },
  trainingTitle: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 14,
    color: Colors.black
  },
  trainingMeta: {
    position: "absolute",
    left: Spacings.md,
    bottom: Spacings.md,
  },
  trainingMetaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext
  },
  trainingLesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginBottom: Spacings.xxxs
  },
  trainingDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs
  },

  // Progress
  progressContainer: {
    width: '100%',
    position: "absolute",
    left: Spacings.md,
    bottom: Spacings.md,
  },
  progressTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",
    marginBottom: Spacings.xs
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: Colors.subtext
  }
});