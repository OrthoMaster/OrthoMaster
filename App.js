
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQuery, useQueryClient } from 'react-query';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { getUserAttachedOffices } from './src/services/OfficeService';
import { LoadingContent } from './src/component/LoadingContent';
import { NotificationHandler } from './src/component/NotificationHandler';
import { InitialConfigForm } from './src/views/initialConfigForm/InitialConfigForm';
import { IntroView } from './src/views/intro/IntroView';
import { useGetUser } from './src/hooks/useGetUser.hook';
import { View } from 'react-native';


export default function App({ navigation }) {
  const [showInitialConfigForm, setShowInitialConfigForm] = useState(false)
  const [displayIntro, setDisplayIntro] = useState(false)
  const queryCli = useQueryClient()
  const [initPhase, setInitPhase] = useState(true)
  const { data: user, ...userQuery } = useGetUser()

  const userOffices = useQuery("user-offices", () => getUserAttachedOffices({ userId: user.id_user }), {
    enabled: userQuery.isSuccess && user != null
  })

  useEffect(() => {
    if (userQuery.isSuccess) {
      if (user != null) {
        if (userOffices.data && Array.isArray(userOffices.data) && userOffices.data.length == 0) {
          AsyncStorage.getItem("initial-conf-slider-displayed")
            .then(displayInitialConfigForm => {
              if (!displayInitialConfigForm)
                setShowInitialConfigForm(true)
            })
        }
      }
      setInitPhase(false)
    }
  }, [user, userOffices.data])




  useEffect(() => {
    AsyncStorage.getItem("intro-slider-displayed")
      .then(displayIntro => {
        if (!displayIntro) {
          setDisplayIntro(true)
        }
      })
  }, [])


  const displayView = () => {
    if (showInitialConfigForm) {
      return <InitialConfigForm onFinish={() => {
        AsyncStorage.setItem("initial-conf-slider-displayed", "true")
        queryCli.invalidateQueries({ queryKey: ['current-user'] })
        setShowInitialConfigForm(false)
      }} />
    }
    if (showInitialConfigForm == false)
      return <NotificationHandler>
        <AppTab />
      </NotificationHandler>
  }


  if (initPhase) {
    return <LoadingContent />
  }


  return (
    <NavigationContainer >
      {
        user ?
          displayView()
          : <AuthStack />
      }
      {
        (user && (displayIntro && !showInitialConfigForm)) &&
        <View style={{
          position: 'absolute',
          height: '100%',
          backgroundColor: '#fff'
        }}>

          <IntroView onClose={() => {
            setDisplayIntro(false)
          }} />
        </View>
      }
    </NavigationContainer>
  );
}


