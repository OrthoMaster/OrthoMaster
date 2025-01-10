
import React, { useEffect, useRef, useState } from 'react';
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

export default function App({ navigation }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showInitialConfigForm, setShowInitialConfigForm] = useState(false)
  const queryCli = useQueryClient()
  const { data: user, ...userQuery } = useGetUser()
  const nav = useRef()

  const userOffices = useQuery("user-offices", () => getUserAttachedOffices({ userId: user.id_user }), {
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
    <NavigationContainer ref={nav}>
      {
        user ?
          displayView()
          : <AuthStack />
      }
    </NavigationContainer>
  );
}


