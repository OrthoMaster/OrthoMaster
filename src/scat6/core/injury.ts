/**
 * Un même choc peut donner plusieurs examens (après un choc à H+3, re-test à H+12, J+2…).
 * Ils sont reliés par la même date-heure du choc (`injury_at`, identique à la seconde) :
 * au démarrage, le médecin choisit un choc récent du patient au lieu d'en saisir un nouveau.
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
    // Même instant = même choc (le serveur peut renvoyer « …Z » ou « …+00:00 »).
    const key = new Date(t).toISOString();
    const g = groups.get(key) ?? { injuryAt: a.injury_at, count: 0 };
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

/** Même choc ? (comparaison à l'instant près, pas au texte). */
export const sameInjury = (a: string | null, b: string | null) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime();
