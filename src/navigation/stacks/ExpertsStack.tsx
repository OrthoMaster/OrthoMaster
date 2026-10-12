import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ExpertsListView } from '../../views/booking/experts/ExpertsListView';
import { ExpertProfileView } from '../../views/booking/experts/ExpertProfileView';
import { ExpertCalendarView } from '../../views/booking/experts/ExpertCalendarView';

const ExpertsStackNav = createStackNavigator();

/**
 * Pile de l'onglet Experts (utilisateur) : liste → profil et choix du thème → demi-journées.
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
      <ExpertsStackNav.Screen name="expert-profile" component={ExpertProfileView} />
      <ExpertsStackNav.Screen name="expert-calendar" component={ExpertCalendarView} />
    </ExpertsStackNav.Navigator>
  );
};