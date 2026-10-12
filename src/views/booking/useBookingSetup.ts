import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ExpertBookingSetup, getMyBookingSetup } from '../../services/v2/BookingService';

export const BOOKING_ME_KEY = ['booking', 'me'];

/**
 * Configuration de l'expert connecté, depuis le cache partagé par tout l'espace.
 * `apply` y écrit l'état complet renvoyé par une écriture : tous les écrans suivent.
 */
export const useBookingSetup = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BOOKING_ME_KEY,
    queryFn: () => getMyBookingSetup(),
  });

  const setup = query.data?.is_expert ? (query.data as ExpertBookingSetup) : null;

  const apply = (next: ExpertBookingSetup) => queryClient.setQueryData(BOOKING_ME_KEY, next);

  return { ...query, setup, apply };
};