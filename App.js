
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { selectIsLoggedIn, selectIsLoading, selectUserCurrentSession } from './src/reducers/auth';
import { checkToken } from './src/actions/auth';

import { useSelector, useDispatch } from 'react-redux';
import checkVersion from 'react-native-store-version';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { AlertVersion } from './src/component/AlertVersion';
import { NotificationHandler } from './src/component/NotificationHandler';
import { appDefault, thuasne } from './src/AppMode';
import { selectModeValue } from './src/reducers/appModeReducer';
const prefix = Linking.createURL('/');

export default function App({ navigation }) {

  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isLoading = useSelector(selectIsLoading)
  const user = useSelector(selectUserCurrentSession)
  const appMode = useSelector(selectModeValue)
  const dispatch = useDispatch()
  const [modalVersionIsVisible, setmodalVersionIsVisible] = useState(false)

  const url = Linking.useURL()

  useEffect(() => {
    if (url) {
      const { hostname } = Linking.parse(url);
      if (isLoggedIn == true && (hostname == "activate" || hostname == 'create')) {
        Alert.alert('Lien introuvable', "Le lien que vous essayez d'ouvrir n'est pas accessible. Vérifiez d'être déconnecté de la plateforme avant d'ouvrir le lien.")
      }
    }
  }, [url])

  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        'auth-account-activate': {
          path: 'activate/user/:user_id/token/:token',
          parse: {
            user_id: (user_id) => user_id,
            token: (token) => token,
          },
        }
      },
    },
  };

  const init = async () => {
    try {
      dispatch(checkToken())

      const check = await checkVersion({
        version: Constants.manifest.version, // app local version
        //version: '1.1.0', // app local version
        iosStoreURL: 'https://apps.apple.com/us/app/orthomaster/id1644851864',
        androidStoreURL: 'https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster&pli=1',
        country: 'jp', // default value is 'jp'
      });
      if (check.result === 'new') {
        setmodalVersionIsVisible(true)
      }
    } catch (e) {//
      Alert.alert('Oups...', "Nous n'arrivons pas à accéder à internet.")
    }
  };

  useEffect(() => {
    init();
  }, []);


  if (isLoading)
    return <LoadingContent />

  return (
    <NavigationContainer linking={linking} onUnhandledAction={(action) => { console.log('App.js -> navigation container', action) }}
      theme={appMode == 'default' ? appDefault : thuasne}
    >
      {
        isLoggedIn && user?.enabled == 1 ?
          <NotificationHandler>
            <AppTab />
          </NotificationHandler>
          : <AuthStack />
      }

      <AlertVersion isVisible={modalVersionIsVisible} onClose={() => setmodalVersionIsVisible(false)} />
    </NavigationContainer>
  );
}


