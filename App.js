import React, { useEffect } from 'react';


import { NavigationContainer } from '@react-navigation/native';

import { useSelector, useDispatch } from 'react-redux'
import { checkUserConnection } from './src/actions/auth';

import { selectIsLoggedIn, selectIsLoading } from './src/reducers/auth';

import { restoreLocalConfigAsync } from './src/utils';

import {
  QueryClientProvider,
  QueryClient
} from 'react-query'



import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingView } from './src/views/LoadingView';

import { LogBox } from 'react-native';
import * as Sentry from 'sentry-expo';

const queryClient = new QueryClient()

export default function App({ navigation }) {

  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isLoading = useSelector(selectIsLoading)
  const dispatch = useDispatch()
  //LogBox.ignoreAllLogs();

  Sentry.init({
    dsn: 'https://cc1f41ec3e694b7e90ee08d4ed50c9fe@o4503926574153728.ingest.sentry.io/4503926602661888',
    enableInExpoDevelopment: true,
    debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  });

  useEffect(() => {
    const restoreData = async () => {
      const config = await restoreLocalConfigAsync()
      dispatch(checkUserConnection(config))
    }

    restoreData()
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>

        {
          isLoggedIn ? (
            <AppTab />
          ) : isLoading
            ? (
              <LoadingView />
            ) : (
              <AuthStack />
            )}
      </NavigationContainer>
    </QueryClientProvider>
  );
}
