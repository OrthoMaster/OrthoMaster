import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { AppointmentsView } from '../../views/booking/appointments/AppointmentsView';
import { AppointmentsHistoryView } from '../../views/booking/appointments/AppointmentsHistoryView';
import { AppointmentDetailView } from '../../views/booking/appointments/AppointmentDetailView';

const AppointmentsStackNav = createStackNavigator();

/**
 * Pile de l'onglet Rendez-vous (utilisateur) : en attente et à venir → historique ;
 * la fiche d'un rendez-vous s'ouvre en feuille basse depuis l'une ou l'autre liste.
 */
export const AppointmentsStack = () => {
  return (
    <AppointmentsStackNav.Navigator
      id={'appointments-stack' as undefined}
      initialRouteName="appointments-home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <AppointmentsStackNav.Screen name="appointments-home" component={AppointmentsView} />
      <AppointmentsStackNav.Screen name="appointments-history" component={AppointmentsHistoryView} />
      <AppointmentsStackNav.Screen
        name="appointment-detail"
        component={AppointmentDetailView}
        // Feuille basse : l'écran est transparent et anime lui-même sa feuille et son voile.
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
    </AppointmentsStackNav.Navigator>
  );
};