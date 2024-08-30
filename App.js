
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from 'react-query';
import { Alert } from 'react-native';

import { selectDisplayIntro, selectIsLoggedIn } from './src/reducers/auth';
import { refreshUserSession, logout, startIntro, stopIntro } from './src/actions/auth';
import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { NotificationHandler } from './src/component/NotificationHandler';
import { appDefault, thuasne } from './src/AppMode';
import { selectModeValue } from './src/reducers/appModeReducer';
import { getCurrentUser } from './src/services/UserService';
import { IntroView } from './src/views/intro/IntroView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InitialConfigForm } from './src/views/initialConfigForm/InitialConfigForm';
import { getUserAttachedOffices } from './src/services/OfficeService';
const prefix = Linking.createURL('/');


export default function App({ navigation }) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isEnabled = useSelector(state => state.auth.userCurrentSession?.enabled)
  const displayIntro = useSelector(selectDisplayIntro)
  const [showInitialConfigForm, setShowInitialConfigForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const appMode = useSelector(selectModeValue)
  const dispatch = useDispatch()
  const queryCli = useQueryClient()
  const currentUser = useQuery(["current-user"], () => getCurrentUser(), {
    enabled: false
  })
  useQuery("user-offices", () => getUserAttachedOffices({ userId: currentUser.data.id_user }), {
    enabled: currentUser.isSuccess,
    onSuccess: async offices => {
      const displayInitialConfigForm = await AsyncStorage.getItem("initial-conf-slider-displayed")
      
      if (!displayInitialConfigForm &&
        offices && Array.isArray(offices) && offices.length == 0) {
        setShowInitialConfigForm(true)
      }

    }
  })

  const url = Linking.useURL()
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

  const retreiveSession = async () => {
    return await new Promise((resolve, reject) => {
      currentUser.refetch().then(res => {
        if (res && res.data) {
          dispatch(refreshUserSession(res.data))
        } else {
          dispatch(logout())
        }
        resolve(res.data)
      })

    })
  }


  useEffect(() => {
    const init = async () => {
      await retreiveSession();
      const displayIntro = await AsyncStorage.getItem("intro-slider-displayed")

      if (!displayIntro) {
        dispatch(startIntro())
      }

      setIsLoading(false)
    }
    init()
  }, []);


  useEffect(() => {
    if (url) {
      const { hostname } = Linking.parse(url);
      if (isLoggedIn == true && (hostname == "activate" || hostname == 'create')) {
        Alert.alert('Lien introuvable', "Le lien que vous essayez d'ouvrir n'est pas accessible. Vérifiez d'être déconnecté de la plateforme avant d'ouvrir le lien.")
      }
    }
  }, [url])

  if (isLoading)
    return <LoadingContent />


  return (
    <NavigationContainer linking={linking} onUnhandledAction={(action) => { console.log('App.js -> navigation container', action) }}
      theme={appMode == 'default' ? appDefault : thuasne}
    >

      {
        isLoggedIn && isEnabled == 1 ?
          displayIntro ?
            <IntroView onClose={() => {
              dispatch(stopIntro())
            }} />
            :
            <NotificationHandler>
              <AppTab />
            </NotificationHandler>
          : <AuthStack />
      }

      {
        showInitialConfigForm &&
        <InitialConfigForm onFinish={() => {
          AsyncStorage.setItem("initial-conf-slider-displayed", "true")
          queryCli.invalidateQueries({ queryKey: ['current-user'] })
          setShowInitialConfigForm(false)
        }} />
      }

    </NavigationContainer>
  );
}


