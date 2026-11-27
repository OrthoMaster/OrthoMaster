import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import Spacings from '../../../../../constants/Spacings';
import { useGetUser } from '../../../../hooks/auth.hook';
import { MBESS_INFO, SKIP_REASONS, STEP_GROUPS, STEP_INFO, examLabel, sportLabel } from '../../../../scat6/core/content';
import { delayedRecallRemainingMs } from '../../../../scat6/core/rules';
import { EMPTY_DATA, formatScore, summarize } from '../../../../scat6/core/scoring';
import { SCAT6_STEPS, Scat6Step, SkippablePart } from '../../../../scat6/core/types';
import { preloadCues } from '../../../../scat6/cues';
import {
  completeScat6Assessment,
  getScat6Assessment,
  getScat6Patient,
  Scat6AssessmentDetail,
} from '../../../../services/v2/Scat6Service';
import { showScat6Dialog, scat6Notify } from '../components/Scat6Dialog';
import { Scat6Badge, Scat6Button, Scat6Empty, Scat6Header, Scat6Link, Scat6Loading } from '../components/Scat6UI';
import { invalidateScat6, scat6ExamKey, scat6PatientKey, useHideScat6TabBar } from '../scat6Queries';
import { formatTime } from '../scat6Format';
import { SCAT, FONTS, WEB_SIDEBAR_WIDTH } from '../scat6Theme';
import { ExamStart } from './ExamStart';
import { DecisionStep } from './StepDecision';
import { BackgroundStep, OrientationStep, SymptomsStep } from './StepsHistory';
import { ConcentrationStep, DelayedRecallStep, MemoryStep } from './StepsMemory';
import { BalanceStep, TandemStep } from './StepsBalance';
import { SKIPPABLE, applySkip, isStepAvailable, nextStep, previousStep, stepMissing } from './stepRules';
import type { StepProps } from './stepTypes';
import { ExamRecord, useScat6Exam } from './useScat6Exam';
import { Scat6ScrollView } from '../components/Scat6ScrollView';

/** Largeur de la colonne des étapes ; en dessous de STEPPER_FROM, une barre de progression la remplace. */
const STEPPER_WIDTH = 280;
const STEPPER_FROM = 980;

const STEP_COMPONENTS: Partial<Record<Scat6Step, React.FC<StepProps>>> = {
  renseignements: BackgroundStep,
  symptomes: SymptomsStep,
  orientation: OrientationStep,
  memoire: MemoryStep,
  concentration: ConcentrationStep,
  equilibre: BalanceStep,
  tandem: TandemStep,
  'memoire-differee': DelayedRecallStep,
};

const toRecord = (d: Scat6AssessmentDetail): ExamRecord => ({
  uuid: d.uuid,
  patient_id: d.patient_id,
  exam_kind: d.exam_kind,
  injury_at: d.injury_at,
  step: d.step && (SCAT6_STEPS as readonly string[]).includes(d.step) ? (d.step as Scat6Step) : 'renseignements',
  started_at: d.started_at ?? new Date().toISOString(),
  data: { ...EMPTY_DATA(d.word_list), ...d.data, skipped: d.data?.skipped ?? {} },
});

/**
 * Examen SCAT6 (web) : démarrage, puis les étapes 1 → 6 dans une seule page.
 * Colonne de gauche : étapes (état, saut libre), scores en direct, délai de la mémoire différée.
 * Chaque saisie est enregistrée automatiquement (brouillon) ; la signature fige l'examen.
 *
 * Paramètres : { uuid } pour reprendre, ou { patientId, kind } pour commencer.
 */
export const Scat6ExamView = ({ navigation, route }: { navigation: any; route: any }) => {
  useHideScat6TabBar(navigation);
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const showStepper = width - WEB_SIDEBAR_WIDTH >= STEPPER_FROM;
  const { data: user } = useGetUser();

  const uuid: string | undefined = route.params?.uuid;
  const patientId = Number(route.params?.patientId) || null;

  /* ---- Chargement ---- */

  // Reprise : l'examen fait foi au chargement ; ensuite seul l'état local compte (pas de relecture au focus).
  const detailQuery = useQuery({
    queryKey: scat6ExamKey(uuid ?? ''),
    queryFn: () => getScat6Assessment(uuid!),
    enabled: !!uuid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const detail = detailQuery.data;

  const patientQuery = useQuery({
    queryKey: scat6PatientKey(patientId ?? 0),
    queryFn: () => getScat6Patient(patientId!),
    enabled: !uuid && !!patientId,
  });

  const initial = useMemo(() => (detail && detail.status === 'draft' ? toRecord(detail) : null), [detail]);

  const openReport = useCallback(
    (id: string) => {
      invalidateScat6(queryClient);
      navigation.replace('scat6-report', { uuid: id });
    },
    [navigation, queryClient]
  );

  const exam = useScat6Exam(initial, () => uuid && openReport(uuid));
  const record = exam.record;

  // Examen déjà signé (lien vers un brouillon d'un autre onglet…) : directement le rapport.
  useEffect(() => {
    if (detail?.status === 'completed') openReport(detail.uuid);
  }, [detail?.status]);

  useEffect(() => {
    preloadCues();
  }, []);

  /* ---- Horloge (délai de la mémoire différée, orientation) ---- */

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- Navigation entre étapes ---- */

  const scrollRef = useRef<ScrollView>(null);
  const targets = useRef<Record<string, any>>({});
  const target = useCallback((key: string) => (node: any) => {
    targets.current[key] = node;
  }, []);
  const [attempt, setAttempt] = useState(0);

  const goTo = useCallback(
    (step: Scat6Step) => {
      if (!record) return;
      // Quitter la mémoire après le 3e essai la termine : le délai de 5 minutes part de là (R8).
      const mem = record.data.tests.memory;
      if (record.step === 'memoire' && step !== 'memoire' && !mem.endedAt && (mem.current ?? 0) >= 2) {
        exam.patchTests({ memory: { ...mem, endedAt: new Date().toISOString() } });
      }
      exam.setStep(step);
      setAttempt(0);
      exam.flush();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [record, exam]
  );

  const next = () => {
    if (!record) return;
    const missing = stepMissing(record.step, record.data, now);
    if (missing) {
      setAttempt((a) => a + 1);
      targets.current[missing.key]?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Étape terminée normalement : elle n'est plus « non réalisée ».
    const step = record.step as SkippablePart;
    if (record.data.skipped[step]) {
      exam.updateData((d) => {
        const { [step]: _removed, ...rest } = d.skipped;
        return { ...d, skipped: rest };
      });
    }
    const to = nextStep(record.step, record.data);
    if (to) goTo(to);
  };

  const previous = () => {
    if (!record) return;
    const to = previousStep(record.step, record.data);
    if (to) goTo(to);
  };

  const skip = () => {
    if (!record) return;
    const step = record.step as SkippablePart;
    showScat6Dialog({
      title: 'Partie non réalisée ?',
      message: 'Elle sera notée « non réalisé » dans le rapport, avec la raison choisie (jamais comptée comme 0).',
      buttons: [
        ...SKIP_REASONS.map((reason) => ({
          text: reason,
          onPress: () => {
            exam.updateData((d) => ({ ...applySkip(step, d), skipped: { ...d.skipped, [step]: reason } }));
            // Données à jour pour le choix de l'étape suivante (équilibre non réalisé → pas de tandem).
            const to = nextStep(record.step, applySkip(step, record.data));
            if (to) goTo(to);
          },
        })),
        { text: 'Annuler', style: 'cancel' as const },
      ],
    });
  };

  /* ---- Démarrage, sortie, signature ---- */

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const start = async ({ kind, injuryAt, list }: { kind: any; injuryAt: string | null; list: any }) => {
    if (!patientId) return;
    setStarting(true);
    setStartError(null);
    const id = Crypto.randomUUID();
    const error = await exam.create({
      uuid: id,
      patient_id: patientId,
      exam_kind: kind,
      injury_at: injuryAt,
      step: 'renseignements',
      started_at: new Date().toISOString(),
      data: EMPTY_DATA(list),
    });
    setStarting(false);
    if (error) {
      setStartError(error);
      return;
    }
    invalidateScat6(queryClient);
    navigation.setParams({ uuid: id, patientId: undefined, kind: undefined });
  };

  const exit = async () => {
    await exam.flush();
    invalidateScat6(queryClient);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('scat6-patient', { patientId: record?.patient_id ?? patientId });
  };

  const [signing, setSigning] = useState(false);
  const sign = async (input: { diagnosis: any; neuro: any; notes: string }) => {
    if (!record) return;
    setSigning(true);
    try {
      await exam.flush();
      await completeScat6Assessment(record.uuid, { ...input, attested: true });
      openReport(record.uuid);
    } catch (e: any) {
      scat6Notify('Signature impossible', e?.message ?? 'Réessayez.');
    } finally {
      setSigning(false);
    }
  };

  /* ---- Rendu ---- */

  const patient = detail?.patient ?? patientQuery.data ?? null;

  if (!uuid) {
    if (patientQuery.isLoading) return <Scat6Loading />;
    if (!patientQuery.data) {
      return (
        <View style={styles.page}>
          <Scat6Header title="Nouvel examen" onBack={() => navigation.goBack()} />
          <Scat6Empty icon="person-outline" title="Patient introuvable" />
        </View>
      );
    }
    return (
      <View style={styles.page}>
        <Scat6Header
          title={`Nouvel examen · ${patientQuery.data.name}`}
          subtitle={`${sportLabel(patientQuery.data.sport)} · né·e en ${patientQuery.data.birth_year}`}
          onBack={() => navigation.goBack()}
        />
        <ExamStart
          patient={patientQuery.data}
          initialKind={route.params?.kind}
          starting={starting}
          error={startError}
          onStart={start}
        />
      </View>
    );
  }

  if (!record) {
    if (detailQuery.isLoading || detail?.status === 'completed') return <Scat6Loading />;
    return (
      <View style={styles.page}>
        <Scat6Header title="Examen" onBack={() => navigation.goBack()} />
        <Scat6Empty
          icon="document-outline"
          title="Examen introuvable"
          message="Il a peut-être été abandonné."
          action={<Scat6Button title="Réessayer" icon="refresh" variant="secondary" onPress={() => detailQuery.refetch()} />}
        />
      </View>
    );
  }

  const data = record.data;
  const step = record.step;
  const info = STEP_INFO[step];
  const missing = stepMissing(step, data, now);
  const summary = summarize(data);
  const skippable = (SKIPPABLE as string[]).includes(step);
  const Step = STEP_COMPONENTS[step];
  const stepProps: StepProps = { exam, record, data, showMissing: attempt > 0, target, now };
  const remaining = data.tests.memory.endedAt ? delayedRecallRemainingMs(new Date(data.tests.memory.endedAt), new Date(now)) : null;
  const order = SCAT6_STEPS.filter((s) => isStepAvailable(s, data) || s === 'tandem');
  const position = SCAT6_STEPS.indexOf(step);
  const baseline = detail?.baseline ?? null;

  return (
    <View style={styles.page}>
      <Scat6Header
        title={`SCAT6 · ${patient?.name ?? ''}`}
        subtitle={`${examLabel(record.exam_kind)}${
          record.injury_at ? ` · choc du ${new Date(record.injury_at).toLocaleDateString('fr-FR')}` : ''
        }`}
        onBack={exit}
        backLabel="Quitter (l’examen reste enregistré)"
        right={<SaveIndicator state={exam.saveState} savedAt={exam.savedAt} error={exam.saveError} onRetry={exam.retry} />}
      />

      <View style={styles.body}>
        {showStepper && (
          <ScrollView style={styles.stepper} contentContainerStyle={styles.stepperContent}>
            {STEP_GROUPS.map((group) => {
              const steps = group.steps.filter((x) => order.includes(x));
              const status = (x: Scat6Step) => {
                const available = isStepAvailable(x, data);
                const skipped = !!data.skipped[x as SkippablePart];
                return {
                  available,
                  skipped,
                  current: x === step,
                  complete: !skipped && x !== 'decision' && stepMissing(x, data, now) === null && SCAT6_STEPS.indexOf(x) < position,
                  locked: x === 'memoire-differee' && remaining !== null && remaining > 0,
                };
              };
              const note = (x: Scat6Step) => {
                const st = status(x);
                if (!st.available) return <Text style={styles.stepNote}>Sautée (équilibre non normal)</Text>;
                if (st.skipped) return <Text style={styles.stepNote}>Non réalisée</Text>;
                if (st.locked) {
                  return (
                    <Text style={[styles.stepNote, { color: SCAT.blueDark }]}>
                      Dans {Math.floor(remaining! / 60000)}:{String(Math.floor((remaining! % 60000) / 1000)).padStart(2, '0')}
                    </Text>
                  );
                }
                return null;
              };

              // Étape à une seule partie : une ligne, comme avant.
              if (steps.length === 1) {
                const x = steps[0];
                const st = status(x);
                return (
                  <Pressable
                    key={group.number}
                    disabled={!st.available}
                    onPress={() => goTo(x)}
                    style={({ hovered }: any) => [styles.stepItem, st.current && styles.stepItemCurrent, hovered && !st.current && st.available && styles.stepItemHover]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: st.current, disabled: !st.available }}
                  >
                    <StepDot number={group.number} current={st.current} complete={st.complete} off={st.skipped || !st.available} />
                    <View style={styles.flex}>
                      <Text style={[styles.stepTitle, st.current && styles.stepTitleCurrent, !st.available && styles.stepTitleOff]}>{group.title}</Text>
                      {note(x)}
                    </View>
                  </Pressable>
                );
              }

              // Étape à plusieurs parties : le numéro une seule fois, les parties en arbre dessous.
              const states = steps.map(status);
              const inGroup = steps.includes(step);
              const done = states.every((st) => st.complete || st.skipped || !st.available) && states.some((st) => st.complete);
              const first = steps.find((x) => isStepAvailable(x, data)) ?? steps[0];
              return (
                <View key={group.number}>
                  <Pressable
                    onPress={() => goTo(first)}
                    style={({ hovered }: any) => [styles.stepItem, hovered && !inGroup && styles.stepItemHover]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: inGroup }}
                  >
                    <StepDot number={group.number} current={inGroup} complete={done && !inGroup} />
                    <Text style={[styles.flex, styles.stepTitle, inGroup && styles.stepTitleCurrent]}>{group.title}</Text>
                  </Pressable>
                  {steps.map((x, i) => {
                    const st = states[i];
                    const last = i === steps.length - 1;
                    return (
                      <Pressable
                        key={x}
                        disabled={!st.available}
                        onPress={() => goTo(x)}
                        style={({ hovered }: any) => [styles.subItem, st.current && styles.stepItemCurrent, hovered && !st.current && st.available && styles.stepItemHover]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: st.current, disabled: !st.available }}
                      >
                        {/* Branche de l'arbre : trait vertical depuis le numéro, coude vers la partie. */}
                        <View style={styles.branch}>
                          <View style={[styles.branchLine, last && styles.branchLineLast]} />
                          <View style={styles.branchElbow} />
                        </View>
                        <View
                          style={[
                            styles.subDot,
                            st.current && styles.stepDotCurrent,
                            st.complete && styles.stepDotDone,
                            (st.skipped || !st.available) && styles.stepDotOff,
                          ]}
                        >
                          {st.complete ? <Ionicons name="checkmark" size={11} color={SCAT.card} /> : null}
                        </View>
                        <View style={styles.flex}>
                          <Text style={[styles.subTitle, st.current && styles.stepTitleCurrent, !st.available && styles.stepTitleOff]}>
                            {STEP_INFO[x].title}
                          </Text>
                          {note(x)}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}

            <View style={styles.live}>
              <Text style={styles.liveTitle}>Scores en direct</Text>
              <LiveRow label="Symptômes" value={summary.symptom_count === null ? '—' : `${summary.symptom_count}/22 · ${summary.symptom_severity}/132`} />
              <LiveRow label="Orientation" value={formatScore(summary.orientation, 5)} />
              <LiveRow label="Mémoire immédiate" value={formatScore(summary.immediate, 30)} />
              <LiveRow label="Concentration" value={formatScore(summary.concentration, 5)} />
              <LiveRow label="Mémoire différée" value={formatScore(summary.delayed, 10)} />
              <LiveRow label="Total cognitif" value={formatScore(summary.cognitive_total, 50)} strong />
              <LiveRow label="mBESS" value={formatScore(summary.mbess, 30)} />
              {summary.tandem_best !== null && <LiveRow label="Marche sur une ligne" value={`${summary.tandem_best} s`} />}
            </View>
          </ScrollView>
        )}

        <View style={styles.main}>
          {!showStepper && (
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${((position + 1) / SCAT6_STEPS.length) * 100}%` }]} />
            </View>
          )}
          {/* En-tête de l'étape : fixe, seul le contenu dessous défile. */}
          <View style={styles.stepHeadBar}>
            <View style={[styles.column, styles.stepHead]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Étape {info.number}</Text>
              </View>
              <Text style={styles.stepHeadTitle}>{info.title}</Text>
              {step === 'equilibre' ? (
                <Pressable
                  onPress={() => showScat6Dialog({ title: MBESS_INFO.title, message: MBESS_INFO.message, buttons: [{ text: 'Compris' }] })}
                  style={({ hovered }: any) => [styles.infoButton, hovered && styles.stepItemHover]}
                  accessibilityRole="button"
                  accessibilityLabel="Qu’est-ce que le mBESS ?"
                >
                  <Ionicons name="information-circle-outline" size={26} color={SCAT.blueDark} />
                </Pressable>
              ) : null}
              {data.skipped[step as SkippablePart] ? (
                <Scat6Badge label={`Non réalisée : ${data.skipped[step as SkippablePart]}`} tone="warning" />
              ) : null}
            </View>
          </View>
          <Scat6ScrollView ref={scrollRef} contentContainerStyle={styles.mainContent}>
            <View style={styles.column}>
              {step === 'decision' ? (
                <DecisionStep
                  {...stepProps}
                  baseline={baseline}
                  doctorName={`${user?.first_name ?? ''} ${user?.name ?? ''}`.trim()}
                  signing={signing}
                  onSign={sign}
                />
              ) : Step ? (
                <Step {...stepProps} />
              ) : null}
            </View>
          </Scat6ScrollView>

          {/* ---- Barre d'actions ---- */}
          <View style={styles.footer}>
            <View style={styles.footerInner}>
              {previousStep(step, data) ? (
                <Scat6Button title="Précédent" icon="arrow-back" variant="secondary" onPress={previous} />
              ) : (
                <View />
              )}
              <View style={styles.footerCenter}>
                {attempt > 0 && missing ? (
                  <View style={styles.missing}>
                    <Ionicons name="alert-circle" size={18} color={SCAT.draft} />
                    <Text style={styles.missingText}>{missing.hint}</Text>
                  </View>
                ) : skippable ? (
                  <Scat6Link title="Partie non réalisée…" icon="remove-circle-outline" onPress={skip} />
                ) : null}
              </View>
              {step !== 'decision' ? (
                <Scat6Button
                  title={step === 'memoire' && !data.tests.memory.endedAt ? 'Terminer les essais' : 'Suivant'}
                  icon="arrow-forward"
                  onPress={next}
                />
              ) : (
                <View />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

/** Pastille numérotée d'une étape (coche quand terminée, tiret quand non réalisée ou sautée). */
const StepDot: React.FC<{ number: number; current?: boolean; complete?: boolean; off?: boolean }> = ({ number, current, complete, off }) => (
  <View style={[styles.stepDot, current && styles.stepDotCurrent, complete && styles.stepDotDone, off && styles.stepDotSkipped]}>
    {complete ? (
      <Ionicons name="checkmark" size={16} color={SCAT.card} />
    ) : off ? (
      <Ionicons name="remove" size={16} color={SCAT.card} />
    ) : (
      <Text style={[styles.stepNum, current && { color: SCAT.card }]}>{number}</Text>
    )}
  </View>
);

const LiveRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <View style={styles.liveRow}>
    <Text style={[styles.liveLabel, strong && styles.liveStrong]}>{label}</Text>
    <Text style={[styles.liveValue, strong && styles.liveStrong]}>{value}</Text>
  </View>
);

/** État de la sauvegarde automatique, dans l'en-tête. */
const SaveIndicator: React.FC<{ state: string; savedAt: Date | null; error: string | null; onRetry: () => void }> = ({
  state,
  savedAt,
  error,
  onRetry,
}) => {
  if (state === 'error') {
    return (
      <Pressable style={[styles.save, styles.saveError]} onPress={onRetry} accessibilityRole="button" accessibilityLabel={error ?? 'Réessayer'}>
        <Ionicons name="cloud-offline-outline" size={16} color={SCAT.card} />
        <Text style={styles.saveText}>Non enregistré · réessayer</Text>
      </Pressable>
    );
  }
  const busy = state === 'pending' || state === 'saving';
  return (
    <View style={styles.save}>
      <Ionicons name={busy ? 'sync-outline' : 'cloud-done-outline'} size={16} color={SCAT.card} />
      <Text style={styles.saveText}>{busy ? 'Enregistrement…' : savedAt ? `Enregistré à ${formatTime(savedAt.toISOString())}` : 'Enregistré'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  /* ---- Page ---- */
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  /* ---- Étapes ---- */
  stepper: {
    width: STEPPER_WIDTH,
    flexGrow: 0,
    backgroundColor: SCAT.card,
    borderRightWidth: 1,
    borderRightColor: SCAT.line,
  },
  stepperContent: {
    padding: Spacings.md,
    gap: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: 9,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
  },
  stepItemCurrent: {
    backgroundColor: SCAT.blueSoft,
  },
  stepItemHover: {
    backgroundColor: '#F6F9FD',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCurrent: {
    backgroundColor: SCAT.blue,
    borderColor: SCAT.blueDark,
  },
  stepDotDone: {
    backgroundColor: SCAT.success,
    borderColor: SCAT.success,
  },
  stepDotSkipped: {
    backgroundColor: SCAT.faint,
    borderColor: SCAT.faint,
  },
  stepDotOff: {
    backgroundColor: SCAT.line,
    borderColor: SCAT.line,
  },
  /* Parties d'une étape (arbre sous le numéro) */
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    minHeight: 38,
    paddingRight: Spacings.sm,
    borderRadius: 12,
  },
  // Aligné sur le centre de la pastille du numéro (stepItem : padding sm + 15 px).
  branch: {
    width: Spacings.sm + 22,
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  branchLine: {
    marginLeft: Spacings.sm + 14,
    width: 2,
    backgroundColor: SCAT.blueLine,
  },
  branchLineLast: {
    height: '50%',
  },
  branchElbow: {
    alignSelf: 'center',
    width: 6,
    height: 2,
    backgroundColor: SCAT.blueLine,
  },
  subDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.text,
  },
  stepNum: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: SCAT.blueDark,
  },
  stepTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  stepTitleCurrent: {
    color: SCAT.blueInk,
    fontFamily: FONTS.title,
  },
  stepTitleOff: {
    color: SCAT.faint,
  },
  stepNote: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.muted,
  },
  live: {
    marginTop: Spacings.md,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
    gap: 6,
  },
  liveTitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: SCAT.blueDark,
    marginBottom: 2,
  },
  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacings.xs,
  },
  liveLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  liveValue: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.text,
  },
  liveStrong: {
    fontFamily: FONTS.title,
    color: SCAT.blueInk,
  },

  /* ---- Contenu ---- */
  main: {
    flex: 1,
  },
  progress: {
    height: 4,
    backgroundColor: SCAT.blueSoft,
  },
  progressFill: {
    height: '100%',
    backgroundColor: SCAT.blue,
  },
  mainContent: {
    padding: Spacings.lg,
    paddingBottom: Spacings.xxl,
  },
  column: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    gap: Spacings.md,
  },
  stepHeadBar: {
    backgroundColor: SCAT.page,
    borderBottomWidth: 1,
    borderBottomColor: SCAT.line,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
  },
  infoButton: {
    borderRadius: 999,
    padding: 2,
  },
  stepHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  stepBadge: {
    backgroundColor: SCAT.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.card,
  },
  stepHeadTitle: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: SCAT.blueInk,
  },

  /* ---- Barre d'actions ---- */
  footer: {
    backgroundColor: SCAT.card,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.lg,
  },
  footerInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  missing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SCAT.draftSoft,
    borderRadius: 999,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
  },
  missingText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#8A4B00',
  },

  /* ---- Sauvegarde ---- */
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  saveError: {
    backgroundColor: SCAT.danger,
  },
  saveText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.card,
  },
});
