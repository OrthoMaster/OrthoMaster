import { BACKGROUND, ORIENTATION, SYMPTOMS } from '../../../../scat6/core/content';
import { canDoTandemGait, delayedRecallRemainingMs } from '../../../../scat6/core/rules';
import { digitsState } from '../../../../scat6/core/scoring';
import { SCAT6_STEPS, Scat6Data, Scat6Step, SkippablePart } from '../../../../scat6/core/types';

/**
 * Ce qui manque pour quitter une étape par « Suivant » : la cible à surligner (clé d'un élément
 * enregistré par l'étape) et le message. null = étape complète.
 */
export type Missing = { key: string; hint: string } | null;

export const stepMissing = (step: Scat6Step, data: Scat6Data, now: number): Missing => {
  const a = data.answers;
  const t = data.tests;
  switch (step) {
    case 'renseignements': {
      const item = BACKGROUND.find((i) => a[i.code]?.status !== 'done');
      return item ? { key: item.code, hint: 'Répondez à chaque question (Oui / Non).' } : null;
    }
    case 'symptomes': {
      const item = SYMPTOMS.find((i) => a[i.code]?.status !== 'done');
      return item ? { key: item.code, hint: 'Notez chaque symptôme de 0 (aucun) à 6 (sévère).' } : null;
    }
    case 'orientation': {
      const item = ORIENTATION.find((i) => a[i.code]?.status !== 'done');
      return item ? { key: item.code, hint: 'Notez chaque réponse : correcte ou incorrecte.' } : null;
    }
    case 'memoire':
      return !t.memory.endedAt && (t.memory.current ?? 0) < 2
        ? { key: 'trials', hint: 'Les 3 essais sont toujours réalisés : passez à l’essai suivant.' }
        : null;
    case 'concentration':
      if (!digitsState(t.digits.results).done) return { key: 'digits', hint: 'Notez chaque série : « Réussi » ou « Échoué ».' };
      if (!t.months.done) return { key: 'months', hint: 'Chronométrez les mois à l’envers.' };
      return null;
    case 'equilibre': {
      if (!t.mbess.foot) return { key: 'foot', hint: 'Choisissez le pied testé.' };
      const i = t.mbess.firm.findIndex((v) => v === null);
      if (i >= 0) return { key: `firm-${i}`, hint: 'Saisissez le nombre d’erreurs de chaque position (0 si aucune).' };
      if (t.mbess.foam) {
        const j = t.mbess.foam.findIndex((v) => v === null);
        if (j >= 0) return { key: `foam-${j}`, hint: 'Complétez le test sur sol instable (mousse), ou retirez-le.' };
      }
      if (t.mbess.normal === null) return { key: 'normal', hint: 'Indiquez si l’examen de l’équilibre est normal.' };
      return null;
    }
    case 'tandem':
      return t.tandem.done ? null : { key: 'chrono', hint: 'Chronométrez au moins un essai (ou notez « Échec »).' };
    case 'memoire-differee': {
      if (!t.memory.endedAt) return { key: 'lock', hint: 'La mémoire immédiate n’a pas été terminée.' };
      return delayedRecallRemainingMs(new Date(t.memory.endedAt), new Date(now)) > 0 && !t.delayed.early
        ? { key: 'lock', hint: 'Attendez la fin du délai de 5 minutes (ou « Commencer maintenant »).' }
        : null;
    }
    case 'decision':
      return null;
  }
};

/** Étapes que le médecin peut noter « non réalisé » (avec une raison, jamais comptées 0). */
export const SKIPPABLE: SkippablePart[] = ['concentration', 'equilibre', 'tandem', 'memoire-differee'];

/**
 * R9 : la marche en tandem n'a lieu que si l'équilibre est normal. Tant que l'équilibre n'est pas
 * renseigné, l'étape reste proposée (« Suivant » sur l'équilibre exige la réponse).
 */
export const isStepAvailable = (step: Scat6Step, data: Scat6Data) =>
  step !== 'tandem' || data.tests.mbess.normal === null || canDoTandemGait(data.tests.mbess.normal);

export const nextStep = (from: Scat6Step, data: Scat6Data): Scat6Step | null => {
  for (let i = SCAT6_STEPS.indexOf(from) + 1; i < SCAT6_STEPS.length; i++) {
    if (isStepAvailable(SCAT6_STEPS[i], data)) return SCAT6_STEPS[i];
  }
  return null;
};

export const previousStep = (from: Scat6Step, data: Scat6Data): Scat6Step | null => {
  for (let i = SCAT6_STEPS.indexOf(from) - 1; i >= 0; i--) {
    if (isStepAvailable(SCAT6_STEPS[i], data)) return SCAT6_STEPS[i];
  }
  return null;
};

/** Effet d'un « non réalisé » sur les données (le score de la partie reste null). */
export const applySkip = (step: SkippablePart, data: Scat6Data): Scat6Data => {
  const t = data.tests;
  switch (step) {
    case 'equilibre':
      // Équilibre non évalué : pas de tandem non plus (R9).
      return { ...data, tests: { ...t, mbess: { ...t.mbess, normal: false } } };
    case 'tandem':
      return { ...data, tests: { ...t, tandem: { ...t.tandem, done: false } } };
    case 'memoire-differee':
      return { ...data, tests: { ...t, delayed: { recalled: [], done: false } } };
    default:
      return data;
  }
};
