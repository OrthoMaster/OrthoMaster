
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQuery, useQueryClient } from 'react-query';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { getUserAttachedOffices } from './src/services/OfficeService';
import { LoadingContent } from './src/component/LoadingContent';
import { NotificationHandler } from './src/component/NotificationHandler';
import { InitialConfigForm } from './src/views/initialConfigForm/InitialConfigForm';
import { useGetUser } from './src/hooks/useGetUser.hook';

import * as Linking from "expo-linking"
import { closeSession, getSessionId, startSession } from './src/services/SessionEventService';
const prefix = Linking.createURL('/');

export default function App({ navigation }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showInitialConfigForm, setShowInitialConfigForm] = useState(false)
  const queryCli = useQueryClient()
  const { data: user, ...userQuery } = useGetUser()
  const nav = useRef()
  const appState = useRef(AppState.currentState);

  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        'Accueil': {
          screens: {
            "home-home": {
              path: "open/content/:id"
            }
          }
        },
        'Médias': {
          screens: {
            'flash-media-home': {
              path: "open/media-preview/:id"
            }
          }
        }
      }
    }
  };

  const userOffices = useQuery({
    queryKey: ["user-offices"],
    queryFn: () => getUserAttachedOffices({ userId: user.id_user }),
    enabled: userQuery.isSuccess && user != null
})

const askEspaceProCreation = async () => {
  AsyncStorage.getItem("initial-conf-slider-displayed")
    .then(displayInitialConfigForm => {
      if (!displayInitialConfigForm) {
        setShowInitialConfigForm(true)
      }
      return
    })
}

useEffect(() => {
  if (userOffices.data && Array.isArray(userOffices.data) && userOffices.data.length == 0) {
    askEspaceProCreation()
  }
}, [userOffices.data])

useEffect(() => {
  if (!userQuery.isFetching && !userQuery.isLoading && userQuery.isFetched)
    setIsLoading(false)
}, [user, userQuery])

useEffect(() => {
  if (user && getSessionId() == null) {
    const userSessionHandling = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) &&
        nextAppState === "active") {
        startSession()
      } else if (appState.current == "active" && (nextAppState === "background" || nextAppState == "inactive")) {
        closeSession()
      }
      appState.current = nextAppState;
    });
    console.log("start session");

    startSession()
    return () => {
      userSessionHandling.remove();
    };
  }
}, [user])


const displayView = () => {
  if (showInitialConfigForm) {
    return <InitialConfigForm onFinish={() => {
      AsyncStorage.setItem("initial-conf-slider-displayed", "true")
      queryCli.invalidateQueries({ queryKey: ['current-user'] })
      setShowInitialConfigForm(false)
    }} />
  }
  if (showInitialConfigForm == false) {
    return <NotificationHandler>
      <AppTab />
    </NotificationHandler>
  }
}

if (isLoading) {
  return <LoadingContent />
}

return (
  <NavigationContainer linking={linking} ref={nav}>
    {
      user ?
        displayView()
        : <AuthStack />
    }
  </NavigationContainer>
);
}


