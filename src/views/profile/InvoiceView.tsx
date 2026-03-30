// InvoiceView.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  // @ts-ignore — Clipboard is deprecated in types but still works at runtime.
  // Cannot add @react-native-clipboard/clipboard or expo-clipboard to this project.
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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
  const webViewRef = useRef(null);
  const { invoiceId } = route.params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getFifplInvoice(invoiceId),
    retry: 2,
    retryDelay: 1000,
  });

  const [webViewLoading, setWebViewLoading] = useState(true);
  const [showVirementModal, setShowVirementModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getPdfUrl = (url: string) => {
    if (Platform.OS === 'android') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const handleCopy = (key: string, value: string) => {
    Clipboard.setString(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
        <Text style={styles.errorText}>{error.message ?? 'Erreur de chargement'}</Text>
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: getPdfUrl(data.document) }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.info} />
              <Text style={styles.loadingText}>Chargement de la facture ...</Text>
            </View>
          )}
          onLoadStart={() => setWebViewLoading(true)}
          onLoad={() => setWebViewLoading(false)}
          onLoadEnd={() => setWebViewLoading(false)}
          onError={() => setWebViewLoading(false)}
        />
        {webViewLoading && (
          <View style={styles.webViewLoadingOverlay}>
            <ActivityIndicator size="large" color={Colors.info} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.controlsContainer}>
        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalAmount}>{data.amount} €</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.virementButton, webViewLoading && styles.buttonDisabled]}
            onPress={() => setShowVirementModal(true)}
            disabled={webViewLoading}
          >
            {webViewLoading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <MaterialCommunityIcons name="bank" size={20} color={Colors.white} />
            }
            <Text style={styles.actionButtonText}>Virement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.carteButton, webViewLoading && styles.buttonDisabled]}
            onPress={handleConfirmPayment}
            disabled={webViewLoading}
          >
            {webViewLoading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Ionicons name="card-sharp" size={20} color={Colors.white} />
            }
            <Text style={styles.actionButtonText}>Carte CB</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Virement Modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={showVirementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVirementModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowVirementModal(false)}
        >
          {/* Inner wrapper — prevent close on inner tap */}
          <TouchableOpacity activeOpacity={1} style={styles.virementModal}>

            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.virementModalHeader}>
              <View style={styles.virementModalHeaderLeft}>
                <View style={styles.bankIconWrapper}>
                  <MaterialCommunityIcons name="bank-outline" size={16} color={Colors.info} />
                </View>
                <Text style={styles.virementModalTitle}>Coordonnées bancaires</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVirementModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* ── Invoice Number — highlighted block ── */}
            <View style={styles.invoiceBlock}>
              <View style={styles.invoiceBlockHeader}>
                <View style={styles.invoiceBlockLabelRow}>
                  <Text style={styles.invoiceBlockLabel}>Numéro de facture</Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyPill, copiedKey === 'invoiceNumber' && styles.copyPillDone]}
                  onPress={() => handleCopy('invoiceNumber', data.no)}
                >
                  <Ionicons
                    name={copiedKey === 'invoiceNumber' ? 'checkmark' : 'copy-outline'}
                    size={11}
                    color={copiedKey === 'invoiceNumber' ? Colors.success : Colors.info}
                  />
                  <Text style={[
                    styles.copyPillText,
                    copiedKey === 'invoiceNumber' && styles.copyPillTextDone,
                  ]}>
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

            {/* ── Section divider ── */}
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Détails du virement</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* RIB */}
            <BankInfoRow
              label="RIB"
              value={BANK_INFO.rib}
              isCopied={copiedKey === 'rib'}
              onCopy={() => handleCopy('rib', BANK_INFO.rib)}
            />

            {/* IBAN */}
            <BankInfoRow
              label="IBAN"
              value={BANK_INFO.iban}
              isCopied={copiedKey === 'iban'}
              onCopy={() => handleCopy('iban', BANK_INFO.iban)}
            />

            {/* BIC */}
            <BankInfoRow
              label="BIC / SWIFT"
              value={BANK_INFO.bic}
              isCopied={copiedKey === 'bic'}
              onCopy={() => handleCopy('bic', BANK_INFO.bic)}
              isLast
            />

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


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
            {/* Icône animée */}
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>

            <Text style={styles.successTitle}>Paiement réussi !</Text>
            <Text style={styles.successSubtitle}>
              Votre facture a bien été réglée.{'\n'}Merci pour votre paiement.
            </Text>

            <ActivityIndicator
              size="small"
              color={Colors.gray}
              style={{ marginTop: Spacings.md }}
            />
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
  loadingContainer: {
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
    fontFamily: 'Poppins-Regular',
    color: Colors.danger,
    marginBottom: Spacings.md,
  },
  retryButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
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
    paddingBottom: Spacings.md,
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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },

  // ── PDF Viewer ───────────────────────────────────────────────────────────────
  pdfContainer: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  webViewLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // ── Bottom Controls ──────────────────────────────────────────────────────────
  controlsContainer: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  totalRow: {
    alignItems: 'flex-end',
    marginBottom: Spacings.sm,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  actionButton: {
    flex: 1,
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
  },
  carteButton: {
    backgroundColor: Colors.warning,
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },

  // ── Modal backdrop ───────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // ── Virement bottom sheet ────────────────────────────────────────────────────
  virementModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacings.xxxl,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginTop: Spacings.sm,
    marginBottom: Spacings.xs,
  },

  // Modal header row
  virementModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
    paddingBottom: Spacings.sm,
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
    fontSize: 15,
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
    marginHorizontal: Spacings.md,
    marginBottom: Spacings.sm,
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
  },
  invoiceBlockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceBlockLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.info,
  },
  invoiceBlockValue: {
    fontSize: 24,
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

  // Copy pill (inside invoice block)
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
    fontSize: 13,
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
    fontSize: 20,
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