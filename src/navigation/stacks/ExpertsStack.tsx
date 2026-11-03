import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Colors from '../../../constants/Colors';
import { CONSULT_COLOR } from '../../views/booking/bookingKinds';

import { BookingChoiceView } from '../../views/booking/experts/BookingChoiceView';
import { ExpertsListView } from '../../views/booking/experts/ExpertsListView';
import { ConsultationRequestView } from '../../views/booking/experts/ConsultationRequestView';
import { ExpertProfileView } from '../../views/booking/experts/ExpertProfileView';
import { OfferDetailView } from '../../views/booking/experts/OfferDetailView';
import { BookingCheckoutView } from '../../views/booking/experts/BookingCheckoutView';
import { ConversationView } from '../../views/booking/messages/ConversationView';

const ExpertsStackNav = createStackNavigator();

/**
 * Parcours Consultation ouvert dans la pile : liste des experts en mode consultation,
 * demande de consultation ou son récapitulatif.
 */
const isConsultationFlow = (routes: any[] | undefined): boolean =>
  (routes ?? []).some(
    (r) => r.name === 'consultation-request' || r.params?.purpose === 'consultation' || !!r.params?.consultation
  );

/**
 * Pile de l'onglet Experts (utilisateur) : choix Thèmes / Consultation (v3) →
 * Thèmes : liste Experts | Thèmes → profil … ; Consultation : experts qui la proposent →
 * demande (sujet, durée, horaire) → récapitulatif.
 *
 * Avant v3 : liste → profil en feuille basse → thème
 * (détails et calendrier des demi-journées sur le même écran) → récapitulatif et paiement
 * en feuille basse.
 * Le retour remonte d'abord dans cette pile avant de sortir de l'espace rendez-vous.
 */
export const ExpertsStack = ({ navigation, route }) => {
  // Couleur de l'onglet (mobile et web) : violet pendant le parcours Consultation, bleu sinon.
  // L'état de la pile n'est pas lisible depuis les options de l'onglet : on le suit ici.
  const consultation = React.useRef(false);
  const applyFlow = (routes: any[] | undefined) => {
    const next = isConsultationFlow(routes);
    if (next === consultation.current) return;
    consultation.current = next;
    navigation.setOptions({ tabBarActiveTintColor: next ? CONSULT_COLOR : Colors.lblueDark });
  };
  const followFlow = (e: any) => applyFlow(e.data?.state?.routes);

  // Lien direct (web) : la pile démarre déjà dans le parcours Consultation.
  React.useEffect(() => {
    applyFlow(route?.state?.routes);
  }, []);

  return (
    <ExpertsStackNav.Navigator
      id={'experts-stack' as undefined}
      initialRouteName="booking-choice"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      screenListeners={{ state: followFlow }}
    >
      <ExpertsStackNav.Screen name="booking-choice" component={BookingChoiceView} />
      <ExpertsStackNav.Screen name="experts-list" component={ExpertsListView} />
      <ExpertsStackNav.Screen name="consultation-request" component={ConsultationRequestView} />
      <ExpertsStackNav.Screen
        name="expert-profile"
        component={ExpertProfileView}
        // Feuille basse : l'écran est transparent et anime lui-même sa feuille et son voile.
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
      <ExpertsStackNav.Screen
        name="expert-offer"
        component={OfferDetailView}
        // Monte depuis le bas, par-dessus la feuille du profil : on y revient en le refermant.
        // Geste désactivé : un glissement vertical dans le calendrier ne doit pas fermer l'écran.
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <ExpertsStackNav.Screen
        name="expert-checkout"
        component={BookingCheckoutView}
        // Même principe que le profil : la feuille anime elle-même son entrée et sa sortie.
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
      {/* « Échanger avec l'expert » depuis un thème : on revient au thème en fermant la conversation. */}
      <ExpertsStackNav.Screen name="conversation" component={ConversationView} />
    </ExpertsStackNav.Navigator>
  );
};