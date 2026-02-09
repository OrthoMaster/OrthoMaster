import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { getCartDetails, removeFromCart, clearCart } from '../../services/v2/CartService';

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

interface CartItemProps {
  course: Item;
  onDelete: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ course, onDelete }) => {
  return (
    <View style={styles.courseCard}>
      <View style={styles.courseContent}>
        {/* Item Image */}
        <View style={styles.imageContainer}>
          {course.package.image ? (
            <Image
              source={{ uri: process.env.EXPO_PUBLIC_S3_URL + course.package.image }}
              style={styles.courseImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={30}
              color={Colors.blue}
            />
          )}
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
              <Text style={styles.metaText}>
                {course.package.lesson_total} leçon{course.package.lesson_total > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{course.package.duration_text}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(course.id)}
        >
          <Ionicons name="close" size={30} color={Colors.danger} />
        </TouchableOpacity>
      </View>
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
  const [deleting, setDeleting] = useState(false);

  // Dialog states
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [showClearErrorDialog, setShowClearErrorDialog] = useState(false);

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
      setShowDeleteErrorDialog(true);
      setDeleting(false);
    }

    refetch();
  };

  const handleClearAll = () => {
    setShowClearCartDialog(true);
  };

  const confirmClearCart = async () => {
    setShowClearCartDialog(false);
    setDeleting(true);

    const result = await clearCart();
    if (result) {
      setCartItems([]);
      setDeleting(false);
    } else {
      setDeleting(false);
      setShowClearErrorDialog(true);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigation.navigate('preview-view');
  };

  const handleClose = () => {
    navigation.popToTop();
  };

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        {/* Cart Panel */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.cartPanel}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleClose}
              >
                <Ionicons name="arrow-forward" size={24} color={Colors.text} />
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
                <Ionicons name="trash-bin-outline" size={30} color={Colors.danger} />
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

          {error ? (
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
                  <Text style={styles.emptyTitle}>Votre cartable est vide</Text>
                  <Text style={styles.emptySubtitle}>
                    Explorez nos formations et ajoutez des cours à votre cartable
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.browseButtonText}>Parcourir les formations</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.content}>
                      {/* Cart Items List */}
                      <View style={styles.cartList}>
                        {cartItems.map((course) => (
                          <CartItem
                            key={course.id}
                            course={course}
                            onDelete={() => handleDelete(course.id, course.package.id)}
                          />
                        ))}
                      </View>

                      {/* Spacer for bottom button */}
                      <View style={{ height: 100 }} />
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
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Portal Dialogs for Web (replacing Alert) */}
      <Portal>
        {/* Delete Error Dialog */}
        <Dialog
          visible={showDeleteErrorDialog}
          onDismiss={() => setShowDeleteErrorDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.danger }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Cette article ne peut pas être retiré du cartable, veuillez réessayer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowDeleteErrorDialog(false)}
            >
              Fermer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Cart Confirmation Dialog */}
        <Dialog
          visible={showClearCartDialog}
          onDismiss={() => setShowClearCartDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Vider le cartable</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Êtes-vous sûr de vouloir supprimer tous les cours du cartable ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowClearCartDialog(false)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.danger}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={confirmClearCart}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Cart Error Dialog */}
        <Dialog
          visible={showClearErrorDialog}
          onDismiss={() => setShowClearErrorDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={[styles.dialogWebTitle, { color: Colors.danger }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogWebContent}>
              Échec de la suppression du cartable, veuillez réessayer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowClearErrorDialog(false)}
            >
              Fermer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  // Modal & Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cartPanel: {
    width: 700,
    height: '100%',
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  // Existing styles
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  itemCount: {
    fontSize: 14,
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
    paddingHorizontal: Spacings.lg,
  },

  // Item Card
  courseCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacings.sm,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseContent: {
    flexDirection: 'row',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: Spacings.md,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    borderRadius: 45,
    padding: 4,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 4,
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
  deleteButton: {
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
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

  // Dialog Styles
  dialogWeb: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    maxWidth: 400,
    zIndex: 99999,
    alignSelf: 'center',
    position: 'absolute',
  },
});