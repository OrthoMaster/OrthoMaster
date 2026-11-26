import { LIST_IDS } from './content';
import type { ListId } from './types';

/**
 * Règles de sécurité SCAT6 gardées de scat-app (déterministes, sans IA).
 * R3 — l'outil ne dit jamais « apte / peut rejouer » : aucun texte de ce genre n'existe dans l'interface.
 */

/** Âge à partir de l'année de naissance seule : peut compter un an de trop avant l'anniversaire. */
export const ageFromYear = (year: number | null | undefined, now: Date = new Date()) =>
  year ? now.getFullYear() - year : null;

/** R5 — le SCAT6 s'applique à partir de 13 ans (avant : Child SCAT6). */
export const MIN_AGE = 13;
export const isScat6Allowed = (birthYear: number | null | undefined) => {
  const age = ageFromYear(birthYear);
  return age !== null && age >= MIN_AGE;
};

/** R6 — plus de 7 jours après le choc : proposer le SCOAT6. */
export const suggestScoat6 = (injuryAt: Date, now: Date = new Date()) =>
  now.getTime() - injuryAt.getTime() > 7 * 24 * 3600_000;

/** R8 — mémoire différée bloquée tant que 5 minutes ne sont pas passées depuis la fin de la mémoire immédiate. */
export const DELAYED_RECALL_MIN_MS = 5 * 60_000;
export const delayedRecallRemainingMs = (immediateEndedAt: Date, now: Date = new Date()) =>
  Math.max(0, immediateEndedAt.getTime() + DELAYED_RECALL_MIN_MS - now.getTime());

/** R9 — marche en tandem seulement si l'équilibre (mBESS) est normal. */
export const canDoTandemGait = (mbessNormal: boolean | null) => mbessNormal === true;

/** Liste proposée : différente de la dernière utilisée pour ce patient (A → B → C → A). */
export const suggestList = (lastUsed: ListId | null | undefined): ListId =>
  lastUsed ? LIST_IDS[(LIST_IDS.indexOf(lastUsed) + 1) % LIST_IDS.length] : 'A';
