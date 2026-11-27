import { ORIENTATION, SYMPTOMS, SYMPTOM_MAX_SEVERITY } from './content';
import type { Answer, Answers, ListId, Scat6Data, Scat6Summary, Scat6Tests } from './types';

/**
 * Scores SCAT6 (repris de scat-app). Règles communes :
 *  - R7 : une partie non réalisée donne null, jamais 0 ni le maximum ;
 *  - aucun pourcentage global ni seuil : les scores se lisent à côté de la baseline et du jugement clinique.
 * Le serveur recalcule les mêmes scores à la signature (Scat6Scoring.php) : garder les deux identiques.
 */

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));
const round1 = (v: number) => Math.round(v * 10) / 10;

export const isDone = (a: Answer | undefined): a is Answer & { value: NonNullable<Answer['value']> } =>
  !!a && a.status === 'done' && a.value !== null;

export const EMPTY_TESTS = (list: ListId): Scat6Tests => ({
  memory: { list, trials: [[], [], []], endedAt: null, current: 0 },
  digits: { list, results: [] },
  months: { seconds: null, errors: null, done: false },
  mbess: { foot: null, firm: [null, null, null], foam: null, normal: null },
  tandem: { trials: [null, null, null], dualBest: null, dualErrors: null, done: false },
  delayed: { recalled: [], done: false },
});

export const EMPTY_DATA = (list: ListId): Scat6Data => ({
  answers: {},
  tests: EMPTY_TESTS(list),
  skipped: {},
  percent_normal: null,
  background_notes: '',
});

/* ---- Symptômes : /22 · /132 ---- */

export function symptomScore(answers: Answers) {
  const done = SYMPTOMS.filter((s) => isDone(answers[s.code]));
  if (done.length === 0) return null;
  let count = 0;
  let severity = 0;
  for (const s of done) {
    const v = clamp(Number(answers[s.code]!.value), 0, SYMPTOM_MAX_SEVERITY);
    if (v > 0) count++;
    severity += v;
  }
  return { count, severity, missing: SYMPTOMS.length - done.length };
}

/* ---- Concentration ---- */

/** Où en sont les chiffres à l'envers : prochaine série à lire (len 0–3, essai 0–1), ou terminé (len -1). */
export function digitsState(results: boolean[][]): { done: boolean; len: number; attempt: number } {
  for (let len = 0; len < 4; len++) {
    const r = results[len] ?? [];
    if (r.includes(true)) continue;
    if (r.length >= 2) return { done: true, len: -1, attempt: -1 };
    return { done: false, len, attempt: r.length };
  }
  return { done: true, len: -1, attempt: -1 };
}

/** Longueurs réussies (/4) : une longueur est réussie si l'un des deux essais l'est ; arrêt au premier échec. */
export function digitsBackward(results: boolean[][]): number | null {
  if (results.length === 0) return null;
  let score = 0;
  for (const attempts of results.slice(0, 4)) {
    if (attempts.includes(true)) score++;
    else break;
  }
  return score;
}

/** 1 point si aucune erreur ET moins de 30 s. */
export function monthsBackward(m: Scat6Tests['months']): number | null {
  if (!m.done) return null;
  return (m.errors ?? 1) === 0 && (m.seconds ?? 999) < 30 ? 1 : 0;
}

/* ---- Équilibre ---- */

/** Erreurs par position ; une position non tenue 5 s compte 10. */
export function mbess(stances: (number | null)[] | null): number | null {
  if (!stances || stances.length !== 3 || stances.some((s) => s === null)) return null;
  return stances.reduce<number>((sum, e) => sum + clamp(e as number, 0, 10), 0);
}

/** Essais de tandem (-1 = échec) : meilleur temps, moyenne, nombre d'échecs. */
export function tandemGait(trials: (number | null)[]) {
  const ok = trials.filter((t): t is number => t !== null && t > 0);
  if (ok.length === 0) return null;
  return {
    best: Math.min(...ok),
    mean: round1(ok.reduce((s, t) => s + t, 0) / ok.length),
    failed: trials.filter((t) => t !== null && t < 0).length,
  };
}

/* ---- Résumé ---- */

export function summarize(data: Scat6Data): Scat6Summary {
  const { answers, tests: t } = data;
  const sym = symptomScore(answers);

  const ori = ORIENTATION.map((i) => (isDone(answers[i.code]) ? answers[i.code]!.value === true : null));
  const orientation = ori.some((o) => o === null) ? null : ori.filter(Boolean).length;

  const immediate = t.memory.endedAt ? t.memory.trials.reduce((s, tr) => s + clamp(tr.length, 0, 10), 0) : null;

  const digits = digitsBackward(t.digits.results);
  const months = monthsBackward(t.months);
  const concentration = digits !== null && months !== null ? digits + months : null;

  const delayed = t.delayed.done ? clamp(t.delayed.recalled.length, 0, 10) : null;
  const cognitive =
    orientation === null || immediate === null || concentration === null || delayed === null
      ? null
      : orientation + immediate + concentration + delayed;

  return {
    symptom_count: sym?.count ?? null,
    symptom_severity: sym?.severity ?? null,
    orientation,
    immediate,
    concentration,
    delayed,
    cognitive_total: cognitive,
    mbess: mbess(t.mbess.firm),
    mbess_foam: mbess(t.mbess.foam),
    tandem_best: t.tandem.done ? tandemGait(t.tandem.trials)?.best ?? null : null,
    dual_best: t.tandem.dualBest,
  };
}

/* ---- Comparaison avec la baseline (étape 6) ---- */

export type CompareRow = {
  key: keyof Scat6Summary;
  label: string;
  max?: number;
  unit?: string;
  /** Pour l'affichage seulement : une valeur plus haute est-elle moins bonne ? Aucun seuil, aucun verdict. */
  higherIsWorse: boolean;
  current: number | null;
  baseline: number | null;
  delta: number | null;
};

const ROWS: Omit<CompareRow, 'current' | 'baseline' | 'delta'>[] = [
  { key: 'symptom_count', label: 'Nombre de symptômes', max: 22, higherIsWorse: true },
  { key: 'symptom_severity', label: 'Sévérité des symptômes', max: 132, higherIsWorse: true },
  { key: 'orientation', label: 'Orientation', max: 5, higherIsWorse: false },
  { key: 'immediate', label: 'Mémoire immédiate', max: 30, higherIsWorse: false },
  { key: 'concentration', label: 'Concentration', max: 5, higherIsWorse: false },
  { key: 'delayed', label: 'Mémoire différée', max: 10, higherIsWorse: false },
  { key: 'cognitive_total', label: 'Total cognitif', max: 50, higherIsWorse: false },
  { key: 'mbess', label: 'mBESS sol ferme (erreurs)', max: 30, higherIsWorse: true },
  { key: 'mbess_foam', label: 'mBESS sol instable (erreurs)', max: 30, higherIsWorse: true },
  { key: 'tandem_best', label: 'Marche sur une ligne (meilleur temps)', unit: 's', higherIsWorse: true },
  { key: 'dual_best', label: 'Double tâche (meilleur temps)', unit: 's', higherIsWorse: true },
];

export function compareWithBaseline(current: Scat6Summary, baseline: Scat6Summary | null): CompareRow[] {
  return ROWS.map((r) => {
    const c = current[r.key];
    const b = baseline ? baseline[r.key] : null;
    return { ...r, current: c, baseline: b, delta: c !== null && b !== null ? round1(c - b) : null };
  });
}

/** « 12/30 », « 11.4 s », « — » : valeur d'un domaine pour l'affichage. */
export const formatScore = (value: number | null, max?: number, unit?: string) =>
  value === null ? '—' : unit ? `${value} ${unit}` : max ? `${value}/${max}` : String(value);

/* ---- Signaux défavorables (étape 6, avant « Non ») ---- */

/**
 * Éléments de l'examen qui vont dans le sens d'une commotion. Ce n'est pas un verdict : le SCAT6 n'a
 * pas de seuil. Ils servent à faire confirmer explicitement un « Non » par le médecin.
 *  - avec baseline : tout domaine moins bon que la baseline ;
 *  - sans baseline : symptômes présents, orientation incomplète ;
 *  - examen neurologique anormal.
 */
export function unfavorableSignals(current: Scat6Summary, baseline: Scat6Summary | null, neuro: string | null): string[] {
  const out: string[] = [];
  if (baseline) {
    for (const r of compareWithBaseline(current, baseline)) {
      if (r.delta !== null && r.delta !== 0 && r.delta > 0 === r.higherIsWorse) {
        out.push(`${r.label} : ${formatScore(r.current, r.max, r.unit)} (baseline ${formatScore(r.baseline, undefined, r.unit)})`);
      }
    }
  } else {
    if ((current.symptom_count ?? 0) > 0) out.push(`${current.symptom_count} symptôme(s) présent(s), sévérité ${current.symptom_severity}/132`);
    if (current.orientation !== null && current.orientation < 5) out.push(`Orientation ${current.orientation}/5`);
  }
  if (neuro === 'anormal') out.push('Examen neurologique anormal');
  return out;
}
