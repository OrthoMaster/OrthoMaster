import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductView } from '../../views/product/ProductView';


const ProductStackNav = createNativeStackNavigator();

export const ProductStack = () => {
  return (
    <ProductStackNav.Navigator
      initialRouteName='product-home'
    >
      <ProductStackNav.Screen
        name="product-home"
        component={ProductView}
        options={{ headerShown: false }}
      />

    </ProductStackNav.Navigator>
  );
}
