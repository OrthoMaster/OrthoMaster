import type { ReactNode } from 'react';
import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

/**
 * Paiement d'une demande de rendez-vous — version MOBILE (PaymentSheet de Stripe).
 * La version web est dans bookingPayment.web.tsx (Stripe Elements) : même interface,
 * pour que BookingCheckoutView reste commun aux deux.
 *
 * Le montant est seulement réservé (capture manuelle côté serveur) ; la confirmation
 * auprès du serveur reste dans BookingCheckoutView.
 */

export interface BookingPaymentRequest {
  clientSecret: string;
  publishableKey: string;
  billing: { name: string; email: string };
  /** « 1 200 € » : affiché par la version web. */
  amountLabel: string;
}

export type BookingPaymentOutcome =
  | { status: 'paid' }
  /** Fermé par l'utilisateur : pas de message. */
  | { status: 'canceled' }
  /**
   * stage « init » : le formulaire de paiement n'a pas pu s'ouvrir (rien n'a été tenté) ;
   * stage « payment » : la carte a été refusée.
   */
  | { status: 'failed'; stage: 'init' | 'payment'; title: string; message: string };

export const useBookingPayment = () => {
  const pay = async (request: BookingPaymentRequest): Promise<BookingPaymentOutcome> => {
    await initStripe({ publishableKey: request.publishableKey });

    const sheet = await initPaymentSheet({
      merchantDisplayName: 'OrthoMaster',
      paymentIntentClientSecret: request.clientSecret,
      defaultBillingDetails: request.billing,
    });
    if (sheet.error) {
      return { status: 'failed', stage: 'init', title: 'Paiement indisponible', message: sheet.error.message };
    }

    const paid = await presentPaymentSheet();
    if (paid.error) {
      // Fermeture volontaire : on reste sur le récapitulatif, sans message.
      if (paid.error.code === 'Canceled') return { status: 'canceled' };
      return { status: 'failed', stage: 'payment', title: 'Paiement refusé', message: paid.error.message };
    }

    return { status: 'paid' };
  };

  // Mobile : la feuille de paiement est native, rien à afficher dans l'écran.
  return { pay, element: null as ReactNode };
};
