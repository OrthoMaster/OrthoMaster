import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { RequestsView } from '../../views/booking/requests/RequestsView';
import { RequestsHistoryView } from '../../views/booking/requests/RequestsHistoryView';
import { RequestDetailView } from '../../views/booking/requests/RequestDetailView';

const RequestsStackNav = createStackNavigator();

/**
 * Pile de l'onglet Demandes (expert) : demandes à traiter → historique ;
 * la fiche d'une demande s'ouvre en feuille basse depuis l'une ou l'autre liste.
 */
export const RequestsStack = () => {
  return (
    <RequestsStackNav.Navigator
      id={'requests-stack' as undefined}
      initialRouteName="requests-home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <RequestsStackNav.Screen name="requests-home" component={RequestsView} />
      <RequestsStackNav.Screen name="requests-history" component={RequestsHistoryView} />
      <RequestsStackNav.Screen
        name="request-detail"
        component={RequestDetailView}
        // Feuille basse : l'écran est transparent et anime lui-même sa feuille et son voile.
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
    </RequestsStackNav.Navigator>
  );
};