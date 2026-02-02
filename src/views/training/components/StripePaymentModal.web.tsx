import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { confirmPayment } from '../../../services/v2/CartService';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface StripePaymentModalProps {
  visible: boolean;
  clientSecret: string;
  invoiceId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm = ({
  invoiceId,
  clientSecret,
  amount,
  onClose,
  onSuccess,
}: Omit<StripePaymentModalProps, 'visible'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Le paiement n\'est pas prêt');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Veuillez entrer vos informations de carte');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Étape 1: Confirmer avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Le paiement a échoué');
        setLoading(false);
        return;
      }

      // Étape 2: Confirmer avec le backend
      if (paymentIntent) {
        const confirmResult = await confirmPayment(invoiceId, paymentIntent.id);

        if (confirmResult.success) {
          onSuccess();
        } else {
          setError(confirmResult.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Le paiement a échoué');
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Initialisation du paiement...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePayment} style={styles.paymentContent}>
      <p style={styles.amountLabel}>Montant à payer</p>
      <h2 style={styles.amountValue}>{amount} €</h2>

      <div style={styles.cardFieldContainer}>
        <label style={styles.cardLabel}>Informations de carte</label>
        <div style={styles.cardElementWrapper}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#32343E',
                  '::placeholder': {
                    color: Colors.gray,
                  },
                  fontFamily: 'Poppins-Regular, -apple-system, sans-serif',
                  padding: '12px',
                },
                invalid: {
                  color: '#fa755a',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>❌ {error}</p>
        </div>
      )}

      <div style={styles.buttonContainer}>
        <button
          type="button"
          style={styles.cancelButton}
          onClick={onClose}
          disabled={loading}
        >
          Annuler
        </button>

        <button
          type="submit"
          style={{
            ...styles.payButton,
            ...(loading ? styles.payButtonDisabled : {}),
          }}
          disabled={loading || !stripe}
        >
          {loading ? (
            <div style={styles.buttonSpinner} />
          ) : (
            <>
              <span style={styles.cardIcon}>💳</span>
              <span style={styles.payButtonText}>Payer</span>
            </>
          )}
        </button>
      </div>
    </form>
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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  useEffect(() => {
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey]);

  if (!visible) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Paiement sécurisé</h3>
          <button style={styles.closeButton} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={styles.scrollContent}>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                invoiceId={invoiceId}
                clientSecret={clientSecret}
                amount={amount}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </Elements>
          ) : (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Chargement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles (CSS-in-JS cho web)
const styles: { [key: string]: React.CSSProperties } = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacings.lg,
    borderBottom: `1px solid ${Colors.line}`,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium, -apple-system, sans-serif',
    color: Colors.text,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: Colors.gray,
    cursor: 'pointer',
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    overflowY: 'auto',
    flex: 1,
  },
  loadingContainer: {
    padding: Spacings.lg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: 14,
    fontFamily: 'Poppins-Regular, -apple-system, sans-serif',
    color: Colors.gray,
  },
  paymentContent: {
    padding: Spacings.lg,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular, -apple-system, sans-serif',
    color: Colors.gray,
    textAlign: 'center',
    margin: 0,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold, -apple-system, sans-serif',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacings.xl,
    marginTop: Spacings.sm,
  },
  cardFieldContainer: {
    marginBottom: Spacings.md,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium, -apple-system, sans-serif',
    color: Colors.gray,
    marginBottom: Spacings.sm,
    display: 'block',
  },
  cardElementWrapper: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    padding: '14px 16px',
    border: `1px solid ${Colors.line}`,
  },
  errorContainer: {
    marginTop: Spacings.md,
    padding: Spacings.sm,
    backgroundColor: '#fee',
    borderRadius: 8,
    border: '1px solid #fcc',
  },
  errorText: {
    color: '#c33',
    fontSize: 13,
    fontFamily: 'Poppins-Regular, -apple-system, sans-serif',
    margin: 0,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.md,
    marginTop: Spacings.xl,
  },
  cancelButton: {
    flex: 1,
    padding: `${Spacings.md}px 0`,
    borderRadius: 16,
    border: `1px solid ${Colors.line}`,
    backgroundColor: 'transparent',
    fontSize: 14,
    fontFamily: 'Poppins-Medium, -apple-system, sans-serif',
    color: Colors.text,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  payButton: {
    flex: 2,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    padding: `${Spacings.md}px 0`,
    borderRadius: 16,
    backgroundColor: Colors.blue,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  payButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  payButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold, -apple-system, sans-serif',
    color: Colors.white,
  },
  cardIcon: {
    fontSize: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    border: `4px solid ${Colors.line}`,
    borderTop: `4px solid ${Colors.blue}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  buttonSpinner: {
    width: 20,
    height: 20,
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Thêm CSS animation cho spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}