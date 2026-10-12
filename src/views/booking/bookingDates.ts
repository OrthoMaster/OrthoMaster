/**
 * Dates manipulées en chaînes Y-m-d, comme l'API : pas d'objet Date dans l'état,
 * donc pas de décalage de fuseau entre l'appareil et l'expert.
 * Les calculs passent par Date.UTC, insensible à l'heure d'été.
 */

export const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Index 1 = lundi … 7 = dimanche (ISO), comme l'API. */
export const WEEKDAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const WEEKDAYS_SHORT = ['', 'L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');

export const isoDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

const parts = (iso: string) => iso.split('-').map(Number) as [number, number, number];

const toUtc = (iso: string) => {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
};

const fromUtc = (ms: number) => {
  const date = new Date(ms);
  return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

export const addDays = (iso: string, days: number) => fromUtc(toUtc(iso) + days * 86400000);

export const diffDays = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / 86400000);

export const weekdayIso = (iso: string) => {
  const day = new Date(toUtc(iso)).getUTCDay();
  return day === 0 ? 7 : day;
};

/** Aujourd'hui dans le fuseau de l'expert ; repli sur l'appareil si Intl ne connaît pas le fuseau. */
export const todayIn = (timezone: string) => {
  try {
    // en-CA formate en AAAA-MM-JJ.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch (e) {
    const now = new Date();
    return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
};

/** Semaines du mois, lundi en premier ; null pour les cases hors du mois. */
export const monthMatrix = (year: number, month: number): (string | null)[][] => {
  const first = isoDate(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = weekdayIso(first) - 1;

  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(isoDate(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

/** « lundi 3 novembre » (année ajoutée si différente de celle de référence). */
export const formatLongDate = (iso: string, referenceYear?: number) => {
  const [y, m, d] = parts(iso);
  const text = `${WEEKDAYS[weekdayIso(iso)].toLowerCase()} ${d === 1 ? '1er' : d} ${MONTHS[m - 1]}`;
  return referenceYear && referenceYear !== y ? `${text} ${y}` : text;
};

/** « 03/11 » ou « 03/11/2027 ». */
export const formatShortDate = (iso: string, withYear = false) => {
  const [y, m, d] = parts(iso);
  return withYear ? `${pad(d)}/${pad(m)}/${y}` : `${pad(d)}/${pad(m)}`;
};

/* ---- Heures HH:MM ---- */

export const toMinutes = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** « 3 h », « 3 h 30 ». */
export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${pad(m)}` : `${h} h`;
};