
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation, useNavigationContainerRef } from '@react-navigation/native';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { getUserAttachedOffices } from './src/services/OfficeService';
import { LoadingContent } from './src/component/LoadingContent';
import { NotificationHandler } from './src/component/NotificationHandler';
import { InitialConfigForm } from './src/views/initialConfigForm/InitialConfigForm';
import { useGetUser } from './src/hooks/useGetUser.hook';
import { getCurrentDate } from './src/futils';
import { closeSession, getSessionId, saveEvent, startSession } from './src/services/SessionEventService';
import { SessionEventScreen } from './src/utils/myTypes';
import { useSessionEventFlusher } from './src/hooks/useSessionEventFlusher';
import { navigationRef } from './src/navigation/RootNavigation';

import CaptureGuard from './src/component/captureGuard/useCaptureGuard';

export default function App({ navigation }) {
  useSessionEventFlusher()

  const [isLoading, setIsLoading] = useState(true)
  const [showInitialConfigForm, setShowInitialConfigForm] = useState(false)
  const queryCli = useQueryClient()
  const { data: user, ...userQuery } = useGetUser()
  const appState = useRef(AppState.currentState);

  const routeNameRef = React.useRef<string | undefined>(null);
  const [datePageOpened, setDatePageOpened] = useState(getCurrentDate())
  // let datePageOpened = getCurrentDate()

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
    enabled: userQuery.isSuccess && userQuery.isFetched
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
    if (user)
      AsyncStorage.setItem('user', JSON.stringify(user))
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
        <CaptureGuard>
          <AppTab />
        </CaptureGuard>
      </NotificationHandler>
    }
  }

  if (isLoading) {
    return <LoadingContent state={true} onRetry={() => { }} />
  }

  return (
    <NavigationContainer linking={linking}
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        setDatePageOpened(getCurrentDate())
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;
        const saveSessionScreenView = (sessionData: SessionEventScreen) => {
          // Your implementation of analytics goes here!
          saveEvent("screen_view", sessionData)
        };

        if (previousRouteName !== currentRouteName) {
          // Replace the line below to add the tracker from a mobile analytics SDK
          saveSessionScreenView({
            screen_name: previousRouteName,
            started_at: datePageOpened,
            ended_at: getCurrentDate()
          });
        }
        // Save the current route name for later comparison
        routeNameRef.current = currentRouteName;
        setDatePageOpened(getCurrentDate())
      }}
    >
      {user
        ?
        displayView()
        :
        <AuthStack />
      }
    </NavigationContainer>
  );
}


