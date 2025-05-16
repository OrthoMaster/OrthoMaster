// hooks/useEventFlusher.ts
import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue } from '../utils/eventQueue';
import axios from 'axios';
import { sessionError } from '../services/SessionEventService';
import { SessionError } from '../utils/myTypes';

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/session"

let isFlushing = false;

const sendEvent = async (event: any, route: string) => {
    await axios.post(baseurl + route, event);
};

export const useSessionEventFlusher = () => {
    useEffect(() => {

        const unsubscribe = NetInfo.addEventListener(async state => {
            if (state.isConnected && !isFlushing) {
                isFlushing = true;

                //flushQueue(sendEvent);
                try {
                    await flushQueue(sendEvent);
                } catch (e) {
                    sessionError({
                        name: "flushQueue",
                        message: "Error while flushing queue",
                        stack_trace: e,
                        context: null,
                    } as SessionError)
                } finally {
                    isFlushing = false;
                }
            }
        });

        return () => {
            unsubscribe();
        }
    }, []);
};
