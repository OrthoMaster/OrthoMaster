import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FlashThemesView } from '../../views/flash/FlashThemesView';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { FlashCategoriesView } from '../../views/flash/FlashCategoriesView';
import { FlashSubcategoriesView } from '../../views/flash/FlashSubcategoriesView';


const FlashStackNav = createNativeStackNavigator();
export const FlashStack = () => {
  return (
    <FlashStackNav.Navigator initialRouteName='flash-themes'>
      <FlashStackNav.Screen
        name="flash-themes"
        component={FlashThemesView}
        options={{
          headerShown: false,
          //title: 'Flash orthopédie'
        }}
      />

      <FlashStackNav.Screen
        name="flash-categories"
        component={FlashCategoriesView}
        options={{
          headerShown: true,
          headerBackTitle: 'Retour'
          //title: 'Flash orthopédie'
        }}
      />

      <FlashStackNav.Screen
        name="flash-subcategories"
        component={FlashSubcategoriesView}
        options={{
          headerShown: true,
          headerBackTitle: 'Retour'
          //title: 'Flash orthopédie'
        }}
      />

      <FlashStackNav.Screen
        name="flash-content-viewer"
        component={ContentDisplayer}
        options={{
          headerShown: false
        }}
      />
    </FlashStackNav.Navigator>
  );
}