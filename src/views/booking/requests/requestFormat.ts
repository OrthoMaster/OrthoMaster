import Colors from '../../../../constants/Colors';

import { MyBookingStatus } from '../../../services/v2/BookingService';
import { StatusMeta } from '../appointments/appointmentFormat';

/** Couleur de l'onglet Demandes dans la barre flottante. */
export const REQUESTS_ACCENT = Colors.primary;

/** Libellés côté expert : la demande est à lui de trancher. */
export const REQUEST_STATUS_META: Record<MyBookingStatus, StatusMeta> = {
  pending: { label: 'À traiter', icon: 'mail-unread-outline', color: Colors.warning, background: Colors.warningBackground },
  accepted: { label: 'Acceptée', icon: 'checkmark-circle', color: Colors.success, background: Colors.successBackground },
  completed: { label: 'Terminé', icon: 'flag-outline', color: Colors.lblueDark, background: Colors.grayLight },
  declined: { label: 'Refusée', icon: 'close-circle-outline', color: Colors.danger, background: Colors.dangerBackground },
  expired: { label: 'Expirée', icon: 'time-outline', color: Colors.gray, background: Colors.grayLight },
  cancelled: { label: 'Annulée', icon: 'ban-outline', color: Colors.gray, background: Colors.grayLight },
};

/** En dessous, le délai restant passe en rouge sur la carte. */
export const URGENT_HOURS = 24;

/**
 * Temps restant pour répondre : « 2 j 5 h », « 5 h », « 40 min », null si dépassé.
 */
export const timeLeft = (iso: string | null): { label: string; urgent: boolean } | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;

  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const label = days >= 1 ? `${days} j ${hours % 24} h` : hours >= 1 ? `${hours} h` : `${minutes} min`;
  return { label, urgent: hours < URGENT_HOURS };
};