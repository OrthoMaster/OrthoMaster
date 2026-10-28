import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ExpertiseHomeView } from '../../views/booking/expertise/ExpertiseHomeView';
import { ExpertiseOffersView } from '../../views/booking/expertise/ExpertiseOffersView';
import { ExpertiseOfferFormView } from '../../views/booking/expertise/ExpertiseOfferFormView';
import { ExpertiseAvailabilityView } from '../../views/booking/expertise/ExpertiseAvailabilityView';
import { ExpertiseProfileFormView } from '../../views/booking/expertise/ExpertiseProfileFormView';

const ExpertiseStackNav = createStackNavigator();

/**
 * Pile propre à l'onglet Expertise : le retour remonte d'abord dans cette pile,
 * et ne sort de l'espace rendez-vous qu'une fois revenu sur expertise-home.
 */
export const ExpertiseStack = () => {
  return (
    <ExpertiseStackNav.Navigator
      id={'expertise-stack' as undefined}
      initialRouteName="expertise-home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <ExpertiseStackNav.Screen name="expertise-home" component={ExpertiseHomeView} />

      <ExpertiseStackNav.Screen name="expertise-offers" component={ExpertiseOffersView} />
      <ExpertiseStackNav.Screen
        name="expertise-offer-form"
        component={ExpertiseOfferFormView}
        // Le formulaire monte depuis le bas : il se lit comme une saisie, pas comme une page de plus.
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
      />
      <ExpertiseStackNav.Screen name="expertise-availability" component={ExpertiseAvailabilityView} />
      <ExpertiseStackNav.Screen
        name="expertise-profile"
        component={ExpertiseProfileFormView}
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
      />
    </ExpertiseStackNav.Navigator>
  );
};