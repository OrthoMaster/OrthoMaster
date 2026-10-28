import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { AgendaView } from '../../views/booking/agenda/AgendaView';
import { AgendaHistoryView } from '../../views/booking/agenda/AgendaHistoryView';
import { RequestDetailView } from '../../views/booking/requests/RequestDetailView';

const AgendaStackNav = createStackNavigator();

/**
 * Pile de l'onglet Agenda (expert) : séances à venir → rendez-vous passés.
 * La fiche est celle des demandes (même rendez-vous, état « Acceptée »).
 */
export const AgendaStack = () => {
  return (
    <AgendaStackNav.Navigator
      id={'agenda-stack' as undefined}
      initialRouteName="agenda-home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <AgendaStackNav.Screen name="agenda-home" component={AgendaView} />
      <AgendaStackNav.Screen name="agenda-history" component={AgendaHistoryView} />
      <AgendaStackNav.Screen
        name="request-detail"
        component={RequestDetailView}
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
    </AgendaStackNav.Navigator>
  );
};