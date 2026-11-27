/**
 * Un même choc peut donner plusieurs examens (après un choc à H+3, re-test à H+12, J+2…).
 * Un choc = un JOUR (heure locale) pour un patient : tous les examens dont le choc tombe le même jour
 * sont rattachés au même choc, même si l'heure a été saisie différemment (ou pas du tout).
 * Au démarrage, un choc déjà connu ce jour-là est repris au lieu d'en créer un second.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Au-delà, le SCAT6 n'est plus indiqué (R6) : le choc n'est plus proposé au démarrage. */
const RECENT_DAYS = 7;

/**
 * Le médecin indique le délai (« 3 h après le choc »), pas l'heure du choc : injury_at = début de
 * l'examen − délai, arrondi à la minute. Délai inconnu : injury_at = minuit (heure locale) du jour du
 * choc, ce qui marque « heure inconnue » (un délai saisi ne tombe jamais pile à minuit, voir injuryFromDelay).
 */
export function timeKnown(injuryAt: string): boolean {
  const d = new Date(injuryAt);
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
}

/** Choc à partir du délai en heures avant `at` (heure connue). */
export function injuryFromDelay(hours: number, at: number = Date.now()): string {
  const d = new Date(Math.floor((at - hours * HOUR) / 60_000) * 60_000); // vers le bas : H+5 reste H+5
  if (!timeKnown(d.toISOString())) d.setMinutes(1); // pile minuit : réservé à « heure inconnue »
  return d.toISOString();
}

/** Choc à une date sans heure (délai inconnu) : minuit local de ce jour (AAAA-MM-JJ). */
export const injuryFromDay = (day: string) => new Date(`${day}T00:00:00`).toISOString();

const calendarDays = (from: Date, to: Date) => {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((day(to) - day(from)) / DAY);
};

/** « H+5 » pendant les 48 premières heures, puis « J+3 » ; heure du choc inconnue : « J+0 », « J+1 »… */
export function sinceInjuryLabel(injuryAt: string, at: string | number | Date = Date.now()): string {
  if (!timeKnown(injuryAt)) return `J+${Math.max(0, calendarDays(new Date(injuryAt), new Date(at)))}`;
  const ms = new Date(at).getTime() - new Date(injuryAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'H+0';
  if (ms < 48 * HOUR) return `H+${Math.floor(ms / HOUR)}`;
  return `J+${Math.floor(ms / DAY)}`;
}

export interface InjuryGroup {
  injuryAt: string;
  /** Examens rattachés à ce choc (brouillons compris). */
  count: number;
}

/** Chocs des 7 derniers jours, du plus récent au plus ancien, avec le nombre d'examens de chacun. */
export function recentInjuries(
  assessments: { exam_kind: string; injury_at: string | null }[],
  now: number = Date.now()
): InjuryGroup[] {
  const groups = new Map<string, InjuryGroup>();
  for (const a of assessments) {
    if (a.exam_kind === 'baseline' || !a.injury_at) continue;
    const t = new Date(a.injury_at).getTime();
    if (!Number.isFinite(t) || now - t > RECENT_DAYS * DAY || t > now) continue;
    // Même jour = même choc ; on garde l'heure connue la plus précoce comme heure du choc.
    const key = injuryDay(a.injury_at);
    const g = groups.get(key) ?? { injuryAt: a.injury_at, count: 0 };
    g.injuryAt = preferInjury(g.injuryAt, a.injury_at);
    g.count++;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => new Date(b.injuryAt).getTime() - new Date(a.injuryAt).getTime());
}

/** « 27 nov. 2026 à 14:30 », ou « 27 nov. 2026 » si l'heure est inconnue. */
export function formatInjury(injuryAt: string | null | undefined): string {
  if (!injuryAt) return '—';
  const d = new Date(injuryAt);
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return timeKnown(injuryAt) ? `${date} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : date;
}

/** Jour du choc, AAAA-MM-JJ en heure locale : c'est l'identité du choc. */
export const injuryDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Même choc ? (même jour, heure locale). */
export const sameInjury = (a: string | null, b: string | null) => !!a && !!b && injuryDay(a) === injuryDay(b);

/** Entre deux saisies du même choc : l'heure connue plutôt qu'inconnue, sinon la plus précoce. */
export function preferInjury(a: string, b: string): string {
  if (timeKnown(a) !== timeKnown(b)) return timeKnown(a) ? a : b;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

/** Examen signé (après un choc ou re-test) : ce qu'il faut pour suivre l'évolution. */
interface ExamLike {
  uuid: string;
  status: string;
  exam_kind: string;
  injury_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const examTime = (a: { started_at: string | null; completed_at: string | null }) =>
  new Date(a.started_at ?? a.completed_at ?? 0).getTime();

/**
 * Chocs (épisodes) d'un patient, déduits de l'ORDRE des examens (règle du médecin, 27/11/2026) :
 *  - un « Après un choc » qui suit un re-test ou une baseline (ou rien) ouvre un nouveau choc ;
 *  - deux « Après un choc » à la suite = le même choc ;
 *  - un re-test appartient au choc en cours ; une baseline n'appartient à aucun choc et ferme le choc en cours.
 * La date du choc est celle saisie aux examens (l'heure connue la plus précoce).
 */
export interface Episode<T> {
  injuryAt: string | null;
  exams: T[];
}

/** Ce nouvel examen continue-t-il le choc de l'examen précédent ? */
export const continuesEpisode = (previousKind: string | null | undefined, kind: string) =>
  !!previousKind && previousKind !== 'baseline' && kind !== 'baseline' && !(kind === 'post_choc' && previousKind === 'retest');

/** Chocs des examens donnés (filtrés par l'appelant), du plus ancien au plus récent. */
export function buildEpisodes<T extends ExamLike>(rows: T[]): Episode<T>[] {
  const sorted = [...rows].sort((a, b) => examTime(a) - examTime(b));
  const out: Episode<T>[] = [];
  let previous: T | null = null;
  for (const a of sorted) {
    if (a.exam_kind !== 'baseline') {
      if (previous && continuesEpisode(previous.exam_kind, a.exam_kind) && out.length) out[out.length - 1].exams.push(a);
      else out.push({ injuryAt: null, exams: [a] });
    }
    previous = a;
  }
  for (const e of out) {
    const dates = e.exams.map((x) => x.injury_at).filter((x): x is string => !!x);
    e.injuryAt = dates.length ? dates.reduce(preferInjury) : null;
  }
  return out;
}

/** Chocs des examens signés, du plus récent au plus ancien. */
export function injuriesWithExams<T extends ExamLike>(rows: T[]): Episode<T>[] {
  return buildEpisodes(rows.filter((a) => a.status === 'completed')).reverse();
}

/** Choc d'un examen signé (même objet Episode pour tous les examens d'un choc). */
export function episodeIndex<T extends ExamLike>(rows: T[]): Map<string, Episode<T>> {
  const map = new Map<string, Episode<T>>();
  for (const e of injuriesWithExams(rows)) for (const x of e.exams) map.set(x.uuid, e);
  return map;
}

/**
 * Examen signé précédent du même choc (avant `current`), ou null : l'examen signé juste avant,
 * sauf si `current` ouvre un nouveau choc (après une baseline, ou « Après un choc » après un re-test).
 */
export function previousExamOfInjury<T extends ExamLike>(
  rows: T[],
  current: { uuid: string; exam_kind: string; started_at: string | null; completed_at?: string | null }
): T | null {
  if (current.exam_kind === 'baseline') return null;
  const t = examTime({ started_at: current.started_at, completed_at: current.completed_at ?? null });
  const before = rows
    .filter((a) => a.status === 'completed' && a.uuid !== current.uuid && examTime(a) < t)
    .sort((a, b) => examTime(a) - examTime(b));
  const last = before[before.length - 1];
  return last && continuesEpisode(last.exam_kind, current.exam_kind) ? last : null;
}

/**
 * Pour un nouvel examen : le choc qu'il continue (examens signés ou en cours), s'il y en a un
 * et qu'il date de moins de 7 jours ; sinon null (nouveau choc).
 */
export function currentEpisode<T extends ExamLike>(rows: T[], kind: string, now: number = Date.now()): Episode<T> | null {
  const episodes = buildEpisodes(rows);
  const sorted = [...rows].sort((a, b) => examTime(a) - examTime(b));
  const last = sorted[sorted.length - 1];
  if (!last || !continuesEpisode(last.exam_kind, kind)) return null;
  const e = episodes[episodes.length - 1];
  if (!e?.injuryAt || now - new Date(e.injuryAt).getTime() > RECENT_DAYS * DAY) return null;
  return e;
}
