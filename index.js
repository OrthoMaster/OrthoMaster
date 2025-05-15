import React from 'react';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import { Provider } from 'react-redux'

import { setupGlobalErrorHandling } from './src/utils/ErrorHandler';
import { MyQueryProvider } from './src/component/MyQueryProvider';

import { store } from './src/store';
import { ErrorBoundary } from './src/component/errorHandler/ErrorBoundary';
import App from './App';

setupGlobalErrorHandling()

const WrapApp = () => (
  <Provider store={store}>
    <ErrorBoundary>
      <MyQueryProvider>
        <App />
      </MyQueryProvider>
    </ErrorBoundary>
  </Provider>
);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(WrapApp);
