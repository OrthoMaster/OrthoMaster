/**
 * Propose à l'utilisateur de suivre le sujet d'un contenu au moment
 * où il quitte l'écran.
 *
 * La question n'est posée que si le sujet n'est pas déjà suivi et si
 * l'utilisateur n'a jamais refusé : un refus est définitif et vaut pour
 * l'ensemble de l'application.
 *
 * Sur mobile, l'autorisation système conditionne l'action proposée :
 * une autorisation refusée renvoie vers les réglages, et le suivi est
 * alors enregistré dès le retour dans l'application.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { toggleTopic } from '../services/v2/FavouriteService';
import { sendError } from '../services/v2/AuthService';

import useDeviceToken from './useDeviceToken';

/** Un refus est conservé pour toute l'application, tous sujets confondus */
const DECLINED_KEY = '@topic-follow-declined';

export type PermissionState = 'granted' | 'undetermined' | 'denied' | 'unknown';

type Topic = { id: number; name: string } | null | undefined;

type Options = {
  topic: Topic;
  /** Sujet déjà suivi : la question n'a pas lieu d'être */
  alreadyFollowed: boolean;
  /** Sortie de l'écran, appelée une fois la question réglée */
  onLeave: () => void;
  /** Étiquette utilisée pour la remontée d'erreur */
  tag: string;
};

export function useTopicFollowPrompt({ topic, alreadyFollowed, onLeave, tag }: Options) {
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('unknown');

  const { sync: syncDeviceToken } = useDeviceToken(false);

  /** Refus enregistré sur l'appareil ; null tant qu'il n'est pas lu */
  const declinedRef = useRef<boolean | null>(null);

  /** L'utilisateur vient d'être envoyé dans les réglages du système */
  const awaitingSettingsRef = useRef(false);

  const visibleRef = useRef(false);
  visibleRef.current = visible;

  useEffect(() => {
    let isActive = true;

    AsyncStorage.getItem(DECLINED_KEY)
      .then((value) => {
        if (isActive) declinedRef.current = value === '1';
      })
      .catch(() => {
        if (isActive) declinedRef.current = false;
      });

    return () => {
      isActive = false;
    };
  }, []);

  /** Suit le sujet, puis referme la boîte et quitte l'écran */
  const follow = useCallback(async () => {
    if (!topic) {
      setVisible(false);
      onLeave();
      return;
    }

    setIsSubmitting(true);

    try {
      await toggleTopic(topic.id);
    } catch (error) {
      sendError(tag, error);
    } finally {
      setIsSubmitting(false);
      setVisible(false);
      onLeave();
    }
  }, [topic, onLeave, tag]);

  /**
   * Retour dans l'application : l'autorisation a pu changer entre-temps.
   * Si elle vient d'être accordée, la démarche de l'utilisateur vaut accord.
   */
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (next) => {
      if (next !== 'active' || !visibleRef.current) return;

      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status as PermissionState);

        if (status === 'granted' && awaitingSettingsRef.current) {
          awaitingSettingsRef.current = false;
          syncDeviceToken();
          follow();
        }
      } catch (error) {
        // L'état reste inchangé : la boîte conserve son action courante
      }
    });

    return () => subscription.remove();
  }, [follow, syncDeviceToken]);

  /**
   * Ferme l'écran, ou pose d'abord la question si elle est pertinente.
   */
  const requestLeave = useCallback(async () => {
    if (!topic || alreadyFollowed || declinedRef.current !== false) {
      onLeave();
      return;
    }

    // L'état de l'autorisation détermine l'action proposée
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status as PermissionState);
      } catch (error) {
        setPermission('unknown');
      }
    } else {
      setPermission('granted');
    }

    awaitingSettingsRef.current = false;
    setVisible(true);
  }, [topic, alreadyFollowed, onLeave]);

  /**
   * Action principale. Son effet dépend de l'autorisation en cours :
   * demander l'autorisation, ouvrir les réglages, ou suivre directement.
   */
  const accept = useCallback(async () => {
    if (isSubmitting) return;

    // Autorisation bloquée : seul un passage par les réglages la rétablit
    if (permission === 'denied') {
      awaitingSettingsRef.current = true;
      Linking.openSettings().catch((error) => sendError(tag, error));
      return;
    }

    // Jamais demandée : le système peut encore afficher sa boîte de dialogue
    if (permission === 'undetermined') {
      setIsSubmitting(true);

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setPermission(status as PermissionState);

        if (status === 'granted') {
          syncDeviceToken();
        }
      } catch (error) {
        sendError(tag, error);
      } finally {
        setIsSubmitting(false);
      }

      // Le sujet est suivi quelle que soit la réponse : l'autorisation
      // ne conditionne que la réception des notifications
      follow();
      return;
    }

    follow();
  }, [isSubmitting, permission, follow, tag, syncDeviceToken]);

  /** L'utilisateur refuse : la question ne sera plus posée */
  const decline = useCallback(async () => {
    declinedRef.current = true;

    try {
      await AsyncStorage.setItem(DECLINED_KEY, '1');
    } catch (error) {
      sendError(tag, error);
    }

    setVisible(false);
    onLeave();
  }, [onLeave, tag]);

  /** L'utilisateur reporte : la question se reposera plus tard */
  const dismiss = useCallback(() => {
    awaitingSettingsRef.current = false;
    setVisible(false);
    onLeave();
  }, [onLeave]);

  return {
    requestLeave,
    dialogProps: {
      visible,
      topicName: topic?.name ?? '',
      permission,
      isSubmitting,
      onAccept: accept,
      onDecline: decline,
      onDismiss: dismiss,
    },
  };
}

export default useTopicFollowPrompt;