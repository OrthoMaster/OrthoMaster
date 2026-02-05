/** @author Francis */
import React from 'react'
import { Platform } from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';

import { ProfileView } from '../../views/profile/ProfileView';
import { ProfileInfoView } from '../../views/profile/ProfileInfoView';
import { ChangePasswordView } from '../../views/profile/ChangePasswordView';
import { SettingsView } from '../../views/profile/SettingsView';
import { DocumentView } from '../../views/profile/DocumentView';

import { NewCompanyView } from '../../views/company/NewCompanyView';
import { NotificationView } from '../../views/notification/NotificationView';

const ProfileStackNav = createStackNavigator();
export const ProfileStack = () => {
  return (
    <ProfileStackNav.Navigator
      id={"profile-stack" as undefined}
      initialRouteName='profile-view'
    >
      <ProfileStackNav.Screen
        name="profile-view"
        component={ProfileView}
        options={{
          headerShown: false,
          animation: 'slide_from_left',
        }}
      />

      <ProfileStackNav.Screen
        name="company-new"
        component={NewCompanyView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      <ProfileStackNav.Screen
        name="notification-list"
        component={NotificationView}
        options={{
          headerShown: false,
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
          animation: 'slide_from_right',
        }}
      />

      <ProfileStackNav.Screen
        name="profile-info"
        component={ProfileInfoView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      <ProfileStackNav.Screen
        name="change-password"
        component={ChangePasswordView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      <ProfileStackNav.Screen
        name="settings-view"
        component={SettingsView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      <ProfileStackNav.Screen
        name="document-view"
        component={DocumentView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

    </ProfileStackNav.Navigator>
  );
}
