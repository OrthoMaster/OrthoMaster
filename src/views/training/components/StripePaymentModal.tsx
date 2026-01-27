import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StripeProvider, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { confirmPayment } from '../../../services/v2/CartService';

interface StripePaymentModalProps {
  visible: boolean;
  clientSecret: string;
  invoiceId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentContent = ({
  invoiceId,
  clientSecret,
  amount,
  onClose,
  onSuccess
}: Omit<StripePaymentModalProps, 'visible'>) => {
  const [loading, setLoading] = useState(false);
  const { confirmPayment: confirmStripePayment } = useConfirmPayment();

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
          onSuccess();
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
          placeholders={{ number: '0000 0000 0000 0000' }}
          cardStyle={{
            backgroundColor: Colors.grayLight,
            borderRadius: 8,
            textColor: '#32343E',
            placeholderColor: Colors.gray,
          }}
          style={styles.cardField}
        />
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
  clientSecret,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContent, { paddingBottom: Platform.OS === 'android' ? Spacings.xxxl : Spacings.xl }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paiement sécurisé</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StripeProvider publishableKey={publishableKey}>
              <PaymentContent
                invoiceId={invoiceId}
                clientSecret={clientSecret}
                amount={amount}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </StripeProvider>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacings.xxxl,
    maxHeight: '90%'
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
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  loadingContainer: {
    padding: Spacings.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  paymentContent: {
    padding: Spacings.lg,
    paddingBottom: Spacings.xl,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 28,
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
    color: Colors.gray,
    marginBottom: Spacings.sm,
  },
  cardField: {
    height: 50,
  },
  card: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    color: Colors.text
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacings.md,
    marginTop: Spacings.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
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
    borderRadius: 16,
    backgroundColor: Colors.blue,
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