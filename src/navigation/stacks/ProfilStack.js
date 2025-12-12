import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { AccountView } from '../../views/account/AccountView';
import { AccountProfile } from '../../views/account/menu/AccountProfile';
import { TeamManagerView } from '../../views/account/office/OfficeManagerView';
import AddOfficeView from '../../views/account/office/AddOfficeView';
import { OfficeManagerView } from '../../views/account/office/OfficeManagerView';

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
          headerBackTitleStyle: { color: "#ffaf31" },
        }}
      />

      <ProfilStackNav.Screen
        name="account-add-office"
        component={AddOfficeView}
        options={{
          headerBackTitle: 'Retour',
          title: 'Ajouter un espace-pro',
          headerBackTitleStyle: { color: "#ffaf31" },
          cardStyle: {
            backgroundColor: '#fff'
          },
          headerStyle: {
            backgroundColor: '#fff'
          }
        }}
      />
      <ProfilStackNav.Screen
        name="account-office"
        component={OfficeManagerView}
        options={{
          headerBackTitle: 'Retour',
          headerBackTitleStyle: { color: "#ffaf31" },
          headerStyle: {
            backgroundColor: '#fff'
          }
        }}
      />

    </ProfilStackNav.Navigator>
  );
}
