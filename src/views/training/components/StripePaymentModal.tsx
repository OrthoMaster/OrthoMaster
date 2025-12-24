import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StripeProvider, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { createPaymentIntent, confirmPayment } from '../../../services/v2/CartService';

interface StripePaymentModalProps {
  visible: boolean;
  invoiceId: number;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentContent = ({
  invoiceId,
  amount,
  onClose,
  onSuccess
}: Omit<StripePaymentModalProps, 'visible'>) => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const { confirmPayment: confirmStripePayment } = useConfirmPayment();

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const paymentData = await createPaymentIntent(invoiceId);
      if (paymentData) {
        setClientSecret(paymentData.client_secret);
        setPaymentIntentId(paymentData.payment_intent_id);
      } else {
        Alert.alert('Erreur', 'Impossible d\'initialiser le paiement');
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      onClose();
    }
  };

  const handlePayment = async () => {
    if (!clientSecret) {
      Alert.alert('Erreur', 'Le paiement n\'est pas prêt');
      return;
    }

    setLoading(true);

    try {
      // Étape 1: Confirmer avec Stripe
      const { error, paymentIntent } = await confirmStripePayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Échec du paiement', error.message);
        setLoading(false);
        return;
      }

      // Étape 2: Confirmer avec le backend
      if (paymentIntent) {
        const confirmResult = await confirmPayment(invoiceId, paymentIntent.id);

        if (confirmResult.success) {
          Alert.alert(
            'Succès',
            'Paiement effectué avec succès!',
            [{ text: 'OK', onPress: () => onSuccess() }]
          );
        } else {
          Alert.alert('Erreur', confirmResult.message);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Le paiement a échoué');
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>Initialisation du paiement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.paymentContent}>
      <Text style={styles.amountLabel}>Montant à payer</Text>
      <Text style={styles.amountValue}>{amount} €</Text>

      <View style={styles.cardFieldContainer}>
        <Text style={styles.cardLabel}>Informations de carte</Text>
        <CardField
          postalCodeEnabled={true}
          placeholders={{ number: '4242 4242 4242 4242' }}
          cardStyle={styles.card}
          style={styles.cardField}
        />
      </View>

      <View style={styles.testInfo}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.blue} />
        <Text style={styles.testInfoText}>
          Mode test: utilisez 4242 4242 4242 4242
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <Text style={styles.payButtonText}>Payer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function StripePaymentModal({
  visible,
  invoiceId,
  amount,
  onClose,
  onSuccess,
}: StripePaymentModalProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paiement sécurisé</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <StripeProvider publishableKey={publishableKey}>
            <PaymentContent
              invoiceId={invoiceId}
              amount={amount}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </StripeProvider>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  paymentContent: {
    padding: Spacings.lg,
  },
  amountLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacings.xl,
  },
  cardFieldContainer: {
    marginBottom: Spacings.md,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.sm,
  },
  cardField: {
    height: 50,
  },
  card: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.sm,
    backgroundColor: Colors.blueBackground,
    borderRadius: 8,
    marginBottom: Spacings.lg,
  },
  testInfoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.blue,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacings.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  payButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.warning,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
});