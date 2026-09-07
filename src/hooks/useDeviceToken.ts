/**
 * Maintient à jour le jeton de notification de l'appareil.
 *
 * Le jeton n'est délivré qu'une fois l'autorisation accordée, et il peut
 * changer par la suite : réinstallation, restauration de sauvegarde, ou
 * rotation décidée par le service de notification. Il est donc revérifié
 * à chaque retour dans l'application, et un écouteur signale les rotations
 * survenues pendant que l'application est ouverte.
 *
 * L'envoi n'a lieu que lorsque le jeton diffère du dernier transmis.
 */
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { syncDeviceToken, sendError } from '../services/v2/AuthService';

/** Dernier jeton transmis au serveur */
const SENT_TOKEN_KEY = '@device-token-sent';

/** Identifiant de l'appareil, figé au premier lancement */
const DEVICE_ID_KEY = '@device-id';

const TAG = 'device-token';

/**
 * Identifiant stable de l'appareil. Les identifiants système ne sont pas
 * toujours disponibles : le repli est généré une seule fois puis conservé,
 * sans quoi chaque appel créerait un nouvel enregistrement.
 */
async function resolveDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (stored) return stored;

  const deviceId =
    Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;

  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);

  return deviceId;
}

export function useDeviceToken(isAuthenticated: boolean) {
  const isSyncingRef = useRef(false);

  const sync = useCallback(async (token?: string) => {
    if (Platform.OS === 'web' || isSyncingRef.current) return;

    isSyncingRef.current = true;

    try {
      // Sans autorisation, aucun jeton n'est délivré
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') return;

      const value = token ?? (
        await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        })
      ).data;

      if (!value) return;

      // Inutile de renvoyer un jeton déjà connu du serveur
      const lastSent = await AsyncStorage.getItem(SENT_TOKEN_KEY);

      if (lastSent === value) return;

      const deviceId = await resolveDeviceId();

      const ok = await syncDeviceToken({
        fcm_token: value,
        device_id: deviceId,
        device_type: Device.osName === 'iOS' ? 'ios' : 'android',
      });

      if (ok) {
        await AsyncStorage.setItem(SENT_TOKEN_KEY, value);
      }
    } catch (error) {
      sendError(TAG, error);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  /** Vérification au démarrage et à chaque retour au premier plan */
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    sync();

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') sync();
    });

    return () => subscription.remove();
  }, [isAuthenticated, sync]);

  /** Rotation du jeton pendant que l'application est ouverte */
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    const subscription = Notifications.addPushTokenListener((token) => {
      sync(token.data);
    });

    return () => subscription.remove();
  }, [isAuthenticated, sync]);

  return { sync };
}

export default useDeviceToken;