import React from 'react';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import { Provider } from 'react-redux'
import store from './src/store'

import App from './App';
const WrapApp = () => (
      <Provider store={store}>
        <App />
      </Provider>
    //document.getElementById('root')
  );

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(WrapApp);
