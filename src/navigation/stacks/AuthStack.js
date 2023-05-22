import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { LoginView } from '../../views/auth/LoginView';
import { ResetPassword } from '../../views/auth/ResetPassword';
import { AuthHome } from '../../views/auth/AuthHome';

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
        name="auth-reset-password"
        component={ResetPassword}
        options={{
          headerBackTitle: 'retour',
          headerTitle: 'Mot de passe oublié'
        }}
      />

    </AuthStackNav.Navigator>
  );
}