import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  Alert,
  StatusBar,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';

import { useQueryClient, useQuery } from '@tanstack/react-query';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";

import { getCartDetails, addToCart, removeFromCart } from "../../services/v2/CartService";

import LessonLogoIcon from './components/LessonLogoIcon';

type Tab = 'detail' | 'course';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SPACING = Spacings.md;
const ITEM_WIDTH = (width - (Spacings.lg * 2) - (ITEM_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

export const InactiveTrainingView = ({ navigation, route }) => {
  // Hide bottom nav
  useFocusEffect(
    useCallback(() => {
      // Hide
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });

      // Re-Show when unmount
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: { display: 'flex' }
        });
      };
    }, [navigation])
  );

  const queryClient = useQueryClient();
  const { pkg, headerColor = Colors.blue, secondaryColor = Colors.blue2 } = route.params || {};

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCartDetails,
    retry: 1,
    retryDelay: 1000,
  });

  // Check the package is in cart or not
  const isInCart = useMemo(() => {
    if (!cartData || !cartData.items) return false;
    return cartData.items.some(item => item.package_id === pkg.id);
  }, [cartData, pkg.id]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const videoRef = useRef<Video>(null);
  const [currentLessons, setCurrentLessons] = useState([]);
  const [currentTab, setCurrentTab] = useState<Tab>('course');
  const [sheetData, setSheetData] = useState<string>('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  // Section
  const Section = ({ title, index, image, lessons, color, isLastInRow }: {
    title: string;
    index: number;
    image: string;
    lessons: any;
    color?: string;
    isLastInRow?: boolean;
  }) => {
    return (
      <TouchableOpacity
        key={'module-' + index}
        onPress={() => handleLessonSheet(title, lessons)}
        style={[styles.sectionContainer, isLastInRow && { marginRight: 0 }]}
      >
        <View style={styles.sectionImageWrapper}>
          <View style={[styles.sectionImagePlaceholder, { borderColor: color, backgroundColor: color }]}>
            {image ?
              <Image
                source={{ uri: process.env.EXPO_PUBLIC_S3_URL + image }}
                style={styles.sectionImage}
                resizeMode='contain'
              />
              :
              <MaterialCommunityIcons name="bookshelf" size={30} color={Colors.white} />
            }
          </View>
        </View>
        <Text
          numberOfLines={2}
          ellipsizeMode='tail'
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Lesson
  const Lesson = ({ lesson, isDemo, headerColor }: {
    lesson: any;
    isDemo: boolean;
    headerColor: string;
  }) => (
    <TouchableOpacity
      style={styles.lessonContainer}
      disabled={!isDemo}
      onPress={() => {}}
    >
      {/* Icon Circle */}
      <LessonLogoIcon
        color={headerColor}
        size={40}
        image={lesson.image}
        blocked={false}
        passed={true}
        type={lesson.type || 'lesson'}
        key={lesson.id}
      />

      {/* Lesson Info */}
      <View style={styles.lessonContent}>
        <Text
          style={[
            styles.lessonTitle,
            !isDemo && styles.lessonTitleLocked
          ]}
          numberOfLines={2}
          ellipsizeMode='tail'
        >
          {lesson.title}
        </Text>
        <Text style={styles.lessonDuration}>
          {lesson.duration_text || '---'}
        </Text>
      </View>

      {/* Lock Icon */}
      {!isDemo && (
        <Ionicons name="lock-closed" size={20} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );

  // Handle lession bottom sheet
  const handleLessonSheet = useCallback((title: string, lessons: any) => {
    setSheetData(title);
    setCurrentLessons(lessons);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle open video modal
  const handleOpenVideo = useCallback(() => {
    setShowVideoModal(true);
  }, []);

  // Handle close video modal
  const handleCloseVideo = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
      await videoRef.current.setPositionAsync(0);
    }
    setShowVideoModal(false);
  }, []);

  // Handle close modal
  const closeModal = () => {
    navigation.goBack();
  };

  // Handle add to cart
  const [showFlyingCart, setShowFlyingCart] = useState(false);
  const flyingAnimation = useRef(new Animated.Value(0)).current;
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Handle Add to Cart with animation
  const handleAddToCart = useCallback((packageId: any) => {
    setIsAddingToCart(true);
    setShowFlyingCart(true);

    // Reset animation value
    flyingAnimation.setValue(0);

    // Start animation
    Animated.timing(flyingAnimation, {
      toValue: 1,
      duration: 800, // 800ms
      useNativeDriver: true,
    }).start(async () => {
      // Hide after animation completes
      setShowFlyingCart(false);

      const result = await addToCart(packageId);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        setIsAddingToCart(false);
      } else {
        setIsAddingToCart(false);
        Alert.alert('Erreur', 'Vous ne pouvez pas ajouter ce produit à votre cartable, veuillez réessayer.');
      }
    });
  }, [flyingAnimation, queryClient]);

  // Handle remove from cart
  const [isDeletingFromCart, setIsDeletingFromCart] = useState(false);
  const handleRemoveFromCart = useCallback(async (packageId: any) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous supprimer ce produit du cartable ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingFromCart(true);

            const result = await removeFromCart(packageId);
            if (result) {
              await queryClient.invalidateQueries({ queryKey: ['cart'] });
              setIsDeletingFromCart(false);
            } else {
              setIsDeletingFromCart(false);
              Alert.alert('Erreur', 'Ce produit ne peut pas être retiré du cartable, veuillez réessayer.');
            }
          }
        }
      ]
    );
  }, [queryClient]);

  // Handle view cart
  const handleViewCart = useCallback(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'flex' }
    });

    navigation.navigate('cart-view');
  }, [navigation]);

  // Calculate animated styles
  const flyingCartStyle = {
    opacity: flyingAnimation.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [1, 1, 0],
    }),
    transform: [
      {
        translateX: flyingAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 200],
        }),
      },
      {
        translateY: flyingAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -400],
        }),
      },
      {
        scale: flyingAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.3],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={[styles.wrapper, { backgroundColor: secondaryColor || Colors.blue }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={secondaryColor || Colors.blue} />

      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Header with colored background and logo */}
        <View style={[styles.headerContainer, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color={headerColor} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.logoContainer, { backgroundColor: headerColor }]}>
              {pkg.image ?
                <Image
                  source={{ uri: process.env.EXPO_PUBLIC_S3_URL + pkg.image }}
                  style={[styles.logo]}
                  resizeMode="contain"
                />
                :
                <MaterialCommunityIcons name={'book-open-page-variant-outline'} size={40} color={Colors.white} />
              }
            </View>
          </View>
        </View>

        {/* Content with rounded top corners */}
        <View style={styles.contentWrapper}>
          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>{pkg.name}</Text>

            {/* Meta Info */}
            <View style={styles.infoContainer}>
              <View style={styles.metaContainer}>
                <Ionicons name="book-outline" size={16} color={Colors.gray} />
                <Text style={styles.metaInfo}>{pkg.modules.length + (pkg.modules.length > 1 ? ' modules' : ' module')} - {pkg.lesson_total + (pkg.lesson_total > 1 ? ' leçons' : ' leçon')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.gray} />
                <Text style={styles.metaInfo}>{pkg.duration_text}</Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, currentTab === 'detail' && [styles.activeTab, { backgroundColor: headerColor }]]}
                disabled={currentTab === 'detail'}
                onPress={() => setCurrentTab('detail')}
              >
                <Text style={[styles.tabText, currentTab === 'detail' && styles.activeTabText]}>À propos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, currentTab === 'course' && [styles.activeTab, { backgroundColor: headerColor }]]}
                disabled={currentTab === 'course'}
                onPress={() => setCurrentTab('course')}
              >
                <Text style={[styles.tabText, currentTab === 'course' && styles.activeTabText]}>Modules</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            {currentTab === 'detail' &&
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.descriptionContainer}>
                  {pkg.description && (
                    <Text style={styles.description}>{pkg.description}</Text>
                  )}

                  {/* Video Thumbnail */}
                  {pkg.thumbnail && (
                    <TouchableOpacity
                      style={styles.videoThumbnailContainer}
                      onPress={handleOpenVideo}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: process.env.EXPO_PUBLIC_S3_URL + pkg.thumbnail }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      {/* Overlay */}
                      <View style={[styles.thumbnailOverlay, { backgroundColor: `${headerColor}40` }]} />
                      {/* Play Button */}
                      <View style={[styles.playButton, { backgroundColor: headerColor }]}>
                        <Ionicons name="play" size={32} color={Colors.white} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            }

            {/* Course - 3 columns grid */}
            {currentTab === 'course' &&
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modulesGrid}>
                  {pkg.modules.map((module, index) => (
                    <Section
                      key={module.id}
                      title={module.name}
                      image={module.image}
                      lessons={module.lessons}
                      color={headerColor}
                      index={index}
                      isLastInRow={(index + 1) % 3 === 0}
                    />
                  ))}
                </View>
              </ScrollView>
            }

            {/* Bottom Buttons */}
            {!pkg.available_flg &&
              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS == 'ios' ? Spacings.xl : Spacings.xxxl }]}>
                {!isInCart ? (
                  // Ajouter
                  <TouchableOpacity
                    style={[styles.addToCartButton, { backgroundColor: isAddingToCart ? Colors.gray : Colors.blue }]}
                    onPress={() => handleAddToCart(pkg.id)}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart &&
                      <ActivityIndicator size={20} animating={true} color={Colors.white} />
                    }
                    <Text style={styles.addToCartText}>
                      {isAddingToCart ? 'Ajout en cours...' : 'Ajouter au cartable'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.removeFromCartButton}
                      onPress={() => handleRemoveFromCart(pkg.id)}
                      disabled={isDeletingFromCart}
                    >
                      {isDeletingFromCart
                        ? <ActivityIndicator size={20} animating={true} color={Colors.white} />
                        : <Ionicons name="trash-bin-sharp" size={20} color={Colors.white} />
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewCartButton}
                      onPress={handleViewCart}
                      disabled={isDeletingFromCart}
                    >
                      <Text style={styles.viewCartText}>Mon cartable</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            }
            {/* Flying Cart Animation */}
            {showFlyingCart && (
              <Animated.View style={[styles.flyingCart, flyingCartStyle]}>
                <MaterialCommunityIcons name={'book-open-page-variant-outline'} size={40} color={Colors.blue} />
              </Animated.View>
            )}
          </View>
        </View>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          enableDynamicSizing={false}
          style={{
            elevation: 5,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
          }}
        >
          <View style={styles.sheetHeader}>
            <Text numberOfLines={1} ellipsizeMode='tail'
              style={styles.sheetTitle}>{sheetData}</Text>
          </View>
          <BottomSheetScrollView style={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            {currentLessons.map((lesson, index) => (
              <Lesson
                key={'lesson-' + index}
                lesson={lesson}
                isDemo={lesson.isDemo || false}
                headerColor={headerColor}
              />
            ))}
          </BottomSheetScrollView>
        </BottomSheet>

        {/* Video Modal */}
        <Modal
          visible={showVideoModal}
          animationType="fade"
          onRequestClose={handleCloseVideo}
          supportedOrientations={['portrait', 'landscape']}
        >
          <View style={styles.videoModalContainer}>
            <StatusBar hidden />

            {/* Close Button */}
            <TouchableOpacity
              style={styles.videoCloseButton}
              onPress={handleCloseVideo}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            {/* Video Player */}
            {pkg.video_url && (
              <Video
                ref={videoRef}
                source={{ uri: pkg.video_url }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onPlaybackStatusUpdate={status => setVideoStatus(() => status)}
              />
            )}
          </View>
        </Modal>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerContainer: {
    height: '30%',
    paddingHorizontal: Spacings.lg,
  },
  headerContent: {
    flex: 1,
    paddingBottom: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: Spacings.xxs
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  contentWrapper: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacings.lg,
    elevation: 8,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.xs,
    marginTop: Spacings.xs
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaInfo: {
    marginLeft: Spacings.xxs,
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: Colors.gray,
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray,
    marginHorizontal: Spacings.sm,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.grayLight,
    borderRadius: 40,
    padding: Spacings.xxs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacings.xs,
    alignItems: 'center',
    borderRadius: 30,
  },
  activeTab: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  tabText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.white,
  },

  descriptionContainer: {
    marginTop: Spacings.md,
    marginBottom: 100,
  },
  descriptionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    marginTop: Spacings.sm,
    marginBottom: Spacings.xxs,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
    color: Colors.text,
    fontFamily: 'Roboto',
    marginBottom: Spacings.lg,
  },

  // Video Thumbnail
  videoThumbnailContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacings.md,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: -32,
    marginTop: -32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Video Modal
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },

  // Modules Grid - 3 columns
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: Spacings.lg,
    marginBottom: 100,
  },
  sectionContainer: {
    width: ITEM_WIDTH,
    marginBottom: Spacings.lg,
    marginRight: ITEM_SPACING,
    alignItems: 'center',
  },
  sectionImageWrapper: {
    marginBottom: Spacings.xs,
  },
  sectionImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',

  },
  sectionImage: {
    width: 65,
    height: 65,
    borderRadius: 60
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
    width: ITEM_WIDTH,
  },

  // Bottom sheet
  sheetHeader: {
    paddingBottom: Spacings.md,
    paddingHorizontal: Spacings.lg,
    paddingLeft: Spacings.xl,
    borderBottomWidth: 2,
    borderBottomColor: Colors.grayLight,
    alignItems: 'center'
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
    width: '70%',
  },
  sheetBody: {
    flex: 1,
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.xl,
  },

  // Lesson
  lessonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },

  lessonContent: {
    flex: 1,
    marginLeft: Spacings.md,
    marginRight: Spacings.sm,
  },
  lessonTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  lessonTitleLocked: {
    color: Colors.gray,
  },
  lessonDuration: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
  },

  // Bottom button
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: Colors.blue,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addToCartText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    paddingLeft: Spacings.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  viewCartButton: {
    flex: 3,
    flexDirection: 'row',
    backgroundColor: Colors.success,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    paddingLeft: Spacings.xs,
  },
  removeFromCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    paddingVertical: Spacings.md,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  flyingCart: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -20, // Center icon (half of icon size)
    zIndex: 1000,
  },
});