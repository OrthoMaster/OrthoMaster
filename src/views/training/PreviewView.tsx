import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import StripePaymentModal from './components/StripePaymentModal';

import { getCartDetails } from '../../services/v2/CartService';

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

interface Member {
  id: string;
  name: string;
  first_name: string;
  email: string;
}

interface Organization {
  funding_organization_id: string;
  funding_organization_name: string;
  members: Member[]
}

interface PromoCode {
  code: string;
  description: string;
  discount: number;
}

const CourseItem = ({ course }: { course: Item }) => {
  return (
    <View style={styles.courseItem}>
      <View style={styles.courseImageWrapper}>
        {course.package.image ?
          <Image
            source={{ uri: process.env.EXPO_EXPO_PUBLIC_S3_URL + course.package.image }}
            style={styles.courseImage}
          />
          :
          <MaterialCommunityIcons name={'book-open-page-variant-outline'}
            size={20} color={Colors.blue}
          />
        }
      </View>
      <View style={styles.courseItemInfo}>
        <Text style={styles.courseItemTitle} numberOfLines={2}>
          {course.package.name}
        </Text>
        <View style={styles.courseItemMeta}>
          <Ionicons name="book-outline" size={12} color={Colors.gray} />
          <Text style={styles.courseItemMetaText}>
            {course.package.lesson_total} leçon{course.package.lesson_total > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.courseItemPrice}>
        <Text style={styles.priceText}>{course.package.duration_text}</Text>
      </View>
    </View>
  );
};

const MemberItem = ({ member, organizationName }: { member: Member, organizationName: string }) => {
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={styles.memberItemInfo}>
        <Text style={styles.memberItemName}>{member.name}</Text>
        <Text style={styles.memberItemEmail} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <View style={styles.memberRoleBadge}>
        <Text style={styles.memberRoleText}>{organizationName}</Text>
      </View>
    </View>
  );
};


export const PreviewView = ({ navigation, route }) => {
  const { data: cartData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCartDetails(),
    retry: 1,
    retryDelay: 1000,
  });

  const [cartItems, setCartItems] = useState<Item[]>();
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Promo code states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<PromoCode | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [savingTotal, setSavingTotal] = useState(null);

  useEffect(() => {
    if (cartData) {
      setCartItems(cartData.items);
    }
  }, [cartData]);

  // Calculate totals
  const totalSavings = 0;

  const handleCheckPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code');
      return;
    }

    setCheckingCode(true);

    // TODO: Replace with actual API call
    // Simulate API call
    setTimeout(() => {
      // Mock validation - replace with actual API call
      if (promoCodeInput.toUpperCase() === 'PROMO10') {
        setValidatedPromo({
          code: promoCodeInput.toUpperCase(),
          description: 'Réduction de 10% sur votre commande',
          discount: 10
        });
      } else if (promoCodeInput.toUpperCase() === 'WELCOME20') {
        setValidatedPromo({
          code: promoCodeInput.toUpperCase(),
          description: 'Bienvenue! 20% de réduction',
          discount: 20
        });
      } else {
        Alert.alert('Code invalide', 'Ce code promotionnel n\'existe pas ou a expiré');
        setValidatedPromo(null);
      }
      setCheckingCode(false);
    }, 1000);
  };

  const handleApplyPromoCode = () => {
    if (validatedPromo) {
      setAppliedPromo(validatedPromo);
      setSavingTotal(validatedPromo.discount * cartData.price_total / 100);

      setShowPromoModal(false);
      setPromoCodeInput('');
      setValidatedPromo(null);
    }
  };

  const handleRemovePromoCode = () => {
    Alert.alert(
      'Retirer le code',
      'Voulez-vous retirer ce code promotionnel?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => setAppliedPromo(null)
        }
      ]
    );
  };

  // Payment 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(1);

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirmer le paiement',
      `Vous allez payer ${cartData.price_total} € pour ${cartData.items.length} formation${cartData.items.length > 1 ? 's' : ''} assignée${cartData.items.length > 1 ? 's' : ''} à ${cartData.member_ids.length} membre${cartData.member_ids.length > 1 ? 's' : ''}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            // TODO: Create invoice

            setShowPaymentModal(true);
          }
        }
      ]
    );
  };
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);

    // Navigation vers formation
    Alert.alert(
      'Succès',
      'Votre paiement a été effectué avec succès!',
      [
        {
          text: 'OK',
          onPress: () => navigation.popToTop()
        }
      ]
    );
  };

  const handleSignContract = () => {
    navigation.navigate('contract-view');
  }

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
            <Text style={styles.headerTitle}>Résumé de la commande</Text>
            <Text style={styles.headerSubtitle}>Vérifiez avant de payer</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Courses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={'book-open-page-variant-outline'} size={20} color={Colors.blue} />
              <Text style={styles.sectionTitle}>
                {
                  cartData.items.length > 1 ?
                    'Formations sélectionnées (' + cartData.items.length + ')' : 'Formation sélectionnée'
                }
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {cartData.items.map((course: Item) => (
                <CourseItem key={course.id} course={course} />
              ))}
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={'account-group-outline'} size={20} color={Colors.success} />
              <Text style={styles.sectionTitle}>
                {cartData.member_ids.length > 1 ?
                  'Membres assignés (' + cartData.member_ids.length + ')' : 'Membre assigné'
                }
              </Text>
            </View>


            {cartData.members_grouped.map((org: Organization) => (
              <View key={org.funding_organization_id} style={[styles.sectionContent, { marginBottom: Spacings.md }]}>
                <Text style={styles.organizationName}>
                  {org.funding_organization_name}
                </Text>
                {org.members.map((mem: Member) => (
                  <MemberItem key={mem.id} member={mem} organizationName={org.funding_organization_name} />
                ))}
              </View>
            ))}

          </View>

          {/* Offre Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={'ticket-percent-outline'} size={20} color={Colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Offre</Text>
                {!appliedPromo &&
                  <Text style={styles.emptyPromoText}>Aucun code promotionnel appliqué</Text>
                }
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowPromoModal(true)}
              >
                <Ionicons name="add" size={14} color={Colors.green} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {appliedPromo && (
              <View style={styles.sectionContent}>
                <View style={styles.promoCodeItem}>
                  <View style={styles.promoCodeIcon}>
                    <MaterialCommunityIcons name="ticket-percent" size={24} color={Colors.warning} />
                  </View>
                  <View style={styles.promoCodeInfo}>
                    <Text style={styles.promoCodeText}>{appliedPromo.code}</Text>
                    <Text style={styles.promoCodeDescription}>{appliedPromo.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePromoButton}
                    onPress={handleRemovePromoCode}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Price Summary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Détails de la commande</Text>
            </View>
            <View style={styles.priceSummaryContent}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total duration</Text>
                <Text style={styles.priceValue}>{cartData.duration_text || '-'}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix par heur (HT)</Text>
                <Text style={styles.priceValue}>{cartData.unit_price} €</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Nombre de membres</Text>
                <Text style={styles.priceValue}>× {cartData.member_ids.length}</Text>
              </View>

              <View style={styles.dividerLine} />

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total (HT)</Text>
                <Text style={styles.priceValue}>{cartData.price_total_ht} €</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>TVA {cartData.tva}%</Text>
                <Text style={styles.priceValue}>{cartData.tva_total} €</Text>
              </View>

              {appliedPromo &&
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.savingsLabel]}>
                    Réductions ({appliedPromo.code})
                  </Text>
                  <Text style={[styles.priceValue, styles.savingsValue]}>
                    - {savingTotal.toFixed(2)} €
                  </Text>
                </View>
              }
              <View style={styles.dividerLine} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total à payer:</Text>
                <Text style={styles.totalValue}>{appliedPromo ? (cartData.price_total - savingTotal).toFixed(2) : cartData.price_total} €</Text>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.blue} />
                <Text style={styles.infoText}>
                  Les formations seront immédiatement disponibles pour tous les membres sélectionnés après le paiement.
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* Confirm Payment Button */}
      <View style={styles.confirmContainer}>
        <View style={styles.confirmInfo}>
          <Text style={styles.confirmLabel}>Total</Text>
          <Text style={styles.confirmAmount}>{cartData.price_total} €</Text>
          <Text style={styles.confirmDetails}>
            {cartData.items.length} formation{cartData.items.length > 1 ? 's' : ''} • {cartData.member_ids.length} membre{cartData.member_ids.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.confirmActions}>
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handleConfirmPayment}
          >
            <Ionicons name="card-sharp" size={20} color={Colors.white} />
            <Text style={styles.confirmButtonText}>Paiement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleSignContract}
          >
            <FontAwesome6 name="signature" size={20} color={Colors.white} />
            <Text style={styles.confirmButtonText}>Dossier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Promo Code Modal */}
      <Modal
        visible={showPromoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPromoModal(false);
          setPromoCodeInput('');
          setValidatedPromo(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Code promotionnel</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPromoModal(false);
                  setPromoCodeInput('');
                  setValidatedPromo(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.promoInput}
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  placeholder="Ex: PROMO10"
                  placeholderTextColor={Colors.gray}
                  autoCapitalize="characters"
                  editable={!validatedPromo}
                />
                {!validatedPromo && (
                  <TouchableOpacity
                    style={styles.checkButton}
                    onPress={handleCheckPromoCode}
                    disabled={checkingCode}
                  >
                    {checkingCode ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.checkButtonText}>Vérifier</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {validatedPromo && (
                <View style={styles.validPromoContainer}>
                  <View style={styles.validPromoHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    <Text style={styles.validPromoTitle}>Code valide!</Text>
                  </View>
                  <Text style={styles.validPromoDescription}>
                    {validatedPromo.description}
                  </Text>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyPromoCode}
                  >
                    <Text style={styles.applyButtonText}>Appliquer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <StripePaymentModal
        visible={showPaymentModal}
        invoiceId={currentInvoiceId}
        amount={cartData.price_total}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
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
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -4,
  },
  content: {
    padding: Spacings.lg,
  },

  // Section
  section: {
    marginBottom: Spacings.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    flex: 1,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xxs,
    backgroundColor: Colors.greenBackground,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.green
  },
  addButtonText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.green,
  },

  // Empty Promo
  emptyPromoText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },

  // Promo Code Item
  promoCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    gap: Spacings.sm,
  },
  promoCodeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warningBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCodeInfo: {
    flex: 1,
  },
  promoCodeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  promoCodeDescription: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: 2,
  },
  removePromoButton: {
    padding: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  modalBody: {
    padding: Spacings.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  checkButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  checkButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  validPromoContainer: {
    backgroundColor: Colors.successBackground,
    borderRadius: 12,
    padding: Spacings.lg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  validPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginBottom: Spacings.sm,
  },
  validPromoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
  validPromoDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginBottom: Spacings.md,
  },
  applyButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacings.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },

  // Course Item
  courseItem: {
    flexDirection: 'row',
    padding: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  courseImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blueBackground,
    marginRight: Spacings.sm,
  },
  courseImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  courseItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  courseItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseItemMetaText: {
    fontSize: 9,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray,
    marginHorizontal: 2,
  },
  courseItemPrice: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: Spacings.sm,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  originalPriceText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textDecorationLine: 'line-through',
  },

  // Organization
  organizationName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.text,
    paddingTop: Spacings.xs,
    paddingBottom: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },

  // Member Item
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: Colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.sm,
  },
  memberAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.text,
  },
  memberItemEmail: {
    fontSize: 9,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  memberRoleBadge: {
    backgroundColor: Colors.successBackground,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.success,
  },
  memberRoleText: {
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: Colors.success,
  },

  // Price Summary
  priceSummaryContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Spacings.lg,
    paddingHorizontal: Spacings.md,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  priceValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  savingsLabel: {
    color: Colors.success,
  },
  savingsValue: {
    color: Colors.success,
    fontFamily: 'Poppins-Bold',
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacings.md,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.blue || '#E3F2FD',
    padding: Spacings.md,
    borderRadius: 8,
    marginTop: Spacings.md,
    gap: Spacings.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    lineHeight: 16,
  },

  // Confirm Button
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgb(255, 255, 255, 0.9)',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmInfo: {
    marginBottom: Spacings.sm,
  },
  confirmLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  confirmAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  confirmDetails: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -2,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacings.md
  },
  paymentButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.md,
    borderRadius: 16,
    elevation: 4,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.md,
    borderRadius: 16,
    elevation: 4,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
});