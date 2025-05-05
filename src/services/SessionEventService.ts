import { Platform } from 'react-native';
import axios from 'axios';
import * as Device from 'expo-device';
import { restoreLocalConfigAsync } from '../utils';
import { SessionEventData, SessionEventType } from '../utils/myTypes';

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

  try {
    await axios.post(baseurl + "/start", payload, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      sessionId = response.data.session_id;
    }).catch((error) => {
      console.log(error);
      
    });
    console.log('[EVENT SENT]', payload);
  } catch (err) {
    console.warn('[EVENT FAILED]', err);
    // Optionnel : mise en file d'attente si offline
  }
}

export const closeSession = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  const payload = {
    ended_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  try {
    await axios.patch(baseurl + `/${sessionId}/end`, payload, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      sessionId = null
    }).catch((error) => {
      console.log(error);
    });
    console.log('[EVENT SENT]', payload);
  } catch (err) {
    console.warn('[EVENT FAILED]', err);
    // Optionnel : mise en file d'attente si offline
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

  try {
    await axios.post(baseurl+'/event', payload);
    // Pour le debug
    console.log('[EVENT SENT]', payload);
  } catch (err) {
    console.warn('[EVENT FAILED]', err);
    // Optionnel : mise en file d'attente si offline
  }
};

export const getSessionId = () => {
  return sessionId;
}