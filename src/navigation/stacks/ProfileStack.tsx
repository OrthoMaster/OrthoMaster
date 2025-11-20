/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { ProfileView } from '../../views/profile/ProfileView';

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
        options={{ headerShown: false }}
      />
    </ProfileStackNav.Navigator>
  );
}
