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

const queryClient = new QueryClient()

export default function App({ navigation }) {

  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isLoading = useSelector(selectIsLoading)
  const dispatch = useDispatch()
  LogBox.ignoreAllLogs();


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
