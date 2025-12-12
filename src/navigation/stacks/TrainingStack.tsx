/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { TrainingListView } from "../../views/training/TrainingListView";
import { TrainingView } from '../../views/training/TrainingView';

import { ContractView } from '../../views/contract/ContractView';

const TrainingStackNav = createStackNavigator()
export const TrainingStack = () => {
  return (
    <TrainingStackNav.Navigator
      id={"training-stack" as undefined}
      // initialRouteName='training-list'
      initialRouteName='contract-view'
    >
      <TrainingStackNav.Screen
        name="training-list"
        component={TrainingListView}
        options={{
          headerShown: false,
        }}
      />
      <TrainingStackNav.Screen
        name="training-view"
        component={TrainingView}
        options={{
          headerShown: false,
        }}
      />


      <TrainingStackNav.Screen
        name="contract-view"
        component={ContractView}
        options={{
          headerShown: false,
        }}
      />
      
    </TrainingStackNav.Navigator>
  );
}