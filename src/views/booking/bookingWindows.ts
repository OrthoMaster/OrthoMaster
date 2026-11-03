/**
 * Hors calendrier par créneaux (mobile et web) : le demandeur propose 1 à 3 créneaux,
 * chacun sur un ou plusieurs jours ; l'expert choisit l'horaire exact en acceptant.
 *  - Consultation : de « jour heure » à « jour heure », par pas de 30 minutes, au moins la durée estimée.
 *  - Thème : de « jour demi-journée » à « jour demi-journée » (incluses), au moins les demi-journées du thème.
 */
import { BookingPeriod, BookingWindow, BookingWindowInput } from '../../services/v2/BookingService';
import { addDays, formatLongDate, fromMinutes, toMinutes } from './bookingDates';

export const MAX_WINDOWS = 3;
/** Même borne que le serveur (BookingWindowService::MAX_SPAN_DAYS). */
export const MAX_SPAN_DAYS = 14;
export const STEP_MINUTES = 30;

export const PERIOD_TEXT: Record<BookingPeriod, string> = { morning: 'matin', afternoon: 'après-midi' };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type AnyWindow = Pick<BookingWindowInput, 'start_date' | 'end_date' | 'start_time' | 'end_time' | 'start_period' | 'end_period'> | BookingWindow;

const startOf = (w: AnyWindow) => (w.start_time ?? (w.start_period ? PERIOD_TEXT[w.start_period] : '')) || '';
const endOf = (w: AnyWindow) => (w.end_time ?? (w.end_period ? PERIOD_TEXT[w.end_period] : '')) || '';

/**
 * « Jeudi 12 novembre, 09:00 – 12:00 » (même jour) ou
 * « Jeudi 12 novembre 09:00 → samedi 14 novembre 18:00 ».
 * Thème : « Jeudi 12 novembre, matin – après-midi », « Jeudi 12 novembre matin ».
 */
export const windowLabel = (w: AnyWindow, referenceYear = new Date().getFullYear()): string => {
  const start = capitalize(formatLongDate(w.start_date, referenceYear));
  if (w.start_date === w.end_date) {
    const a = startOf(w);
    const b = endOf(w);
    return a === b ? `${start} ${a}` : `${start}, ${a} – ${b}`;
  }
  return `${start} ${startOf(w)} → ${formatLongDate(w.end_date, referenceYear)} ${endOf(w)}`;
};

/* ---- Consultation ---- */

/** Minutes depuis le début du jour de départ (un créneau peut couvrir plusieurs jours). */
const span = (w: BookingWindowInput) => {
  const days = Math.round((Date.parse(`${w.end_date}T00:00:00Z`) - Date.parse(`${w.start_date}T00:00:00Z`)) / 86400000);
  return days * 1440 + toMinutes(w.end_time!) - toMinutes(w.start_time!);
};

/** Erreur à afficher pour un créneau de consultation, ou null s'il est valable. */
export const consultationWindowError = (w: BookingWindowInput, minutes: number): string | null => {
  if (!w.start_time || !w.end_time) return 'Choisissez le début et la fin.';
  const length = span(w);
  if (length <= 0) return 'La fin doit suivre le début.';
  if (length < minutes) return `Au moins la durée estimée (${minutes} min).`;
  if (length > MAX_SPAN_DAYS * 1440) return `${MAX_SPAN_DAYS} jours au plus.`;
  return null;
};

/**
 * Heures de début possibles dans un créneau de consultation (heure de l'expert), par 30 minutes :
 * [{ date, time }]. Utilisé par l'expert pour choisir l'horaire.
 */
export const consultationStarts = (w: BookingWindow, minutes: number): { date: string; time: string }[] => {
  if (!w.start_time || !w.end_time) return [];
  const list: { date: string; time: string }[] = [];
  const total = span(w as BookingWindowInput);
  for (let m = 0; m + minutes <= total; m += STEP_MINUTES) {
    const absolute = toMinutes(w.start_time) + m;
    list.push({ date: addDays(w.start_date, Math.floor(absolute / 1440)), time: fromMinutes(absolute % 1440) });
  }
  return list;
};

/* ---- Thème ---- */

/** Nombre de demi-journées couvertes par un créneau de thème (bornes incluses). */
export const halfDaysIn = (w: BookingWindowInput): number => {
  if (!w.start_period || !w.end_period) return 0;
  const days = Math.round((Date.parse(`${w.end_date}T00:00:00Z`) - Date.parse(`${w.start_date}T00:00:00Z`)) / 86400000);
  const index = (p: BookingPeriod) => (p === 'morning' ? 0 : 1);
  return days * 2 + index(w.end_period) - index(w.start_period) + 1;
};

export const themeWindowError = (w: BookingWindowInput, blocksCount: number): string | null => {
  if (!w.start_period || !w.end_period) return 'Choisissez le début et la fin.';
  const count = halfDaysIn(w);
  if (count <= 0) return 'La fin doit suivre le début.';
  if (count < blocksCount) return `Au moins ${blocksCount} demi-journée${blocksCount > 1 ? 's' : ''}.`;
  if (count > (MAX_SPAN_DAYS + 1) * 2) return `${MAX_SPAN_DAYS} jours au plus.`;
  return null;
};

/** Deux créneaux qui se chevauchent (même jour et heures croisées, ou demi-journées communes). */
export const windowsOverlap = (a: BookingWindowInput, b: BookingWindowInput): boolean => {
  const key = (date: string, value: string) => `${date} ${value}`;
  const order = (v?: string) => (v === 'morning' ? '0' : v === 'afternoon' ? '1' : v ?? '');
  const aStart = key(a.start_date, order(a.start_time ?? a.start_period));
  const aEnd = key(a.end_date, order(a.end_time ?? a.end_period));
  const bStart = key(b.start_date, order(b.start_time ?? b.start_period));
  const bEnd = key(b.end_date, order(b.end_time ?? b.end_period));
  // Consultation : la fin est exclue ; thème : la dernière demi-journée est incluse.
  const inclusive = !!a.start_period;
  return inclusive ? aStart <= bEnd && bStart <= aEnd : aStart < bEnd && bStart < aEnd;
};
