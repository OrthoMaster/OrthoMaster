/**
 * Mesure du temps de visionnage d'une vidéo.
 *
 * Le temps est accumulé par échantillonnage : à chaque tick, on n'ajoute
 * l'écart que s'il correspond à une lecture continue. Un écart trop grand
 * signifie que l'utilisateur a sauté dans la vidéo — il n'est pas compté.
 *
 * Les compteurs sont envoyés au serveur toutes les 30 secondes, ainsi qu'à
 * la fermeture de l'écran et au passage en arrière-plan.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { trackProgress } from '../services/v2/ContentService';

const SAMPLE_MS = 500;
const HEARTBEAT_MS = 30000;

/** Au-delà de cet écart entre deux échantillons, on considère un saut */
const MAX_STEP_SEC = 2;

type Player = { currentTime?: number; duration?: number; playing?: boolean };

export function useVideoTracking(trackingId: number | null, player: Player | null) {
  const watched = useRef(0);
  const maxPosition = useRef(0);
  const duration = useRef(0);
  const lastTime = useRef<number | null>(null);
  const lastSent = useRef(0);

  // Le player est lu via une ref : le remettre en dépendance relancerait
  // l'effet à chaque rendu et casserait la lecture en cours
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    if (!trackingId) return;

    const send = () => {
      const seconds = Math.round(watched.current);

      if (seconds <= lastSent.current) return;

      lastSent.current = seconds;

      trackProgress(trackingId, {
        watched_seconds: seconds,
        max_position: Math.round(maxPosition.current),
        duration: duration.current > 0 ? Math.round(duration.current) : undefined,
      });
    };

    const sampler = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      const current = p.currentTime ?? 0;
      const total = p.duration ?? 0;

      if (total > 0) duration.current = total;
      if (current > maxPosition.current) maxPosition.current = current;

      const previous = lastTime.current;
      lastTime.current = current;

      if (previous === null) return;

      const delta = current - previous;

      if (delta > 0 && delta <= MAX_STEP_SEC) {
        watched.current += delta;
      }
    }, SAMPLE_MS);

    const heartbeat = setInterval(send, HEARTBEAT_MS);

    const appStateListener = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        send();
      }
    });

    return () => {
      clearInterval(sampler);
      clearInterval(heartbeat);
      appStateListener.remove();
      send();
    };
  }, [trackingId]);
}