/**
 * @author Francis
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

import { useQuery } from "@tanstack/react-query";
import { getTrainings } from "../../services/v2/TrainingService";

const DEMO_TRAININGS = [
  {
    id: '1',
    name: 'Formation Podologie Professionnelle',
    color: '#3B82F6',
    background_color: '#EFF6FF',
    packages: [
      {
        id: 'pkg-1-1',
        name: 'Introduction',
        image: '📚',
        progress: 100,
        available_flg: true,
      },
      {
        id: 'pkg-1-2',
        name: 'Anatomie du pied',
        image: '🦶',
        progress: 75,
        available_flg: true,
      },
      {
        id: 'pkg-1-3',
        name: 'Pathologies courantes',
        image: '🏥',
        progress: 45,
        available_flg: true,
      },
      {
        id: 'pkg-1-4',
        name: 'Techniques avancées',
        image: '⚕️',
        progress: 0,
        available_flg: true,
      },
      {
        id: 'pkg-1-5',
        name: 'Pratique clinique',
        image: '🔬',
        progress: null,
        available_flg: false,
        modules: []

      },
    ],
  },
  {
    id: '2',
    name: 'Orthopédie et Biomécanique',
    color: '#10B981',
    background_color: '#ECFDF5',
    packages: [
      {
        id: 'pkg-2-1',
        name: 'Bases biomécaniques',
        image: '⚙️',
        progress: 100,
        available_flg: true,
      },
      {
        id: 'pkg-2-2',
        name: 'Analyse de la marche',
        image: '👣',
        progress: 60,
        available_flg: true,
      },
      {
        id: 'pkg-2-3',
        name: 'Orthèses plantaires',
        image: '🦿',
        progress: 30,
        available_flg: true,
      },
      {
        id: 'pkg-2-4',
        name: 'Cas pratiques',
        image: '📋',
        progress: null,
        available_flg: false,
        modules: []
      },
    ],
  },
  {
    id: '3',
    name: 'Dermatologie Podologique',
    color: '#F59E0B',
    background_color: '#FEF3C7',
    packages: [
      {
        id: 'pkg-3-1',
        name: 'Anatomie cutanée',
        image: '🔍',
        progress: 85,
        available_flg: true,
      },
      {
        id: 'pkg-3-2',
        name: 'Mycoses et infections',
        image: '🦠',
        progress: 50,
        available_flg: true,
      },
      {
        id: 'pkg-3-3',
        name: 'Traitements locaux',
        image: '💊',
        progress: 20,
        available_flg: true,
      },
      {
        id: 'pkg-3-4',
        name: 'Prévention',
        image: '🛡️',
        progress: null,
        available_flg: false,
        modules: []

      },
      {
        id: 'pkg-3-5',
        name: 'Complications diabétiques',
        image: '⚠️',
        progress: null,
        available_flg: false,
        modules: []

      },
    ],
  },
  {
    id: '6',
    name: 'Pédiatrie Podologique',
    color: '#06B6D4',
    background_color: '#ECFEFF',
    packages: [
      {
        id: 'pkg-6-1',
        name: 'Développement du pied',
        image: '👶',
        progress: 55,
        available_flg: true,
      },
      {
        id: 'pkg-6-2',
        name: 'Déformations infantiles',
        image: '🍼',
        progress: 25,
        available_flg: true,
      },
      {
        id: 'pkg-6-3',
        name: 'Traitements pédiatriques',
        image: '🎈',
        progress: null,
        available_flg: false,
        modules: []
      },
    ],
  },
];

const HEADER_HEIGHT = 120;
const SCROLL_THRESHOLD = 5;

type ScrollDirection = 'up' | 'down' | null;

// Circular progress component
const CircularProgress = ({ size = 70, strokeWidth = 4, progress, accentColor, backgroundColor, image }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusStyle = () => {
    if (progress === null) {
      return {
        borderColor: accentColor,
        backgroundColor: backgroundColor,
        opacity: 0.8,
        borderWidth: 1
      };
    }

    if (progress == 100) {
      return {
        borderColor: backgroundColor,
        backgroundColor: accentColor,
        opacity: 1,
      };
    }

    if (progress > 0) {
      return {
        borderColor: backgroundColor,
        backgroundColor: accentColor,
        opacity: 1,
      };
    }

    return {
      borderColor: accentColor,
      backgroundColor: Colors.white,
      opacity: 1,
    };
  };

  return (
    <View style={styles.circularProgressContainer}>
      {progress > 0 && (
        <Svg width={size} height={size} style={styles.progressSvg}>
          {/* Background circle */}
          <Circle
            stroke={'transparent'}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <Circle
            stroke={progress == 100 ? accentColor : Colors.warning}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      )}
      <View style={[styles.imageContainer, getStatusStyle(), { width: size - strokeWidth * 2, height: size - strokeWidth * 2, borderRadius: (size - strokeWidth * 2) / 2 }]}>
        <Text style={[styles.imageText, progress == 100 && { color: Colors.white }]}>{image}</Text>
      </View>
    </View>
  );
};

export const TrainingListView = ({ navigation, route }) => {

  const { data: trainings, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => getTrainings(),
    retry: 1,
    retryDelay: 1000,
  });

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

  const handlePackagePress = (training, pkg) => {
    if (pkg.available_flg) {
      navigation.navigate('training-view', {
        // training: training.id,
        // pkg
      });
    } else {
      navigation.navigate('inactive-training-view', {
        training: training.id,
        headerColor: training.color,
        pkg
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

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
            <TouchableOpacity onPress={() => { navigation.navigate('cart-view') }}>
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
      <ScrollView style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        bounces={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
          />
        }>

        {/* Training cards with horizontal pkg scroll */}
        {(DEMO_TRAININGS).map((training) => (
          <View key={training.id} style={styles.trainingCard}>
            <View style={styles.trainingHeaderNew}>
              <Text style={styles.trainingTitleNew} numberOfLines={2} ellipsizeMode='tail'>
                {training.name}
              </Text>
            </View>

            {/* Horizontal pkg scroll */}
            <View style={styles.packagesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packagesScrollContent}
              >
                {training.packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={styles.pkgItem}
                    onPress={() => handlePackagePress(training, pkg)}
                  >
                    <CircularProgress
                      size={70}
                      strokeWidth={4}
                      progress={pkg.available_flg ? pkg.progress : null}
                      accentColor={training.color}
                      backgroundColor={training.background_color}
                      image={pkg.image || '📚'}
                    />
                    <Text numberOfLines={2} ellipsizeMode='tail'
                      style={[styles.pkgTitle, pkg.available_flg && { color: training.color }]}>{pkg.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: HEADER_HEIGHT,
    backgroundColor: Colors.white,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xxxl,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
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
    paddingBottom: Spacings.xl,
  },

  // Training card styles
  trainingCard: {
    overflow: 'hidden',
  },
  trainingHeaderNew: {
    padding: Spacings.lg,
    paddingBottom: 0,
  },
  trainingTitleNew: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: Colors.black,
  },
  trainingMetaNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  trainingMetaTextNew: {
    fontFamily: 'Roboto',
    fontSize: 13,
  },

  // Legacy styles (kept for compatibility)
  trainingHeader: {
    padding: Spacings.lg,
  },
  trainingHeaderContent: {
    flexDirection: 'column',
  },
  trainingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  trainingMetaText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.white,
  },

  // Lessons container
  packagesContainer: {
    paddingBottom: Spacings.sm
  },
  packagesScrollContent: {
    marginTop: Spacings.md,
    paddingLeft: Spacings.lg,
    gap: Spacings.sm,
  },
  pkgItem: {
    alignItems: 'center',
    position: 'relative',
  },
  pkgTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: Colors.gray,
    marginTop: Spacings.sm,
    width: 70,
    textAlign: 'center',
  },

  // Circular progress styles
  circularProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  imageText: {
    fontSize: 28,
  },
});