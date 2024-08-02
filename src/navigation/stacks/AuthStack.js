import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { LoginView } from '../../views/auth/LoginView';
import { AuthHome } from '../../views/auth/AuthHome';
import { ActivateAccountView } from '../../views/auth/InitAccount';


const AuthStackNav = createStackNavigator();
export const AuthStack = () => {
  return (
    <AuthStackNav.Navigator initialRouteName='auth-init'>
      <AuthStackNav.Screen
        name="auth-init"
        component={AuthHome}
        options={{
          headerShown: false
        }}
      />
      <AuthStackNav.Screen
        name="auth-home"
        component={LoginView}
        options={{
          headerShown: false
        }}
      />

      <AuthStackNav.Screen
        name="auth-account-activate"
        component={ActivateAccountView}
        options={{
          headerShown: false
        }}
        initialParams={{ id_user: null, link: null }}
      />
    </AuthStackNav.Navigator>
  );
}