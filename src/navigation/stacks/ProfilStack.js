import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountView } from '../../views/account/AccountView';
import { AccountProfile } from '../../views/account/menu/AccountProfile';

const ProfilStackNav = createNativeStackNavigator();

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
    </ProfilStackNav.Navigator>
  );
}
