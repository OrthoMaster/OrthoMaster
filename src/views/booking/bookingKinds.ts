/**
 * v3 : deux façons de réserver un expert.
 *  - Thèmes : thème proposé par l'expert (offre), demi-journées, en ligne ou en présentiel.
 *  - Consultation : sujet libre, toujours en ligne, par tranches de 30 minutes.
 * Libellés et couleurs partagés par les écrans (mobile et web).
 */
import Colors from '../../../constants/Colors';
import { BookingKind } from '../../services/v2/BookingService';

/** Violet doux de la Consultation (Colors.purple) ; le bleu de l'espace rendez-vous reste celui des Thèmes. */
export const CONSULT_COLOR = Colors.purple;
/** Même violet assombri : textes sur fond clair, dégradés. */
export const CONSULT_COLOR_DARK = '#745F89';
export const CONSULT_SOFT = Colors.purple3;

export const KIND_LABELS: Record<BookingKind, string> = {
  offer: 'Thèmes',
  consultation: 'Consultation',
};

/** « 1 h 30 », « 30 min ». */
export const durationText = (minutes: number | null | undefined): string => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m}` : `${h} h`;
};

/** Titre affiché d'une demande : la consultation porte sa durée. */
export const bookingTitle = (b: { offer_title: string; kind?: BookingKind; duration_minutes?: number | null }) =>
  b.kind === 'consultation' && b.duration_minutes ? `${b.offer_title} · ${durationText(b.duration_minutes)}` : b.offer_title;
