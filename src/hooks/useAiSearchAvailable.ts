import { useQuery } from '@tanstack/react-query';

import { getAiSearchStatus } from '../services/v2/ContentService';

/** Clé partagée : l'écran de l'assistant la passe à false dès qu'il reçoit ai_unavailable. */
export const AI_SEARCH_STATUS_KEY = ['ai-search-status'];

/**
 * Le bouton de l'assistant n'apparaît que si le serveur le déclare disponible.
 * Revérifié à chaque ouverture d'un écran de recherche, au plus une fois par minute.
 */
export const useAiSearchAvailable = (): boolean => {
  const { data } = useQuery({
    queryKey: AI_SEARCH_STATUS_KEY,
    queryFn: () => getAiSearchStatus(),
    staleTime: 60 * 1000,
    refetchOnMount: true,
    retry: 1,
  });

  return data === true;
};