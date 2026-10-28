import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';

import { MyBooking, MyBookingBlock, MyBookingStatus } from '../../../services/v2/BookingService';
import { WEEKDAYS, diffDays, isoDate, weekdayIso } from '../bookingDates';

/** Couleur de l'onglet Rendez-vous dans la barre flottante. */
export const APPOINTMENTS_ACCENT = Colors.purple;

export interface StatusMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
}

export const STATUS_META: Record<MyBookingStatus, StatusMeta> = {
  pending: { label: "En attente de l'expert", icon: 'hourglass-outline', color: Colors.warning, background: Colors.warningBackground },
  accepted: { label: 'Confirmé', icon: 'checkmark-circle', color: Colors.success, background: Colors.successBackground },
  completed: { label: 'Terminé', icon: 'flag-outline', color: Colors.lblueDark, background: Colors.grayLight },
  declined: { label: 'Refusé', icon: 'close-circle-outline', color: Colors.danger, background: Colors.dangerBackground },
  expired: { label: 'Sans réponse', icon: 'time-outline', color: Colors.gray, background: Colors.grayLight },
  cancelled: { label: 'Annulé', icon: 'ban-outline', color: Colors.gray, background: Colors.grayLight },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Date du jour de l'appareil, Y-m-d. */
export const todayLocal = () => {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

/** Abréviations usuelles des mois. */
export const MONTHS_SHORT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

/** « Lun. 26 oct » */
export const formatShortDay = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[weekdayIso(iso)].slice(0, 3)}. ${d} ${MONTHS_SHORT[m - 1]}`;
};

/** Instant ISO dans le fuseau de l'appareil : « mer. 21 oct. à 14:00 ». */
export const formatDeadline = (iso: string) => {
  const date = new Date(iso);
  const local = isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${formatShortDay(local).toLowerCase()} à ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** « Aujourd'hui », « Demain », « Dans 5 jours ». */
export const relativeDay = (date: string) => {
  const days = diffDays(todayLocal(), date);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
};

/**
 * Demi-journée mise en avant sur la carte : la prochaine qui n'est pas terminée,
 * sinon la première (rendez-vous passé ou clos).
 */
export const featuredBlock = (
  booking: Pick<MyBooking, 'status' | 'blocks'>
): { block: MyBookingBlock | undefined; upcoming: boolean } => {
  const now = Date.now();
  const next = booking.blocks.find((b) => (b.end_at ? new Date(b.end_at).getTime() > now : true));
  const active = booking.status === 'pending' || booking.status === 'accepted';

  return active && next ? { block: next, upcoming: true } : { block: booking.blocks[0], upcoming: false };
};