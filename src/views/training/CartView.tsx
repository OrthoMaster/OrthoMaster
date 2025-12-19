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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import {
  getCartItems,
  removeFromCart,
  clearCart,
  updateCartItemQuantity
} from '../../services/v2/CartService';

const DEMO_COURSES: Course[] = [
  {
    id: '1',
    title: 'Graffiti Mastery',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80',
    modules: 3,
    lessons: 24,
    duration: 4,
  },
  {
    id: '2',
    title: 'Base de l\'orthopédie',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    modules: 5,
    lessons: 32,
    duration: 4,
  },
  {
    id: '3',
    title: 'Bases biomécaniques',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
    modules: 4,
    lessons: 28,
    duration: 4,
  },
  {
    id: '4',
    title: 'Anatomie avancée',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    modules: 6,
    lessons: 42,
    duration: 4,
  }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

interface Course {
  id: string;
  title: string;
  image: string;
  modules: number;
  lessons: number;
  duration: number;
}

interface SwipeableCourseProps {
  course: Course;
  onDelete: (id: string) => void;
}

const SwipeableCourse: React.FC<SwipeableCourseProps> = ({
  course,
  onDelete
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe to delete
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setIsDeleting(true);
            setTimeout(() => onDelete(course.id), 100);
          });
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  if (isDeleting) {
    return null;
  }

  const hasDiscount = 0;
  const discountPercent = hasDiscount ? 0 : 0;

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash-bin" size={24} color={Colors.white} />
      </View>

      {/* Course Card */}
      <Animated.View
        style={[
          styles.courseCard,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.courseContent}
        >
          {/* Course Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: course.image }}
              style={styles.courseImage}
            />
          </View>

          {/* Course Info */}
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.title}
            </Text>

            {/* Meta Info */}
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="book-outline" size={12} color={Colors.gray} />
                <Text style={styles.metaText}>
                  {course.modules} modules • {course.lessons} leçons
                </Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{course.duration.toFixed(2)} h</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const CartView = ({ navigation }) => {
  const { data: initCart, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCartItems(),
  });

  const [cartItems, setCartItems] = useState<Course[]>(DEMO_COURSES);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = (id: string) => {
    setCartItems(prev => prev?.filter(item => item.id !== id) || []);
    // removeFromCart('id');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Vider le panier',
      'Êtes-vous sûr de vouloir supprimer tous les cours du panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            clearCart();
            setCartItems([]);
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
      // TODO: Handle error
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Navigate to checkout screen
    navigation.navigate('attach-member-view');
  };

  // Calculate total
  const totalPrice = cartItems.reduce((sum, item) => sum + item.duration, 0);
  const totalOriginalPrice = cartItems.reduce(
    (sum, item) => sum + (item.duration),
    0
  );
  const totalSavings = totalOriginalPrice - totalPrice;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mon Panier</Text>
            {cartItems.length > 0 && (
              <Text style={styles.itemCount}>
                {cartItems.length} course
              </Text>
            )}
          </View>
        </View>

        {cartItems && cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <BouncingDots
          color={Colors.gray}
          size={10}
          bounceHeight={5}
          containerStyle={{
            backgroundColor: Colors.grayLight,
            zIndex: 999,
            elevation: 5,
          }}
        />
      )}

      {/* Content */}
      {!cartItems || cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={Colors.gray} />
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySubtitle}>
            Explorez nos formations et ajoutez des cours à votre panier
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
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
                  <SwipeableCourse
                    key={course.id}
                    course={course}
                    onDelete={handleDelete}
                  />
                ))}
              </View>

              {/* Spacer for bottom button */}
              <View style={{ height: 100 }} ></View>
            </View>
          </ScrollView>

          {/* Checkout Button */}
          <View style={styles.checkoutContainer}>
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutTotal}>Total</Text>
              <Text style={styles.checkoutPrice}>{totalPrice.toFixed(2)} h</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Assigner membres</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
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
    marginHorizontal: Spacings.lg,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacings.lg,
    width: '100%',
    borderRadius: 12,
  },

  // Course Card
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseContent: {
    flexDirection: 'row',
    padding: Spacings.xs,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacings.md,
  },
  courseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
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
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  priceContainer: {
    marginTop: Spacings.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  price: {
    fontSize: 16,
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
});