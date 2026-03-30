// InvoiceView.web.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import StripePaymentModal from '../training/components/StripePaymentModal';

import { getFifplInvoice, createFifplPaymentIntent } from '../../services/v2/CartService';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BankInfo {
  rib: string;
  iban: string;
  bic: string;
}

// ─── Hardcode or fetch from API ────────────────────────────────────────────────
const BANK_INFO: BankInfo = {
  rib: '14707 50004 33021784328 55',
  iban: 'FR76 1470 7500 0433 0217 8432 855',
  bic: 'CCBPFRPPMTZ',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const InvoiceView = ({ navigation, route }) => {
  const queryClient = useQueryClient();
  const { invoiceId } = route.params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getFifplInvoice(invoiceId),
    retry: 2,
    retryDelay: 1000,
  });

  const [iframeLoading, setIframeLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {
        fallbackCopy(value);
      });
    } else {
      fallbackCopy(value);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fallbackCopy = (value: string) => {
    const el = document.createElement('textarea');
    el.value = value;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'home' }],
      });
    }
  }

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleConfirmPayment = async () => {
    try {
      const paymentData = await createFifplPaymentIntent(invoiceId);
      if (paymentData.success) {
        setTimeout(() => {
          setClientSecret(paymentData.client_secret);
        }, 1000);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Erreur', paymentData.message);
        refetch();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      refetch();
    }
  };

  const handlePaymentSuccess = async () => {
    setShowSuccessModal(true);
    setShowPaymentModal(false);

    await queryClient.invalidateQueries({ queryKey: ['user-more'] });
    await queryClient.invalidateQueries({ queryKey: ['documents'] });
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });

    setTimeout(() => {
      setShowSuccessModal(false);
      handleGoBack();
    }, 3000);
  };

  // ─── States ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Chargement de la facture ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{"La facture a été réglée ou n'existe pas !"}</Text>
        <TouchableOpacity style={styles.returnButton} onPress={handleGoBack}>
          <Text style={styles.retryButtonText}>Retourner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Aucune facture disponible</Text>
      </View>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Facture</Text>
          <Text style={styles.headerSubtitle}>{data.no}</Text>
        </View>
      </View>

      {/* Two-column layout */}
      <View style={styles.mainContent}>

        {/* Left — PDF Viewer */}
        <View style={styles.pdfColumn}>
          {iframeLoading && (
            <View style={styles.iframeLoadingOverlay}>
              <ActivityIndicator size="large" color={Colors.info} />
              <Text style={styles.loadingText}>Chargement de la facture ...</Text>
            </View>
          )}
          {/* @ts-ignore — iframe is valid on web */}
          <iframe
            src={data.document}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
            onLoad={() => setIframeLoading(false)}
          />
        </View>

        {/* Right — Controls Panel */}
        <View style={styles.controlsColumn}>

          {/* Invoice card */}
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceCardHeader}>
              <View style={styles.invoiceIconWrapper}>
                <Ionicons name="document-text-outline" size={20} color={Colors.info} />
              </View>
              <View>
                <Text style={styles.invoiceCardLabel}>Numéro de facture</Text>
                <Text style={styles.invoiceCardNo}>{data.no}</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalAmount}>{data.amount} €</Text>
            </View>
          </View>

          {/* Bank info preview (always visible on web) */}
          <View style={styles.bankPreviewCard}>
            <View style={styles.bankPreviewHeader}>
              <View style={styles.bankIconWrapper}>
                <MaterialCommunityIcons name="bank-outline" size={16} color={Colors.info} />
              </View>
              <Text style={styles.bankPreviewTitle}>Coordonnées bancaires</Text>
            </View>

            <View style={styles.invoiceBlock}>
              <View style={styles.invoiceBlockHeader}>
                <Text style={styles.invoiceBlockLabel}>Numéro de facture</Text>
                <TouchableOpacity
                  style={[styles.copyPill, copiedKey === 'invoiceNumber' && styles.copyPillDone]}
                  onPress={() => handleCopy('invoiceNumber', data.no)}
                >
                  <Ionicons
                    name={copiedKey === 'invoiceNumber' ? 'checkmark' : 'copy-outline'}
                    size={11}
                    color={copiedKey === 'invoiceNumber' ? Colors.success : Colors.info}
                  />
                  <Text style={[styles.copyPillText, copiedKey === 'invoiceNumber' && styles.copyPillTextDone]}>
                    {copiedKey === 'invoiceNumber' ? 'Copié !' : 'Copier'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.invoiceBlockValue}>{data.no}</Text>
              <View style={styles.invoiceHintRow}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.info} style={{ marginTop: Spacings.xxs }} />
                <Text style={styles.invoiceHintText}>
                  Indiquez ce numéro dans le libellé du virement pour faciliter son identification.
                </Text>
              </View>
            </View>

            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Détails du virement</Text>
              <View style={styles.dividerLine} />
            </View>

            <BankInfoRow
              label="RIB"
              value={BANK_INFO.rib}
              isCopied={copiedKey === 'rib'}
              onCopy={() => handleCopy('rib', BANK_INFO.rib)}
            />
            <BankInfoRow
              label="IBAN"
              value={BANK_INFO.iban}
              isCopied={copiedKey === 'iban'}
              onCopy={() => handleCopy('iban', BANK_INFO.iban)}
            />
            <BankInfoRow
              label="BIC / SWIFT"
              value={BANK_INFO.bic}
              isCopied={copiedKey === 'bic'}
              onCopy={() => handleCopy('bic', BANK_INFO.bic)}
              isLast
            />
          </View>

          {/* Payment buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.carteButton]}
              onPress={handleConfirmPayment}
            >
              <Ionicons name="card-sharp" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Payer par carte CB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Modal */}
      <StripePaymentModal
        visible={showPaymentModal}
        invoiceId={invoiceId}
        amount={data.amount}
        clientSecret={clientSecret}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* ── Success Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Paiement réussi !</Text>
            <Text style={styles.successSubtitle}>
              Votre facture a bien été réglée.{'\n'}Merci pour votre paiement.
            </Text>
            <ActivityIndicator size="small" color={Colors.gray} style={{ marginTop: Spacings.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── BankInfoRow sub-component ─────────────────────────────────────────────────

const BankInfoRow = ({
  label,
  value,
  isCopied,
  onCopy,
  isLast = false,
}: {
  label: string;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
  isLast?: boolean;
}) => (
  <View style={[styles.bankRow, isLast && styles.bankRowLast]}>
    <View style={styles.bankRowContent}>
      <Text style={styles.bankRowLabel}>{label}</Text>
      <Text style={styles.bankRowValue}>{value}</Text>
    </View>
    <TouchableOpacity
      style={[styles.bankRowCopyBtn, isCopied && styles.bankRowCopyBtnDone]}
      onPress={onCopy}
    >
      <Ionicons
        name={isCopied ? 'checkmark' : 'copy-outline'}
        size={15}
        color={isCopied ? Colors.success : Colors.info}
      />
    </TouchableOpacity>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.danger,
    marginBottom: Spacings.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
  returnButton: {
    backgroundColor: Colors.gray,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    height: 100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    elevation: 4,
    shadowColor: Colors.grayLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
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
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },

  // ── Two-column main layout ───────────────────────────────────────────────────
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── PDF column ───────────────────────────────────────────────────────────────
  pdfColumn: {
    flex: 2,
    backgroundColor: Colors.grayLight,
    position: 'relative',
  },
  iframeLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // ── Controls column ──────────────────────────────────────────────────────────
  controlsColumn: {
    width: 380,
    backgroundColor: Colors.white,
    borderLeftWidth: 1,
    borderLeftColor: Colors.line,
    padding: Spacings.lg,
    gap: Spacings.lg,
  },

  // Invoice card
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.lg,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  invoiceIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceCardLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  invoiceCardNo: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacings.xs,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },

  // Payment buttons
  buttonGroup: {
    gap: Spacings.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.md,
    borderRadius: 16,
    elevation: 4,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  virementButton: {
    backgroundColor: Colors.blue,
    shadowColor: Colors.blue,
  },
  carteButton: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },

  // Bank preview card (always visible on web)
  bankPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bankPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  bankPreviewTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  // ── Modal backdrop (centered on web) ────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.lg,
  },

  // ── Virement modal (centered card on web) ───────────────────────────────────
  virementModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    paddingBottom: Spacings.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  virementModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  virementModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  bankIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  virementModalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 14,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Invoice number highlighted block ─────────────────────────────────────────
  invoiceBlock: {
    margin: Spacings.md,
    backgroundColor: Colors.infoBackground,
    borderRadius: 12,
    padding: Spacings.md,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  invoiceBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
  invoiceBlockLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.info,
  },
  invoiceBlockValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    letterSpacing: 0.2,
    marginBottom: Spacings.xs,
  },
  invoiceHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  invoiceHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.info,
    lineHeight: 16,
  },

  // Copy pill
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.info + '50',
  },
  copyPillDone: {
    borderColor: Colors.success + '60',
  },
  copyPillText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.info,
  },
  copyPillTextDone: {
    color: Colors.success,
  },

  // ── Section divider ──────────────────────────────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacings.md,
    marginBottom: Spacings.xs,
    gap: Spacings.xs,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.line,
  },
  dividerLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },

  // ── Bank Info Row ────────────────────────────────────────────────────────────
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line,
    gap: Spacings.sm,
  },
  bankRowLast: {
    borderBottomWidth: 0,
  },
  bankRowContent: {
    flex: 1,
  },
  bankRowLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: 1,
  },
  bankRowValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  bankRowCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankRowCopyBtnDone: {
    backgroundColor: Colors.success + '20',
  },

  // ── Success Modal ────────────────────────────────────────────────────────────
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: Spacings.xxxl,
    paddingHorizontal: Spacings.xl,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});