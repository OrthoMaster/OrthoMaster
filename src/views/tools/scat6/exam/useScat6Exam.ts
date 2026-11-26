import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { ExamKind, Scat6Data, Scat6Step, Scat6Tests } from '../../../../scat6/core/types';
import { saveScat6Draft, Scat6Error } from '../../../../services/v2/Scat6Service';

/** Examen tel qu'il est édité ; envoyé tel quel à PUT /scat/assessments/{uuid}. */
export type ExamRecord = {
  uuid: string;
  patient_id: number;
  exam_kind: ExamKind;
  injury_at: string | null;
  step: Scat6Step;
  started_at: string;
  data: Scat6Data;
};

export type SaveState = 'saved' | 'pending' | 'saving' | 'error';

/** Délai entre la dernière saisie et l'envoi : regroupe les clics rapides (grille des symptômes). */
const SAVE_DELAY_MS = 900;

/**
 * Tient l'examen en cours et le sauvegarde automatiquement (brouillon côté serveur), pour que rien
 * ne soit perdu si l'onglet se ferme. Les envois sont sérialisés et portent toujours le dernier état.
 *
 * onLocked : le serveur répond 409 (examen déjà signé ailleurs) → l'écran bascule sur le rapport.
 */
export const useScat6Exam = (initial: ExamRecord | null, onLocked: () => void) => {
  const [record, setRecord] = useState<ExamRecord | null>(initial);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ref en parallèle du state : les envois différés lisent toujours le dernier état.
  const latest = useRef<ExamRecord | null>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const dirty = useRef(false);
  const lastError = useRef<string | null>(null);
  const onLockedRef = useRef(onLocked);
  onLockedRef.current = onLocked;

  // Premier examen chargé (reprise d'un brouillon ou démarrage).
  useEffect(() => {
    if (initial && latest.current?.uuid !== initial.uuid) {
      latest.current = initial;
      setRecord(initial);
    }
  }, [initial]);

  const send = useCallback(() => {
    chain.current = chain.current.then(async () => {
      const current = latest.current;
      if (!current || !dirty.current) return;
      dirty.current = false;
      setSaveState('saving');
      try {
        await saveScat6Draft(current.uuid, {
          patient_id: current.patient_id,
          exam_kind: current.exam_kind,
          injury_at: current.injury_at,
          word_list: current.data.tests.memory.list,
          step: current.step,
          started_at: current.started_at,
          data: current.data,
        });
        setSavedAt(new Date());
        lastError.current = null;
        setSaveError(null);
        // Une saisie arrivée pendant l'envoi garde l'état « en attente ».
        setSaveState(dirty.current ? 'pending' : 'saved');
      } catch (e) {
        dirty.current = true;
        if (e instanceof Scat6Error && e.status === 409) {
          onLockedRef.current();
          return;
        }
        lastError.current = (e as Error)?.message ?? 'Enregistrement impossible.';
        setSaveError(lastError.current);
        setSaveState('error');
      }
    });
    return chain.current;
  }, []);

  const schedule = useCallback(() => {
    dirty.current = true;
    setSaveState('pending');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      send();
    }, SAVE_DELAY_MS);
  }, [send]);

  /** Envoie tout de suite ce qui attend (changement d'étape, sortie, signature). */
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await send();
  }, [send]);

  const change = useCallback(
    (next: (r: ExamRecord) => ExamRecord) => {
      const current = latest.current;
      if (!current) return;
      const updated = next(current);
      latest.current = updated;
      setRecord(updated);
      schedule();
    },
    [schedule]
  );

  const updateData = useCallback(
    (fn: (d: Scat6Data) => Scat6Data) => change((r) => ({ ...r, data: fn(r.data) })),
    [change]
  );

  const patchTests = useCallback(
    (part: Partial<Scat6Tests>) => updateData((d) => ({ ...d, tests: { ...d.tests, ...part } })),
    [updateData]
  );

  const answer = useCallback(
    (code: string, value: boolean | number | string | null) =>
      updateData((d) => ({
        ...d,
        answers: { ...d.answers, [code]: { value, status: 'done', at: new Date().toISOString() } },
      })),
    [updateData]
  );

  const setStep = useCallback((step: Scat6Step) => change((r) => ({ ...r, step })), [change]);

  /** Démarrage : l'examen existe côté serveur avant la première étape. Renvoie l'erreur éventuelle. */
  const create = useCallback(
    async (r: ExamRecord) => {
      latest.current = r;
      setRecord(r);
      dirty.current = true;
      await send();
      if (!dirty.current) return null;
      // Refusé : rien n'existe côté serveur, le formulaire de démarrage reste affiché avec le message.
      const message = lastError.current ?? 'Enregistrement impossible.';
      dirty.current = false;
      latest.current = null;
      setRecord(null);
      setSaveState('saved');
      return message;
    },
    [send]
  );

  // Web : prévenir avant de fermer l'onglet si une saisie n'est pas encore partie.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // En quittant l'écran : dernier envoi.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        send();
      }
    },
    [send]
  );

  return { record, saveState, savedAt, saveError, updateData, patchTests, answer, setStep, flush, create, retry: send };
};

export type Scat6ExamApi = ReturnType<typeof useScat6Exam>;
