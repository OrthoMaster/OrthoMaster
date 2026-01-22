import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  PanResponder,
  RefreshControl,
  Dimensions,
  Image,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { getCartDetails, removeFromCart, clearCart } from '../../services/v2/CartService';
import { sendError } from '../../services/v2/AuthService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80; // Ngưỡng để trigger xóa (giảm xuống để dễ trigger hơn)
const DELETE_ZONE_WIDTH = 100; // Độ rộng vùng hiển thị nút xóa

interface Item {
  id: string;
  package: {
    id: string;
    name: string;
    lesson_total: number;
    duration: number;
    duration_text: string;
    image: string;
  }
}

interface SwipeableItemProps {
  course: Item;
  onDelete: (id: string) => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  course,
  onDelete
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.8)).current;

  const [isDeleting, setIsDeleting] = useState(false);
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);
  const hasVibratedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const clampedDx = Math.max(gestureState.dx, -DELETE_ZONE_WIDTH);
          translateX.setValue(clampedDx);

          const progress = Math.min(Math.abs(clampedDx) / DELETE_ZONE_WIDTH, 1);
          deleteOpacity.setValue(progress);
          deleteScale.setValue(0.8 + (progress * 0.2)); // Scale 0.8 to 1.0

          // Check if reached threshold
          const reachedThreshold = gestureState.dx < SWIPE_THRESHOLD;
          if (reachedThreshold && !hasVibratedRef.current) {
            Vibration.vibrate(10);
            hasVibratedRef.current = true;
            setHasReachedThreshold(true);
          } else if (!reachedThreshold && hasVibratedRef.current) {
            hasVibratedRef.current = false;
            setHasReachedThreshold(false);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Reset vibration flag
        hasVibratedRef.current = false;
        setHasReachedThreshold(false);

        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Animate to fully off screen
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsDeleting(true);
            setTimeout(() => onDelete(course.id), 50);
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(deleteScale, {
              toValue: 0.8,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            })
          ]).start();
        }
      },
    })
  ).current;

  if (isDeleting) {
    return null;
  }

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteBackground}>
        <Animated.View
          style={[
            styles.deleteIconContainer,
            {
              opacity: deleteOpacity,
              transform: [{ scale: deleteScale }]
            }
          ]}
        >
          <Ionicons
            name="trash-bin"
            size={28}
            color={Colors.white}
          />
          <Text style={styles.deleteText}>Supprimer</Text>
        </Animated.View>
      </View>

      {/* Item Card */}
      <Animated.View
        style={[
          styles.courseCard,
          {
            transform: [{ translateX }],
          },
          hasReachedThreshold && styles.courseCardThreshold
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.courseContent}
        >
          {/* Item Image */}
          <View style={[styles.imageContainer]}>
            {course.package.image ?
              <Image
                source={{ uri: process.env.EXPO_PUBLIC_S3_URL + course.package.image }}
                style={[styles.courseImage, { tintColor: Colors.blue }]}
                resizeMode="contain"
              />
              :
              <MaterialCommunityIcons name={'book-open-page-variant-outline'}
                size={30} color={Colors.blue}
              />
            }
          </View>

          {/* Item Info */}
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.package.name}
            </Text>

            {/* Meta Info */}
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="book-outline" size={12} color={Colors.gray} />
                <Text style={styles.metaText}>{course.package.lesson_total} leçon{course.package.lesson_total > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{course.package.duration_text}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const CartView = ({ navigation }) => {
  const { data: cartData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCartDetails(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });

  const [cartItems, setCartItems] = useState<Item[]>();
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (cartData) {
      setCartItems(cartData.items);
    } else {
      setCartItems([]);
    }
  }, [cartData]);

  const handleDelete = async (id: string, packageId: string) => {
    setDeleting(true);
    const result = await removeFromCart(packageId);
    if (result) {
      setCartItems(prev => prev?.filter(item => item.id !== id) || []);
      setDeleting(false);
    } else {
      Alert.alert('Erreur', 'Cette article ne peut pas être retiré du cartable, veuillez réessayer.');
      setDeleting(false);
    }

    refetch();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Vider le cartable',
      'Êtes-vous sûr de vouloir supprimer tous les cours du cartable ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);

            const result = await clearCart();
            if (result) {
              setCartItems([]);
              setDeleting(false);
            } else {
              setDeleting(false);
              Alert.alert('Erreur', 'Échec de la suppression du cartable, veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      sendError('refresh-cart', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Navigate to checkout screen
    navigation.navigate('preview-view');
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.popToTop()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mon Cartable</Text>
            {cartItems && cartItems.length > 0 && (
              <Text style={styles.itemCount}>
                {cartItems.length} article{cartItems.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {cartItems && cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-bin-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {(isLoading || isFetching || deleting) && !error && (
        <BouncingDots
          color={Colors.blue}
          size={10}
          bounceHeight={5}
          containerStyle={{
            position: 'absolute',
            backgroundColor: 'transparent',
            zIndex: 999,
            elevation: 5,
            bottom: 80,
            left: '45%',
          }}
        />
      )}
      {error
        ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color={Colors.danger}
            />
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorMessage}>
              Impossible de charger le cartable
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {(!cartItems || cartItems.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../../../assets/v2_images/icon/bag_icon.png")}
                  style={{ height: 50, width: 50, opacity: 0.4 }}
                  resizeMode={'contain'} />
                <Text style={styles.emptyTitle}>Votre cartable est vide</Text>
                <Text style={styles.emptySubtitle}>
                  Explorez nos formations et ajoutez des cours à votre cartable
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.popToTop()}
                >
                  <Text style={styles.browseButtonText}>Parcourir les formations</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing || isFetching}
                      onRefresh={onRefresh}
                      colors={[Colors.primary]}
                      tintColor={Colors.primary}
                    />
                  }
                >
                  <View style={styles.content}>
                    {/* Cart Items List */}
                    <View style={styles.cartList}>
                      {cartItems.map((course) => (
                        <SwipeableItem
                          key={course.id}
                          course={course}
                          onDelete={() => handleDelete(course.id, course.package.id)}
                        />
                      ))}
                    </View>

                    {/* Spacer for bottom button */}
                    <View style={{ height: 100 }}>
                      <Text style={{ textAlign: 'center', fontSize: 10, color: Colors.gray, fontFamily: 'Poppins-Medium' }}>Glissez vers la gauche pour supprimer</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Checkout Button */}
                <View style={styles.checkoutContainer}>
                  <View style={styles.checkoutInfo}>
                    <Text style={styles.checkoutTotal}>Total</Text>
                    <Text style={styles.checkoutPrice}>{!!cartData ? cartData.duration_text : '-'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                  >
                    <Text style={styles.checkoutButtonText}>Confirmer</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  itemCount: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -4,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    paddingVertical: Spacings.md,
  },
  cartList: {
    marginBottom: Spacings.lg,
  },

  // Swipeable Container
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacings.sm,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_ZONE_WIDTH,
  },
  deleteIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    marginTop: Spacings.xxs,
  },

  // Item Card
  courseCard: {
    backgroundColor: Colors.white,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseCardThreshold: {
    elevation: 4,
    shadowOpacity: 0.2,
  },
  courseContent: {
    flexDirection: 'row',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacings.md,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blueBackground,
    borderRadius: 45,
    padding: Spacings.xs
  },
  courseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 0,
    marginTop: 2
  },
  metaContainer: {
    gap: Spacings.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  priceContainer: {
    marginTop: Spacings.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textDecorationLine: 'line-through',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xs,
    marginBottom: Spacings.xl,
    textAlign: 'center',
    width: '80%',
  },
  browseButton: {
    backgroundColor: Colors.blue,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xl,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Checkout Button
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutTotal: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  checkoutPrice: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  checkoutButton: {
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight,
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