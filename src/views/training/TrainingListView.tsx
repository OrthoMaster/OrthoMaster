/**
 * @author Francis
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Dimensions,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";

import { BouncingDots } from '../../component/LoadingDots';
import { useQuery } from "@tanstack/react-query";
import { getTrainings } from "../../services/v2/TrainingService";

const HEADER_HEIGHT = 120;
const SCROLL_THRESHOLD = 5;
const SCROLL_DOWN_AMOUNT = 400;

type ScrollDirection = 'up' | 'down' | null;
const strokeColor = '#58CC02';

// Circular progress component
const CircularProgress = ({ size = 70, strokeWidth = 8, progress, accentColor, backgroundColor, image }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusStyle = () => {
    if (progress === null) {
      return {
        borderColor: accentColor,
        backgroundColor: backgroundColor,
        opacity: 1,
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

    return {
      borderColor: backgroundColor,
      backgroundColor: accentColor,
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
            stroke={strokeColor}
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
      <View style={[styles.imageContainer, getStatusStyle(),
      {
        width: size - strokeWidth * 2,
        height: size - strokeWidth * 2,
        borderRadius: (size - strokeWidth * 2) / 2
      }]}>
        {image
          ? <Image
            source={{ uri: process.env.EXPO_PUBLIC_S3_URL + image }}
            style={{ width: '100%', height: '100%', borderRadius: 60 }}
          />
          : <Text style={styles.imageText}>📚</Text>}
      </View>
    </View>
  );
};

export const TrainingListView = ({ navigation, route }) => {
  // Show bottom nav when screen is focused
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    }, [navigation])
  );

  const initPackageId = route.params?.initPackageId ?? null;
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - (2 * Spacings.lg) - (2 * Spacings.md)) / 3;

  const { data: trainings, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => getTrainings(),
    retry: 1,
    retryDelay: 1000,
  });

  // Refs
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  // States
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Handle open package screen
  useEffect(() => {
    if (!isLoading && !error) {
      let foundTraining = null;
      let foundPackage = null;

      for (const training of trainings) {
        const pkg = training.packages?.find(p => p.id === initPackageId);
        if (pkg) {
          foundTraining = training;
          foundPackage = pkg;
          break;
        }
      }

      if (foundTraining && foundPackage) {
        const timeout = setTimeout(() => {
          handlePackagePress(foundTraining, foundPackage)
        }, 1000);

        return () => clearTimeout(timeout);
      }
    }
  }, [initPackageId, trainings, isLoading, error]);

  // Check scroll button
  useEffect(() => {
    const isScrollable = contentHeight > layoutHeight;
    const isNearBottom = currentScrollY + layoutHeight >= contentHeight - 20;
    const shouldShow = isScrollable && !isNearBottom;

    setShowScrollButton(shouldShow);
  }, [contentHeight, layoutHeight, currentScrollY]);

  // Animation values
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 3, HEADER_HEIGHT],
    outputRange: [0.9, 0.95, 1],
    extrapolate: 'clamp',
  });

  // Handle scroll direction changes
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      setCurrentScrollY(value);

      const diff = value - lastScrollY;

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

  useEffect(() => {
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        // Nhảy lần 1
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Nhảy lần 2
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Nghỉ 2 giây
        Animated.delay(2000),
      ])
    );

    bounceAnimation.start();

    return () => {
      bounceAnimation.stop();
    };
  }, [bounceAnim]);

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

        if (contentOffset.y + layoutMeasurement.height + paddingToBottom >= contentSize.height) {
          // loadMore();
        }
      }
    }
  );

  const handleScrollDown = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: currentScrollY + SCROLL_DOWN_AMOUNT,
        animated: true,
      });
    }
  };

  const handlePackagePress = (training, pkg) => {
    if (pkg.available_flg) {
      navigation.navigate('training-view', {
        pkgId: pkg.id,
        trainingName: training.name,
        packageName: pkg.name,
        backgroundColor: training.color,
        lightColor: training.background_color,
      });
    } else {
      navigation.navigate('inactive-training-view', {
        training: training.id,
        headerColor: training.color,
        secondaryColor: training.background_color,
        pkg
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lgreen} />

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
          <Text style={styles.headerTitle}>Mes formations</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity onPress={() => { navigation.navigate('cart-view') }}>
              <Image
                source={require("../../../assets/v2_images/icon/bag_icon_color.png")}
                style={{ height: 30, width: 30 }} resizeMode="contain" />
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

      {/* Loading */}
      {(isLoading || isFetching) && !error && (
        <BouncingDots
          color={Colors.blue}
          size={10}
          bounceHeight={5}
          containerStyle={{
            position: 'absolute',
            backgroundColor: 'transparent',
            zIndex: 999,
            elevation: 5,
            bottom: 0,
            left: '45%',
          }}
        />
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={Colors.danger}
          />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>
            Impossible de charger les formation
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        bounces={true}
        scrollEventThrottle={16}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
        onLayout={(event) => {
          setLayoutHeight(event.nativeEvent.layout.height);
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
            style={{ zIndex: 9999 }}
          />
        }>

        {/* Training cards with grid pkg layout */}
        {!error && trainings && trainings.map((training) => (
          <View key={training.id} style={styles.trainingCard}>
            <View style={styles.trainingHeaderNew}>
              <Text style={[styles.trainingTitleNew, { backgroundColor: training.color }]} numberOfLines={2} ellipsizeMode='tail'>
                {training.name}
              </Text>
            </View>

            {/* Grid pkg layout - 3 cột */}
            <View style={styles.packagesContainer}>
              <View style={styles.packagesGridContent}>
                {training.packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.pkgItem, { width: itemSize }]}
                    onPress={() => handlePackagePress(training, pkg)}
                  >
                    <CircularProgress
                      size={itemSize}
                      strokeWidth={4}
                      progress={pkg.available_flg ? pkg.progress : null}
                      accentColor={training.color}
                      backgroundColor={training.background_color}
                      image={pkg.available_flg ? pkg.image : pkg.image_2}
                    />
                    <Text numberOfLines={2} ellipsizeMode='tail'
                      style={[styles.pkgTitle,
                      pkg.available_flg && { color: training.color, fontFamily: 'Poppins-Bold' }]}>{pkg.short_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Scroll Down Button */}
      {showScrollButton && (
        <Animated.View
          style={[
            styles.scrollDownButton,
            {
              transform: [{ translateY: bounceAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.scrollDownButtonInner}
            onPress={handleScrollDown}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={40} color={Colors.lgreen} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: HEADER_HEIGHT,
    backgroundColor: Colors.lgreen,
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
    color: Colors.white,
  },
  headerBorder: {
    height: 1,
    backgroundColor: Colors.blue,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  scrollView: {
    flex: 1,
    paddingTop: HEADER_HEIGHT - Spacings.xxl,
  },
  scrollContainer: {
    paddingBottom: Spacings.xl,
  },

  // Training card styles
  trainingCard: {
    overflow: 'hidden',
  },
  trainingHeaderNew: {
    paddingTop: Spacings.md,
    paddingBottom: Spacings.sm,
  },
  trainingTitleNew: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: Colors.white,
    alignSelf: 'flex-start',
    paddingLeft: Spacings.lg,
    paddingRight: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
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

  // Packages grid container
  packagesContainer: {
    paddingBottom: Spacings.sm
  },
  packagesGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacings.lg,
    marginTop: Spacings.md,
    gap: Spacings.md,
  },
  pkgItem: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacings.sm,
  },
  pkgTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.subtext2,
    marginTop: Spacings.sm,
    width: '100%',
    textAlign: 'center',
  },

  // Circular progress styles
  circularProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.grayLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  progressSvg: {
    position: 'absolute',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    padding: 4
  },
  imageText: {
    fontSize: 28,
  },

  // Scroll Down Button
  scrollDownButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Spacings.md,
    zIndex: 999,
  },
  scrollDownButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: 'tranparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacings.md,
    paddingHorizontal: Spacings.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});