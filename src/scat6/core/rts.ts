/**
 * Retour au sport (RTS) — 6 étapes, consensus d'Amsterdam 2022 — logique pure.
 *
 * Le patient n'a pas de compte : le médecin valide les étapes en consultation ou par téléphone, avec
 * la date réelle. L'application ne bloque rien : chaque règle non respectée devient un avertissement
 * que le médecin confirme (étapes déjà faites sur papier, certificat à établir rapidement…).
 *
 * Règles (Amsterdam 2022) :
 *  - au moins 24 h par étape ;
 *  - étapes 1–3 : symptômes légers et brefs tolérés ; aggravation nette → arrêt, nouvel essai le lendemain ;
 *  - étapes 4–6 seulement après disparition des symptômes, des troubles cognitifs et des signes cliniques,
 *    y compris à l'effort ; symptômes en étape 4–6 → retour à l'étape 3 ;
 *  - accord médical écrit avant le retour à la compétition.
 * Même texte des étapes que le serveur (Scat6Content::RTS_STEPS).
 */

export type RtsStepNumber = 1 | 2 | 3 | 4 | 5 | 6;
export const RTS_STEP_NUMBERS: RtsStepNumber[] = [1, 2, 3, 4, 5, 6];
export const RTS_MIN_HOURS = 24;
/** Étape à partir de laquelle il faut la disparition complète des symptômes et signes. */
export const RTS_RESOLUTION_STEP = 4;
export const RTS_CONTACT_STEP = 5;
export const RTS_COMPETITION_STEP = 6;

export type RtsStepInfo = { step: RtsStepNumber; title: string; detail: string; goal: string };

export const RTS_STEPS: RtsStepInfo[] = [
  {
    step: 1,
    title: 'Activités limitées par les symptômes',
    detail: 'Vie quotidienne qui n’aggrave pas les symptômes ; reprise progressive du travail ou de l’école.',
    goal: 'Retour progressif aux activités habituelles',
  },
  {
    step: 2,
    title: 'Exercice aérobie léger puis modéré',
    detail: 'Marche rapide, vélo d’appartement ; effort progressif, sans musculation lourde.',
    goal: 'Augmenter la fréquence cardiaque',
  },
  {
    step: 3,
    title: 'Exercices individuels spécifiques au sport',
    detail: 'Course, changements de direction, technique ; aucun risque de choc à la tête.',
    goal: 'Ajouter des mouvements, changer de direction',
  },
  {
    step: 4,
    title: 'Entraînement sans contact',
    detail: 'Intensité élevée, exercices plus complexes, avec l’équipe.',
    goal: 'Reprendre l’intensité habituelle, coordination, réflexion',
  },
  {
    step: 5,
    title: 'Entraînement avec contact complet',
    detail: 'Après accord médical.',
    goal: 'Retrouver la confiance, évaluation par l’encadrement',
  },
  {
    step: 6,
    title: 'Retour à la compétition',
    detail: 'Décision médicale.',
    goal: 'Jeu normal',
  },
];

export type RtsStepState = { started_at: string | null; done_at: string | null; forced?: boolean; note?: string | null };
export type RtsSetback = { at: string; from: RtsStepNumber; to: RtsStepNumber; note?: string | null };

export type RtsState = {
  current_step: RtsStepNumber;
  injury_at: string;
  steps: Partial<Record<string, RtsStepState>>;
  setbacks: RtsSetback[];
  notes: string | null;
};

const DAY = 86_400_000;

export const stepInfo = (step: number) => RTS_STEPS[step - 1];

/** Jours depuis le choc (J0 = jour du choc). */
export const daysSince = (date: string, now: Date = new Date()) => {
  const d = new Date(`${date.slice(0, 10)}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - d.getTime()) / DAY);
};

/** Contexte des avertissements : ce que le serveur sait du patient et du suivi. */
export type RtsContext = {
  /** Date au plus tôt pour la compétition fixée par la fédération (YYYY-MM-DD), null = pas de délai fixe. */
  earliestCompetition: string | null;
  /** Examens SCAT6 signés depuis le choc (hors baseline). */
  examsSinceInjury: { completed_at: string | null }[];
  sport: string;
};

export type RtsWarning = { code: string; text: string };

/**
 * Avertissements pour passer de l'étape en cours à `target` à la date `at` (YYYY-MM-DD ou ISO).
 * Vide = tout est conforme. Le médecin peut confirmer malgré les avertissements.
 */
export function moveWarnings(state: RtsState, target: RtsStepNumber, at: string, ctx: RtsContext): RtsWarning[] {
  const out: RtsWarning[] = [];
  const current = state.current_step;
  const when = new Date(at.length <= 10 ? `${at}T12:00:00` : at);

  if (target > current + 1) {
    const skipped = RTS_STEP_NUMBERS.filter((s) => s > current && s < target);
    out.push({
      code: 'skip',
      text: `Étape${skipped.length > 1 ? 's' : ''} ${skipped.join(', ')} validée${skipped.length > 1 ? 's' : ''} sans suivi dans l’application (déjà faite${skipped.length > 1 ? 's' : ''} ?).`,
    });
  }

  const started = state.steps[String(current)]?.started_at;
  if (started) {
    const hours = (when.getTime() - new Date(started).getTime()) / 3_600_000;
    // Comparaison au jour près : la date choisie n'a pas d'heure.
    if (hours < RTS_MIN_HOURS - 12) {
      out.push({ code: '24h', text: `Moins de 24 h à l’étape ${current} (commencée le ${new Date(started).toLocaleDateString('fr-FR')}).` });
    }
  }

  if (current < RTS_RESOLUTION_STEP && target >= RTS_RESOLUTION_STEP) {
    const retested = ctx.examsSinceInjury.length > 1;
    if (!retested) {
      out.push({ code: 'retest', text: 'Aucun re-test SCAT6 depuis l’examen initial : un re-test aide à vérifier la récupération avant l’étape 4.' });
    }
  }

  if (target === RTS_COMPETITION_STEP && ctx.earliestCompetition) {
    const earliest = new Date(`${ctx.earliestCompetition}T00:00:00`);
    if (when < earliest) {
      out.push({
        code: 'federation',
        text: `Avant le délai minimal de la fédération : compétition au plus tôt le ${earliest.toLocaleDateString('fr-FR')}.`,
      });
    }
  }
  if (target >= RTS_CONTACT_STEP && current < RTS_CONTACT_STEP && ctx.sport === 'football') {
    out.push({ code: 'fff', text: 'Football professionnel : l’examen par un médecin expert reconnu par la FFF est requis avant la reprise.' });
  }
  return out;
}

/** Points à vérifier par le médecin avant l'étape 4 (Amsterdam 2022). */
export const RESOLUTION_CHECKLIST = [
  'Plus aucun symptôme de commotion, y compris pendant et après l’effort',
  'Fonctions cognitives revenues à la normale',
  'Examen clinique normal (équilibre, oculomoteur, cervical…)',
];

const iso = (date: string) => (date.length <= 10 ? new Date(`${date}T12:00:00`).toISOString() : date);

/** Valide les étapes jusqu'à `target` (exclue) et commence `target` à la date `at`. */
export function moveTo(state: RtsState, target: RtsStepNumber, at: string, forced: boolean, note: string | null): RtsState {
  const when = iso(at);
  const steps = { ...state.steps };
  for (let s = state.current_step; s < target; s++) {
    const prev = steps[String(s)] ?? { started_at: when, done_at: null };
    steps[String(s)] = { ...prev, started_at: prev.started_at ?? when, done_at: when };
  }
  steps[String(target)] = { started_at: when, done_at: target === RTS_COMPETITION_STEP ? when : null, forced, note };
  return { ...state, current_step: target, steps };
}

/**
 * Symptômes revenus. Étapes 1–3 : on reste à l'étape, nouvel essai le lendemain.
 * Étapes 4–6 : retour à l'étape 3 (vérifier la disparition des symptômes à l'effort).
 */
export function setback(state: RtsState, at: string, note: string | null): RtsState {
  const when = iso(at);
  const from = state.current_step;
  const to: RtsStepNumber = from >= RTS_RESOLUTION_STEP ? 3 : from;
  const steps = { ...state.steps };
  if (to !== from) {
    for (let s = to + 1; s <= 6; s++) delete steps[String(s)];
    steps[String(to)] = { ...(steps[String(to)] ?? { started_at: when }), started_at: when, done_at: null };
  }
  return { ...state, current_step: to, steps, setbacks: [...state.setbacks, { at: when, from, to, note }] };
}

/** Annule la dernière validation (erreur de saisie) : retour à l'étape précédente. */
export function undoLast(state: RtsState): RtsState {
  if (state.current_step <= 1) return state;
  const prev = (state.current_step - 1) as RtsStepNumber;
  const steps = { ...state.steps };
  delete steps[String(state.current_step)];
  steps[String(prev)] = { ...(steps[String(prev)] as RtsStepState), done_at: null };
  return { ...state, current_step: prev, steps };
}

/* ===================== ÉTAT DU PATIENT ===================== */

export type PatientStatusCode = 'rts' | 'commotion' | 'retest' | 'reprise' | 'sans_restriction' | null;
export type PatientStatus = { code: PatientStatusCode; step?: number; rts_id?: number; since?: string | null };

/** Libellé et ton du badge d'état (jamais « apte » : chaque état est une décision du médecin). */
export const patientStatusLabel = (s: PatientStatus | null | undefined) => {
  switch (s?.code) {
    case 'rts':
      return { label: `Reprise · étape ${s.step}/6`, tone: 'warning' as const };
    case 'commotion':
      return { label: 'Commotion · reprise à suivre', tone: 'danger' as const };
    case 'retest':
      return { label: 'À re-tester', tone: 'warning' as const };
    case 'reprise':
      return { label: 'Compétition autorisée', tone: 'success' as const };
    case 'sans_restriction':
      return { label: 'Pas de commotion retenue', tone: 'neutral' as const };
    default:
      return null;
  }
};
