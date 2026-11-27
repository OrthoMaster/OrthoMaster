/**
 * Types SCAT6 — TypeScript pur, sans React (repris de scat-app).
 * Le format de `data` est celui stocké tel quel par le serveur (scat_assessments.data) :
 * ne pas renommer une clé sans adapter Scat6Scoring.php et le rapport PDF.
 */

/**
 *  done           → répondu
 *  not_done       → « non réalisé » (R7 : jamais compté 0 ni maximum)
 */
export type AnswerStatus = 'done' | 'not_done';

export type Answer<V = boolean | number | string> = {
  value: V | null;
  status: AnswerStatus;
  at: string;
};

export type Answers = Record<string, Answer | undefined>;

export type ListId = 'A' | 'B' | 'C';

/** Examen hors terrain. Pas d'évaluation finale retour au sport dans cette version. */
export type ExamKind = 'post_choc' | 'retest' | 'baseline';

export type SportId = 'football' | 'judo' | 'hockey_glace' | 'general';

export type Scat6Tests = {
  /** current : essai en cours de saisie (0–2), gardé pour reprendre au bon essai. */
  memory: { list: ListId; trials: [string[], string[], string[]]; endedAt: string | null; current?: number };
  /** results[i] = essais de la longueur 3 + i (true = réussi). */
  digits: { list: ListId; results: boolean[][] };
  months: { seconds: number | null; errors: number | null; done: boolean };
  mbess: { foot: 'gauche' | 'droite' | null; firm: (number | null)[]; foam: (number | null)[] | null; normal: boolean | null };
  /** Essai de tandem : secondes, -1 = échec, null = pas fait. */
  tandem: {
    trials: (number | null)[];
    dualBest: number | null;
    dualErrors: number | null;
    done: boolean;
    /** Double tâche : essais chronométrés (s, -1 = échec) ; dualBest = meilleur temps réussi. */
    dualTrials?: (number | null)[];
    /** Double tâche : nombres de la suite 88, 81… que le patient a manqués (dualErrors = leur nombre). */
    dualWrong?: number[];
  };
  delayed: { recalled: string[]; done: boolean };
};

/**
 * Étapes de l'examen, dans l'ordre du SCAT6 (le numéro officiel est dans STEP_INFO).
 * La marche en tandem est sautée si l'équilibre n'est pas normal (R9).
 */
export const SCAT6_STEPS = [
  'renseignements',
  'symptomes',
  'orientation',
  'memoire',
  'concentration',
  'equilibre',
  'tandem',
  'memoire-differee',
  'decision',
] as const;
export type Scat6Step = (typeof SCAT6_STEPS)[number];

/** Étapes qu'on peut noter « non réalisé » (mêmes clés que Scat6Content::STEPS côté serveur). */
export type SkippablePart = Exclude<Scat6Step, 'renseignements' | 'decision'>;

export type Scat6Data = {
  answers: Answers;
  tests: Scat6Tests;
  /** Partie notée « non réalisé » → raison donnée par le médecin (affichée dans le rapport). */
  skipped: Partial<Record<SkippablePart, string>>;
  percent_normal: number | null;
  background_notes: string;
};

export type Scat6Summary = {
  symptom_count: number | null;
  symptom_severity: number | null;
  orientation: number | null;
  immediate: number | null;
  concentration: number | null;
  delayed: number | null;
  cognitive_total: number | null;
  mbess: number | null;
  mbess_foam: number | null;
  tandem_best: number | null;
  dual_best: number | null;
};

export type Neuro = 'normal' | 'anormal' | 'non_realise';
export type Diagnosis = 'oui' | 'non' | 'differe';
