import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';

import { AuthHome } from '../../views/auth/AuthHome';
import { LoginView } from '../../views/auth/LoginView';
import { ForgotView } from '../../views/auth/ForgotView';
import { RegisterView } from '../../views/auth/RegisterView';



const AuthStackNav = createStackNavigator();
export const AuthStack = () => {
  return (
    <AuthStackNav.Navigator
      id={"auth-stack" as undefined}
      initialRouteName='auth-init'
      screenOptions={{
        cardStyle: { backgroundColor: '#000' },
      }}>
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
        name="forgot"
        component={ForgotView}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

      <AuthStackNav.Screen
        name="register"
        component={RegisterView}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

    </AuthStackNav.Navigator>
  );
}