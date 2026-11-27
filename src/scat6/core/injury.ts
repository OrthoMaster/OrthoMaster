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

/** Examens signés d'un même choc, du plus ancien au plus récent. */
export function examsOfInjury<T extends ExamLike>(rows: T[], injuryAt: string): T[] {
  return rows
    .filter((a) => a.status === 'completed' && a.exam_kind !== 'baseline' && sameInjury(a.injury_at, injuryAt))
    .sort((a, b) => examTime(a) - examTime(b));
}

/** Examen signé précédent du même choc (avant `current`), ou null. */
export function previousExamOfInjury<T extends ExamLike>(
  rows: T[],
  current: { uuid: string; injury_at: string | null; started_at: string | null; completed_at?: string | null }
): T | null {
  if (!current.injury_at) return null;
  const t = examTime({ started_at: current.started_at, completed_at: current.completed_at ?? null });
  const before = examsOfInjury(rows, current.injury_at).filter((a) => a.uuid !== current.uuid && examTime(a) < t);
  return before.length ? before[before.length - 1] : null;
}

/** Tous les chocs du patient (examens signés), du plus récent au plus ancien. */
export function injuriesWithExams<T extends ExamLike>(rows: T[]): { injuryAt: string; exams: T[] }[] {
  const out: { injuryAt: string; exams: T[] }[] = [];
  for (const a of rows) {
    if (a.status !== 'completed' || a.exam_kind === 'baseline' || !a.injury_at) continue;
    if (out.some((g) => sameInjury(g.injuryAt, a.injury_at))) continue;
    const exams = examsOfInjury(rows, a.injury_at);
    out.push({ injuryAt: exams.map((e) => e.injury_at!).reduce(preferInjury), exams });
  }
  return out.sort((a, b) => new Date(b.injuryAt).getTime() - new Date(a.injuryAt).getTime());
}
