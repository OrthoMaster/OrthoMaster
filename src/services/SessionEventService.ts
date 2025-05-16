import { Platform } from 'react-native';
import axios from 'axios';
import * as Device from 'expo-device';
import { restoreLocalConfigAsync } from '../futils';
import { SessionError, SessionEventData, SessionEventType } from '../utils/myTypes';
import { enqueueEvent } from '../utils/eventQueue';
import { isOnline } from '../utils/network';

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/session"

// Un ID de session pour regrouper les événements

let sessionId: string | null = null;


export const startSession = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  const deviceInfos = {
    device_name: Device.deviceName,
    device_model: Device.modelName,
    device_manufacturer: Device.manufacturer,
    device_year: Device.deviceYearClass,
    device_OS: Device.osName
  }
  const payload = {
    user_id: config.user.id_user,
    device_infos: JSON.stringify(deviceInfos),
    started_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }

  const online = await isOnline();

  if (!online) {
    // En cas de perte de connexion, on met l'événement en file d'attente
    await enqueueEvent({payload, route: '/start'});
    return;
  }

  try {
    await axios.post(baseurl + "/start", payload, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      sessionId = response.data.session_id;
    })
  } catch (err) {
    await enqueueEvent({payload, route: '/start'});
  }
}

export const closeSession = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  const payload = {
    ended_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }

  const online = await isOnline();

  if (!online) {
    // En cas de perte de connexion, on met l'événement en file d'attente
    await enqueueEvent({payload, route: `/${sessionId}/end`});
    return;
  }
  try {
    await axios.patch(baseurl + `/${sessionId}/end`, payload, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      sessionId = null
    });
  } catch (err) {
    await enqueueEvent({payload, route: `/${sessionId}/end`});
  }
}


export const saveEvent = async (
  eventType: SessionEventType,
  data: SessionEventData
) => {
  const payload = {
    session_id: sessionId,
    event_type: eventType,
    event_data: data
  };

  const online = await isOnline();

  if (!online) {
    // En cas de perte de connexion, on met l'événement en file d'attente
    await enqueueEvent({payload, route: '/event'});
    return;
  }
  try {
    await axios.post(baseurl + '/event', payload);
    // Pour le debug
  } catch (err) {
    await enqueueEvent({payload, route: '/event'});
  }
};

export const getSessionId = () => {
  return sessionId;
}

export const sessionError = async (error: SessionError) => {

  const payload = {
    session_id: getSessionId(),
    ...error
  };
  const online = await isOnline();

  if (!online) {

    // En cas de perte de connexion, on met l'événement en file d'attente
    await enqueueEvent({payload, route: '/error'});
    return;
  }

  try {
    await axios.post(baseurl + '/error', payload);
    // Pour le debug
  } catch (err) {
    // Optionnel : mise en file d'attente si offline
    await enqueueEvent({payload, route: '/error'});
  }
};
