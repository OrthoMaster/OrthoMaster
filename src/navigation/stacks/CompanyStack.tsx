/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { CompanyView } from '../../views/company/CompanyView';
import { CompanyInfoView } from '../../views/company/CompanyInfoView';
import { PaymentMethodView } from '../../views/company/PaymentMethodView';
import { AttachMemberView } from '../../views/company/AttachMemberView';
import { SelectPackageView } from '../../views/company/SelectPackageView';
import { PreviewProCartView } from '../../views/company/PreviewProCartView';
import { ContractView } from '../../views/contract/ContractView';


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

      <CompanyStackNav.Screen
        name="select-package-view"
        component={SelectPackageView}
        options={{ headerShown: false }}
      />

      <CompanyStackNav.Screen
        name="preview-pro-cart-view"
        component={PreviewProCartView}
        options={{ headerShown: false }}
      />

      <CompanyStackNav.Screen
        name="contract-view"
        component={ContractView}
        options={{
          headerShown: false,
        }}
      />

    </CompanyStackNav.Navigator>
  );
}
