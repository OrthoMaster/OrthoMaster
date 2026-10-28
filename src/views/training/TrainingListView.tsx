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
  Image,
  Platform,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";

import { BouncingDots } from '../../component/LoadingDots';
import { useQuery } from "@tanstack/react-query";
import { getTrainings } from "../../services/v2/TrainingService";

import { preRegDiploma } from '../../services/v2/CompanyService';
import { DiplomaModalContent } from '../company/components/DiplomaModalContent';

import TrainingIntroModal from './components/TrainingIntroModal';

import { getMyBookingSetup } from '../../services/v2/BookingService';
import { BookingEntryCard } from './components/BookingEntryCard';
import BookingIntroModal, { BOOKING_INTRO_STORAGE_KEY } from '../booking/components/BookingIntroModal';

const SCROLL_DOWN_AMOUNT = 400;

const strokeColor = '#58CC02';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const { width } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;

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
            style={{ width: '100%', height: '100%', borderRadius: (size - strokeWidth * 2) / 2 }}
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

  // Calculate itemSize based on device type
  const itemSize = isTablet
    ? (screenWidth - (2 * Spacings.lg) - (4 * Spacings.md)) / 5  // 5 items for tablet
    : (screenWidth - (2 * Spacings.lg) - (2 * Spacings.md)) / 3; // 3 items for phone

  const { data: trainings, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => getTrainings(),
    retry: 1,
    retryDelay: 1000,
  });

  // Refs
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // States
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Handle open package screen
  useEffect(() => {
    if (!isLoading && !error && trainings && Array.isArray(trainings)) {
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

  // Track scroll position
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      setCurrentScrollY(value);
    });

    return () => scrollY.removeListener(listenerId);
  }, [scrollY]);

  // Bounce animation for scroll down button
  useEffect(() => {
    const bounceAnimation = Animated.loop(
      Animated.sequence([
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
        Animated.delay(2000),
      ])
    );

    bounceAnimation.start();

    return () => {
      bounceAnimation.stop();
    };
  }, [bounceAnim]);

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

  // Show intro modal
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [closedIntroModal, setClosedIntroModal] = useState(false);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Une fois annulée, l'intro ne revient pas pendant cette session : le drapeau
  // AsyncStorage n'est pas écrit, elle réapparaîtra au prochain lancement.
  const introCancelledRef = useRef(false);

  const checkShouldShowModal = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem('@never_open_training_intro');
      return value !== 'true';
    } catch (error) {
      return true;
    }
  };
  useEffect(() => {
    const initModal = async () => {
      // Le package ciblé s'ouvre au même délai : les deux minuteries se feraient la course.
      if (initPackageId) {
        return;
      }
      if (!closedIntroModal) {
        const shouldShow = await checkShouldShowModal();
        // L'utilisateur a pu agir pendant la lecture d'AsyncStorage.
        if (shouldShow && !introCancelledRef.current) {
          setClosedIntroModal(true);
          introTimeoutRef.current = setTimeout(() => {
            introTimeoutRef.current = null;
            setShowIntroModal(true);
          }, 1000);
        }
      }
    };

    initModal();
  }, []);

  /**
   * Annule l'intro si elle n'est pas encore affichée. Deux Modal visibles en même temps
   * (ou une Modal ouverte sur un écran quitté) laissent sur iOS un calque invisible
   * qui bloque toutes les pressions.
   */
  const cancelPendingIntro = useCallback(() => {
    introCancelledRef.current = true;
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
  }, []);

  // Le nettoyage s'exécute à la perte du focus et au démontage : couvre toute navigation sortante.
  useFocusEffect(
    useCallback(() => () => cancelPendingIntro(), [cancelPendingIntro])
  );

  /** Pre-reg Diploma - STA */
  const [showPreRegDiplomaModal, setShowPreRegDiplomaModal] = useState(false);
  const preReg = async () => {
    setShowPreRegDiplomaModal(false);
    const result = await preRegDiploma();
    if (result) {
      Alert.alert('Pré-inscription', result.message);
    }
  }
  /** Pre-reg Diploma - END */

  /** Rendez-vous experts - STA */
  const { data: bookingSetup } = useQuery({
    queryKey: ['booking', 'me'],
    queryFn: () => getMyBookingSetup(),
    staleTime: 60 * 1000,
  });
  const isBookingExpert = bookingSetup?.is_expert === true;
  const [showBookingIntro, setShowBookingIntro] = useState(false);

  const openBooking = async () => {
    cancelPendingIntro();

    // L'introduction s'adresse aux utilisateurs ; l'expert entre directement.
    if (!isBookingExpert) {
      const neverShow = await AsyncStorage.getItem(BOOKING_INTRO_STORAGE_KEY).catch(() => null);
      if (neverShow !== 'true') {
        setShowBookingIntro(true);
        return;
      }
    }
    navigation.navigate('booking');
  };
  /** Rendez-vous experts - END */

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lgreen} />

      {/* Static Header */}
      <View style={styles.header}>
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
      </View>

      <View style={styles.body}>
        {/* Loading */}
        {(isLoading || isFetching) && !error && (
          <BouncingDots
            color={Colors.white}
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
              colors={[Colors.lgreen]}
              tintColor={Colors.lgreen}
              style={{ zIndex: 9999 }}
            />
          }>

          {/* Rendez-vous experts */}
          {!error && (
            <BookingEntryCard isExpert={isBookingExpert} onPress={openBooking} />
          )}

          {/* Training cards with grid pkg layout */}
          {!error && trainings && Array.isArray(trainings) && trainings.map((training) => (
            <View key={training.id} style={styles.trainingCard}>
              <View style={styles.trainingHeaderNew}>
                <Text style={[styles.trainingTitleNew, { backgroundColor: training.color }]} numberOfLines={2} ellipsizeMode='tail'>
                  {training.name}
                </Text>
              </View>

              {/* Grid pkg layout */}
              <View style={styles.packagesContainer}>
                <View style={styles.packagesGridContent}>
                  {training.packages && Array.isArray(training.packages) && training.packages.map((pkg) => (
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


                  {/* Preinscription Diploma */}
                  {training.id == '1' &&
                    <TouchableOpacity
                      key={'preinscription'}
                      style={[styles.pkgItem, { width: itemSize }]}
                      onPress={() => { cancelPendingIntro(); setShowPreRegDiplomaModal(true); }}
                      activeOpacity={0.8}
                    >
                      <View style={{
                        width: itemSize - 6,
                        height: itemSize - 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 4,
                        borderColor: training.color,
                        borderRadius: itemSize,
                      }}>
                        <Image
                          style={{ width: itemSize * 0.65, height: itemSize * 0.65, marginTop: 10, marginRight: 5 }}
                          resizeMode="contain"
                          source={require('../../../assets/v2_images/icon/add-diploma.png')}
                        />
                      </View>
                      <Text numberOfLines={2} ellipsizeMode='tail'
                        style={[styles.pkgTitle, { color: training.color, fontFamily: 'Poppins-Bold' }]}>
                        Diplôme Pharmacie</Text>
                    </TouchableOpacity>
                  }
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

      </View>

      {/* Intro Modal */}
      <TrainingIntroModal
        visible={showIntroModal}
        onClose={() => {
          setShowIntroModal(false);
        }}
      />

      {/* Pre-reg Diploma */}
      <Modal
        visible={showPreRegDiplomaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreRegDiplomaModal(false)}
      >
        <DiplomaModalContent onPreReg={preReg} onClose={() => setShowPreRegDiplomaModal(false)} />
      </Modal>

      {/* Rendez-vous experts : introduction */}
      <BookingIntroModal
        visible={showBookingIntro}
        onClose={() => setShowBookingIntro(false)}
        onContinue={() => navigation.navigate('booking')}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lgreen,
  },
  header: {
    height: isTablet ? 100 : 60,
    backgroundColor: Colors.lgreen,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.darkBackground
  },
  headerContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
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
    backgroundColor: Colors.lgreen,
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
    paddingTop: isTablet ? Spacings.xl : 0,
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
    shadowColor: Colors.gray,
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
    backgroundColor: Colors.lgreenDark,
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