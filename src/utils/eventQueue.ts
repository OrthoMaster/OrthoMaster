// utils/eventQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'sessionEventQueue';

export const enqueueEvent = async (event: any) => {
    const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(event);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const flushQueue = async (sendEvent: (event: any, route: string) => Promise<void>) => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = JSON.parse(raw || '[]');

    const failed: any[] = [];

    for (const event of queue) {

        try {
            await sendEvent(event.payload, event.route);
        } catch {
            if (event.route != "/event" || event.payload.session_id != null) {
                failed.push(event);
            }
        }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
};
