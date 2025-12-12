/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { ProfileView } from '../../views/profile/ProfileView';
import { ProfileInfoView } from '../../views/profile/ProfileInfoView';
import { ChangePasswordView } from '../../views/profile/ChangePasswordView';

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
        }}
      />

      <ProfileStackNav.Screen
        name="notification-list"
        component={NotificationView}
        options={{
          headerShown: false,
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
    </ProfileStackNav.Navigator>
  );
}
