// hooks/useGlobalNotification.ts
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import * as RootNavigation from '../navigation/RootNavigation';
import { getLastestNotification } from "../services/v2/AuthService";

export const useGlobalNotification = () => {
  const lastNotificationIdRef = useRef<string | null>(null);
  const allowedTypes = ['danger', 'success', 'warning'];

  const { data } = useQuery({
    queryKey: ['lastest-notification'],
    queryFn: getLastestNotification,
    refetchInterval: 1 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (data && data.success === true && data.data) {
      const latestNotif = data.data;

      const isFirstTime = lastNotificationIdRef.current === null;
      const isNewNotification = lastNotificationIdRef.current !== latestNotif.id;

      if (isFirstTime || isNewNotification) {
        if (!latestNotif.read_flg) {
          Toast.show({
            type: allowedTypes.includes(latestNotif.type) ? latestNotif.type : 'info',
            text1: latestNotif.title,
            text2: latestNotif.content,
            topOffset: 80,
            visibilityTime: 4000,
            onPress: () => {
              Toast.hide();
              RootNavigation.navigate('profile', {
                screen: 'notification-list'
              });
            }
          });
        }

        lastNotificationIdRef.current = latestNotif.id;
      }
    }
  }, [data]);
};