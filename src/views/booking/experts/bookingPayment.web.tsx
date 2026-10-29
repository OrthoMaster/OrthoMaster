import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/**
 * Paiement d'une demande de rendez-vous — version WEB (Stripe Elements, carte bancaire).
 * Même interface que bookingPayment.tsx (mobile, PaymentSheet) : BookingCheckoutView est commun.
 *
 * `pay()` ouvre une fenêtre de saisie de carte et se résout quand l'utilisateur a payé
 * ou fermé la fenêtre. Le PaymentIntent est en capture manuelle : après confirmation
 * il passe à « requires_capture », le montant est seulement réservé.
 */

export interface BookingPaymentRequest {
  clientSecret: string;
  publishableKey: string;
  billing: { name: string; email: string };
  /** « 1 200 € ». */
  amountLabel: string;
}

export type BookingPaymentOutcome =
  | { status: 'paid' }
  | { status: 'canceled' }
  | { status: 'failed'; stage: 'init' | 'payment'; title: string; message: string };

const ACCENT = Colors.lblue;
const ACCENT_DARK = Colors.lblueDark;

/** Une seule instance Stripe par clé publique, pour toute la session. */
const stripeByKey = new Map<string, Promise<Stripe | null>>();
const stripeFor = (key: string) => {
  if (!stripeByKey.has(key)) stripeByKey.set(key, loadStripe(key));
  return stripeByKey.get(key)!;
};

const CARD_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: Colors.text,
      fontFamily: 'Poppins-Regular, -apple-system, sans-serif',
      '::placeholder': { color: Colors.subtext },
    },
    invalid: { color: Colors.danger },
  },
};

const CardForm = ({
  request,
  onDone,
}: {
  request: BookingPaymentRequest;
  onDone: (outcome: BookingPaymentOutcome) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card || busy) return;

    setBusy(true);
    setError(null);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(request.clientSecret, {
        payment_method: { card, billing_details: request.billing },
      });

      // Carte refusée, saisie incomplète… : on reste dans la fenêtre pour corriger.
      if (stripeError) {
        setError(stripeError.message ?? 'Le paiement a échoué.');
        return;
      }
      if (paymentIntent && ['requires_capture', 'succeeded', 'processing'].includes(paymentIntent.status)) {
        onDone({ status: 'paid' });
        return;
      }
      setError('Le paiement n’a pas pu être autorisé. Réessayez ou utilisez une autre carte.');
    } catch (e: any) {
      setError(e?.message ?? 'Le paiement a échoué.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.body}>
      <Text style={styles.amountLabel}>Montant réservé sur votre carte</Text>
      <Text style={styles.amount}>{request.amountLabel}</Text>

      <Text style={styles.cardLabel}>Carte bancaire</Text>
      <View style={styles.cardBox}>
        <CardElement options={CARD_OPTIONS} />
      </View>

      {error ? (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={16} color={ACCENT_DARK} />
        <Text style={styles.noteText}>Débité seulement si l’expert accepte ; sinon, le montant est libéré.</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={({ hovered }: any) => [styles.button, styles.ghost, hovered && styles.ghostHovered]}
          onPress={() => onDone({ status: 'canceled' })}
          disabled={busy}
        >
          <Text style={styles.ghostText}>Annuler</Text>
        </Pressable>
        <Pressable
          style={({ hovered }: any) => [
            styles.button,
            styles.primary,
            hovered && styles.primaryHovered,
            (!stripe || busy) && styles.disabled,
          ]}
          onPress={submit}
          disabled={!stripe || busy}
        >
          {busy ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryText}>Payer {request.amountLabel}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export const useBookingPayment = () => {
  const [request, setRequest] = useState<BookingPaymentRequest | null>(null);
  const resolver = useRef<((outcome: BookingPaymentOutcome) => void) | null>(null);

  const finish = (outcome: BookingPaymentOutcome) => {
    resolver.current?.(outcome);
    resolver.current = null;
    setRequest(null);
  };

  const pay = (next: BookingPaymentRequest) =>
    new Promise<BookingPaymentOutcome>((resolve) => {
      if (!next.publishableKey) {
        resolve({
          status: 'failed',
          stage: 'init',
          title: 'Paiement indisponible',
          message: 'Le paiement en ligne n’est pas configuré.',
        });
        return;
      }
      resolver.current = resolve;
      setRequest(next);
    });

  const stripePromise = useMemo(() => (request ? stripeFor(request.publishableKey) : null), [request?.publishableKey]);

  const element = request ? (
    <Modal visible transparent animationType="fade" onRequestClose={() => finish({ status: 'canceled' })}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => finish({ status: 'canceled' })} />
        <View style={styles.dialog}>
          <View style={styles.head}>
            <Text style={styles.title}>Paiement sécurisé</Text>
            <Pressable onPress={() => finish({ status: 'canceled' })} accessibilityLabel="Fermer" hitSlop={8}>
              <Ionicons name="close" size={22} color={ACCENT_DARK} />
            </Pressable>
          </View>
          {stripePromise ? (
            <Elements stripe={stripePromise} options={{ locale: 'fr' }}>
              <CardForm request={request} onDone={finish} />
            </Elements>
          ) : null}
        </View>
      </View>
    </Modal>
  ) : null;

  return { pay, element };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  body: {
    padding: Spacings.lg,
    gap: Spacings.sm,
  },
  amountLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  amount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  cardLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  cardBox: {
    padding: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.danger,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    height: 48,
    paddingHorizontal: Spacings.lg,
    borderRadius: 999,
  },
  ghost: {
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  ghostHovered: {
    backgroundColor: Colors.grayLight,
  },
  ghostText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: ACCENT_DARK,
  },
  primary: {
    flex: 1,
    backgroundColor: ACCENT_DARK,
  },
  primaryHovered: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
});
