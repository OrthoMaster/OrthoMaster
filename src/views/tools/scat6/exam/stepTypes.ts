import type { Scat6Data } from '../../../../scat6/core/types';
import type { Scat6ExamApi, ExamRecord } from './useScat6Exam';

/** Ce que reçoit chaque étape de l'examen. */
export interface StepProps {
  exam: Scat6ExamApi;
  record: ExamRecord;
  data: Scat6Data;
  /** « Suivant » a été pressé avec un manque : les éléments non remplis sont surlignés. */
  showMissing: boolean;
  /** Enregistre un élément comme cible de défilement (clé de stepMissing). */
  target: (key: string) => (node: any) => void;
  /** Horloge partagée (1 s) : délai de la mémoire différée. */
  now: number;
}
