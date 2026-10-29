import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { AgendaView } from '../../views/booking/agenda/AgendaView';
import { AgendaHistoryView } from '../../views/booking/agenda/AgendaHistoryView';
import { RequestDetailView } from '../../views/booking/requests/RequestDetailView';
import { AppointmentDetailView } from '../../views/booking/appointments/AppointmentDetailView';

const AgendaStackNav = createStackNavigator();

/** Feuille basse : l'écran est transparent et anime lui-même sa feuille et son voile. */
const SHEET_OPTIONS = {
  presentation: 'transparentModal' as const,
  animation: 'none' as const,
  cardStyle: { backgroundColor: 'transparent' },
  gestureEnabled: false,
};

/**
 * Pile de l'onglet Agenda (expert) : séances à venir, des deux côtés → rendez-vous passés.
 *
 * Deux fiches, selon le rôle de l'expert dans le rendez-vous :
 *  - request-detail     : il anime (un confrère a réservé) — fiche des demandes reçues ;
 *  - appointment-detail : il a réservé auprès d'un confrère — fiche de l'onglet Rendez-vous.
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
      <AgendaStackNav.Screen name="request-detail" component={RequestDetailView} options={SHEET_OPTIONS} />
      <AgendaStackNav.Screen name="appointment-detail" component={AppointmentDetailView} options={SHEET_OPTIONS} />
    </AgendaStackNav.Navigator>
  );
};
