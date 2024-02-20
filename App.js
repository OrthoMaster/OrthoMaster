
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { selectIsLoggedIn } from './src/reducers/auth';
import { checkToken, refreshUserSession, logout } from './src/actions/auth';

import { useSelector, useDispatch } from 'react-redux';
import checkVersion from 'react-native-store-version';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { AlertVersion } from './src/component/AlertVersion';
import { NotificationHandler } from './src/component/NotificationHandler';
import { appDefault, thuasne } from './src/AppMode';
import { selectModeValue } from './src/reducers/appModeReducer';
import * as Application from 'expo-application';
import { useQuery } from 'react-query';
import { getCurrentUser } from './src/services/UserService';
const prefix = Linking.createURL('/');

import * as Notifications from 'expo-notifications';


export default function App({ navigation }) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isEnabled = useSelector(state => state.auth.userCurrentSession?.enabled)

  const [isLoading, setIsLoading] = useState(true)
  const appMode = useSelector(selectModeValue)
  const dispatch = useDispatch()
  const [modalVersionIsVisible, setmodalVersionIsVisible] = useState(false)
  const currentUser = useQuery(["init", "GET", "user"], () => getCurrentUser(), {
    enabled: false
  })

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
    }
  };

  const init = async () => {
    try {
      currentUser.refetch().then(res => {
        if (res && res.data) {
          dispatch(refreshUserSession(res.data))
        } else {
          dispatch(logout())
        }
        setIsLoading(false)
      })
      const check = await checkVersion({
        version: Application.nativeApplicationVersion, // app local version
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
    // const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    //   console.log("App.js", response.notification.request.content.data);
    // });
    // return () => subscription.remove();
  }, []);


  if (isLoading)
    return <LoadingContent />


  return (
    <NavigationContainer linking={linking} onUnhandledAction={(action) => { console.log('App.js -> navigation container', action) }}
      theme={appMode == 'default' ? appDefault : thuasne}
    >

      {
        isLoggedIn && isEnabled == 1 ?
          <NotificationHandler>
            <AppTab />
          </NotificationHandler>
          : <AuthStack />
      }

      <AlertVersion isVisible={modalVersionIsVisible} onClose={() => {
        setmodalVersionIsVisible(false)
        console.log("Close app version modal");
        }} />
    </NavigationContainer>
  );
}


