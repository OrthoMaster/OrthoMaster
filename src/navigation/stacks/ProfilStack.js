import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { AccountView } from '../../views/account/AccountView';
import { AccountProfile } from '../../views/account/menu/AccountProfile';
import { TeamManagerView } from '../../views/account/teamManager/TeamManagerView';
import { RegistrationView } from '../../views/account/menu/registrationForm/RegistrationView';

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
          title: 'Mon profile',
          headerBackTitleStyle:{ color: "#ffaf31"},
        }}
      />
      <ProfilStackNav.Screen
        name="account-team-manager"
        component={TeamManagerView}
        options={{
          headerBackTitle: 'Retour',
          title: 'Mon équipe',
          headerBackTitleStyle:{ color: "#ffaf31"}
        }}
      />

      <ProfilStackNav.Screen
        name="account-register-form"
        component={RegistrationView}
        options={{
          headerBackTitle: 'Retour',
          title: "Formulaire d'inscription",
          headerBackTitleStyle:{ color: "#ffaf31"}
        }}
      />
    </ProfilStackNav.Navigator>
  );
}
