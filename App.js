
import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { useSelector, useDispatch } from 'react-redux'
import { checkUserConnection } from './src/actions/auth';

import { selectIsLoggedIn, selectIsLoading } from './src/reducers/auth';

import { restoreLocalConfigAsync } from './src/utils';
import checkVersion from 'react-native-store-version';
import Constants from 'expo-constants';
import {
  QueryClientProvider,
  QueryClient
} from 'react-query'

import { Alert } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingView } from './src/views/LoadingView';
import { AlertVersion } from './src/component/AlertVersion';
import { ErrorHandler } from './src/component/ErrorHandler';

import Bugsnag from '@bugsnag/expo';
Bugsnag.start();

const queryClient = new QueryClient()

export default function App({ navigation }) {

  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isLoading = useSelector(selectIsLoading)
  const dispatch = useDispatch()
  const [modalVersionIsVisible, setmodalVersionIsVisible] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const config = await restoreLocalConfigAsync()
        const check = await checkVersion({
          version: Constants.manifest.version, // app local version
          //version: '1.1.0', // app local version
          iosStoreURL: 'https://apps.apple.com/us/app/orthomaster/id1644851864',
          androidStoreURL: 'https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster&pli=1',
          country: 'jp', // default value is 'jp'
        });
        dispatch(checkUserConnection(config))
        if (check.result === 'new') {
          setmodalVersionIsVisible(true)
        }
      } catch (e) {
        Alert.alert('Oups...', "Nous n'arrivons pas à accéder à internet." )
        //throw e
      }
    };
    init();
  }, []);



  return (
    <ErrorHandler>
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
        <AlertVersion isVisible={modalVersionIsVisible} onClose={()=>setmodalVersionIsVisible(false)}/>
        </NavigationContainer>
      </QueryClientProvider>
    </ErrorHandler>
  );
}
