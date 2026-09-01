/**
 * Synchronise un état booléen avec le serveur après une période d'inactivité.
 *
 * L'interface réagit immédiatement, tandis que la requête n'est envoyée que
 * lorsque l'utilisateur cesse d'appuyer — et uniquement si l'état final
 * diffère de celui connu du serveur. Deux appuis successifs ne déclenchent
 * donc aucun appel.
 *
 * En cas d'échec, l'état revient à celui du serveur : l'interface ne doit
 * jamais afficher une valeur que le serveur ne connaît pas.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { sendError } from '../services/v2/AuthService';

const TOGGLE_DELAY = 500;

type Options = {
  /** Étiquette utilisée pour la remontée d'erreur */
  tag: string;
};

export function useDebouncedToggle(
  serverValue: boolean,
  request: (next: boolean) => Promise<boolean>,
  options: Options
) {
  const [value, setValue] = useState(serverValue);

  const syncedRef = useRef(serverValue);
  const valueRef = useRef(serverValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tagRef = useRef(options.tag);
  tagRef.current = options.tag;

  const requestRef = useRef(request);
  requestRef.current = request;

  // L'état renvoyé par le serveur fait toujours foi
  useEffect(() => {
    syncedRef.current = serverValue;
    valueRef.current = serverValue;
    setValue(serverValue);
  }, [serverValue]);

  const flush = useCallback(async () => {
    const target = valueRef.current;

    if (target === syncedRef.current) return;

    let succeeded = false;

    try {
      succeeded = await requestRef.current(target);
    } catch (error) {
      // Les erreurs serveur sont déjà journalisées côté API ;
      // seul un incident inattendu côté client remonte ici
      sendError(tagRef.current, error);
    }

    if (succeeded) {
      syncedRef.current = target;
      return;
    }

    valueRef.current = syncedRef.current;
    setValue(syncedRef.current);
  }, []);

  const toggle = useCallback(() => {
    const next = !valueRef.current;

    valueRef.current = next;
    setValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, TOGGLE_DELAY);
  }, [flush]);

  // Une modification en attente est envoyée avant de quitter l'écran
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        flush();
      }
    };
  }, [flush]);

  return [value, toggle] as const;
}

export default useDebouncedToggle;