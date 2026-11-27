/**
 * Un même choc peut donner plusieurs examens (après un choc à H+3, re-test à H+12, J+2…).
 * Ils sont reliés par la même date-heure du choc (`injury_at`, identique à la seconde) :
 * au démarrage, le médecin choisit un choc récent du patient au lieu d'en saisir un nouveau.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Au-delà, le SCAT6 n'est plus indiqué (R6) : le choc n'est plus proposé au démarrage. */
const RECENT_DAYS = 7;

/** « H+5 » pendant les 48 premières heures, puis « J+3 ». */
export function sinceInjuryLabel(injuryAt: string, at: string | number | Date = Date.now()): string {
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

/** Même choc ? (comparaison à l'instant près, pas au texte). */
export const sameInjury = (a: string | null, b: string | null) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime();
