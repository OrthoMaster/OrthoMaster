import { ChatConversation } from '../../../services/v2/BookingService';
import { WEEKDAYS } from '../bookingDates';

/** Bleu des bulles « moi » et des éléments actifs de la messagerie. */
export const CHAT_BLUE = '#0A7CFF';
export const CHAT_BUBBLE_OTHER = '#EFEFF2';

export const CHAT_UNREAD_KEY = ['booking', 'chat-unread'];
export const CONVERSATIONS_KEY = ['booking', 'conversations'];

/** Nom affiché de l'autre partie : l'expert (« Dr Martin ») ou le demandeur. */
export const otherName = (c: Pick<ChatConversation, 'role' | 'expert' | 'requester'>) =>
  c.role === 'guest'
    ? [c.expert?.honorific_short ?? c.expert?.honorific, c.expert?.name].filter(Boolean).join(' ') || 'Expert'
    : c.requester?.name || 'Confrère';

const pad = (n: number) => String(n).padStart(2, '0');

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Heure de la liste : « 14:05 » aujourd'hui, « Hier », « Lun. » cette semaine, « 03/11 » sinon. */
export const listTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Hier';

  const days = (now.getTime() - d.getTime()) / 86400000;
  if (days < 6) {
    const iso = d.getDay() === 0 ? 7 : d.getDay();
    return WEEKDAYS[iso].slice(0, 3) + '.';
  }
  return d.getFullYear() === now.getFullYear()
    ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
    : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** Séparateur dans le fil : « Aujourd'hui 14:05 », « Hier 09:12 », « Lundi 3 nov. 18:40 ». */
export const separatorTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay(d, now)) return `Aujourd'hui ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return `Hier ${time}`;

  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const weekday = WEEKDAYS[d.getDay() === 0 ? 7 : d.getDay()];
  const year = d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${weekday} ${d.getDate()} ${months[d.getMonth()]}${year} ${time}`;
};

/** Identifiant envoyé avec un message : un renvoi après coupure réseau ne le duplique pas. */
export const newClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
