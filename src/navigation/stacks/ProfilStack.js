import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { AccountView } from '../../views/account/AccountView';
import { AccountProfile } from '../../views/account/menu/AccountProfile';
import { TeamManagerView } from '../../views/account/teamManager/TeamManagerView';

const ProfilStackNav = createStackNavigator();

export const ProfilStack = () => {
  return (
    <ProfilStackNav.Navigator
      initialRouteName='account-home'
    >
      <ProfilStackNav.Screen
        name="account-home"
        component={AccountView}
        options={{ headerShown: false }}
      />
      <ProfilStackNav.Screen
        name="account-profile"
        component={AccountProfile}
        options={{
          headerBackTitle: 'Retour',
          title: 'Mon profile'
        }}
      />
      <ProfilStackNav.Screen
        name="account-team-manager"
        component={TeamManagerView}
        options={{
          headerBackTitle: 'Retour',
          title: 'Mon équipe'
        }}
      /> 
    </ProfilStackNav.Navigator>
  );
}
