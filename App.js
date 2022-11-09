import React, { useEffect, useState } from 'react';


import { NavigationContainer } from '@react-navigation/native';

import { useSelector, useDispatch } from 'react-redux'
import { checkUserConnection } from './src/actions/auth';

import { selectIsLoggedIn, selectIsLoading } from './src/reducers/auth';

import { restoreLocalConfigAsync } from './src/utils';
import checkVersion from 'react-native-store-version';

import {
  QueryClientProvider,
  QueryClient
} from 'react-query'



import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingView } from './src/views/LoadingView';
import { AlertVersion } from './src/component/AlertVersion';

import * as Sentry from 'sentry-expo';

const queryClient = new QueryClient()

export default function App({ navigation }) {

  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isLoading = useSelector(selectIsLoading)
  const dispatch = useDispatch()
  const [modalVersionIsVisible, setmodalVersionIsVisible] = useState(false)

  Sentry.init({
    dsn: 'https://cc1f41ec3e694b7e90ee08d4ed50c9fe@o4503926574153728.ingest.sentry.io/4503926602661888',
    enableInExpoDevelopment: true,
    debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  });

  useEffect(() => {
    const restoreData = async () => {

    }

    restoreData()
  }, []);


  useEffect(() => {
    const init = async () => {
      try {
        const config = await restoreLocalConfigAsync()
        const check = await checkVersion({
          version: '1.1.0', // app local version
          iosStoreURL: 'https://apps.apple.com/us/app/orthomaster/id1644851864',
          androidStoreURL: 'https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster&pli=1',
          country: 'jp', // default value is 'jp'
        });
        dispatch(checkUserConnection(config))
        if (check.result === 'new') {
          setmodalVersionIsVisible(true)
        }
      } catch (e) {
        console.log(e);
      }
    };

    init();
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
      <AlertVersion isVisible={modalVersionIsVisible} onClose={()=>setmodalVersionIsVisible(false)}/>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
