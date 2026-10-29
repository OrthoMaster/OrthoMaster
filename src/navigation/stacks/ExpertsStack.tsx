import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ExpertsListView } from '../../views/booking/experts/ExpertsListView';
import { ExpertProfileView } from '../../views/booking/experts/ExpertProfileView';
import { OfferDetailView } from '../../views/booking/experts/OfferDetailView';
import { BookingCheckoutView } from '../../views/booking/experts/BookingCheckoutView';
import { ConversationView } from '../../views/booking/messages/ConversationView';

const ExpertsStackNav = createStackNavigator();

/**
 * Pile de l'onglet Experts (utilisateur) : liste → profil en feuille basse → thème
 * (détails et calendrier des demi-journées sur le même écran) → récapitulatif et paiement
 * en feuille basse.
 * Le retour remonte d'abord dans cette pile avant de sortir de l'espace rendez-vous.
 */
export const ExpertsStack = () => {
  return (
    <ExpertsStackNav.Navigator
      id={'experts-stack' as undefined}
      initialRouteName="experts-list"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <ExpertsStackNav.Screen name="experts-list" component={ExpertsListView} />
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