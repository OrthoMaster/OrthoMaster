/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { CompanyView } from '../../views/company/CompanyView';
import { CompanyInfoView } from '../../views/company/CompanyInfoView';
import { PaymentMethodView } from '../../views/company/PaymentMethodView';
import { AttachMemberView } from '../../views/company/AttachMemberView';

const CompanyStackNav = createStackNavigator();
export const CompanyStack = () => {
  return (
    <CompanyStackNav.Navigator
      id={"company-stack" as undefined}
      initialRouteName='company-view'
    >
      <CompanyStackNav.Screen
        name="company-view"
        component={CompanyView}
        options={{ headerShown: false }}
      />

      <CompanyStackNav.Screen
        name="company-info"
        component={CompanyInfoView}
        options={{ headerShown: false }}
      />

      <CompanyStackNav.Screen
        name="payment-method"
        component={PaymentMethodView}
        options={{ headerShown: false }}
      />

      <CompanyStackNav.Screen
        name="attach-member-view"
        component={AttachMemberView}
        options={{ headerShown: false }}
      />

    </CompanyStackNav.Navigator>
  );
}
