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
      if (!closedIntroModal) {
        const shouldShow = await checkShouldShowModal();
        if (shouldShow) {
          setClosedIntroModal(true);
          setTimeout(() => {
            setShowIntroModal(true);
          }, 1000);
        }
      }
    };

    initModal();
  }, []);

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
                      onPress={() => { setShowPreRegDiplomaModal(true); }}
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
        <View style={styles.addPkgInfoModalOverlay}>
          <View style={styles.addPkgInfoModalContent}>
            {/* Header */}
            <View style={styles.addPkgInfoHeader}>
              <View style={styles.addPreRegTitleWrapper}>
                <Text style={styles.addPreRegSubTitle}>Pour la pharmacie, un diplôme unique et inédit</Text>
                <Text style={styles.addPreRegTitle}>Conseiller expert</Text>
                <Text style={styles.addPreRegTitle2}>en ORTHOPÉDIE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPreRegDiplomaModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.addPkgInfoCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.75 }} contentContainerStyle={{ padding: Spacings.md }}>
              <DiplomaModalContent onPreReg={preReg} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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

  // Add Package Info Modal Styles
  addPkgInfoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  addPkgInfoModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addPkgInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  addPkgInfoIconWrapper: {
    marginRight: Spacings.sm,
  },
  addPkgInfoTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  addPkgInfoCloseButton: {
    paddingHorizontal: Spacings.md,
  },
  addPkgInfoBody: {
    padding: Spacings.lg,
  },
  addPkgInfoDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginBottom: Spacings.md,
    textAlign: 'justify',
  },
  addPkgInfoSection: {
    marginBottom: Spacings.xs,
  },
  addPkgInfoSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginBottom: Spacings.md,
  },
  addPkgInfoListContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.sm,
  },
  addPkgInfoBullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    lineHeight: 16,
    marginLeft: Spacings.xs,
    flexWrap: 'wrap',
  },
  addPkgInfoBulletNumber: {
    width: 25,
    alignItems: 'flex-end'
  },
  addPkgInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 18,
  },
  addPkgInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    padding: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.md,
  },
  addPkgInfoNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginLeft: Spacings.xs,
  },
  textBold: {
    fontFamily: 'Poppins-Bold',
  },
  // Pre-reg
  addPreRegTitleWrapper: {
    flex: 1
  },
  addPreRegSubTitle: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  addPreRegTitle: {
    fontSize: 16,
    color: Colors.success,
    fontFamily: 'Poppins-Bold',
    marginBottom: -2
  },
  addPreRegTitle2: {
    fontSize: 20,
    color: Colors.success,
    fontFamily: 'Poppins-Bold',
  },
});