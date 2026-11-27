import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Spacings from '../../../../../constants/Spacings';
import { returnLines, sportLabel } from '../../../../scat6/core/content';
import {
  RTS_COMPETITION_STEP,
  RTS_CONTACT_STEP,
  RTS_RESOLUTION_STEP,
  RTS_STEPS,
  RtsContext,
  RtsState,
  daysSince,
  moveTo,
  setback,
  undoLast,
} from '../../../../scat6/core/rts';
import {
  Scat6RtsDetail,
  createScat6Rts,
  deleteScat6Rts,
  getScat6Patient,
  getScat6Rts,
  openScat6Certificate,
  updateScat6Rts,
} from '../../../../services/v2/Scat6Service';
import { scat6Confirm, scat6Notify } from '../components/Scat6Dialog';
import { Scat6DateInput, todayIso } from '../components/Scat6DateInput';
import { Scat6ScrollView } from '../components/Scat6ScrollView';
import {
  Scat6Badge,
  Scat6Button,
  Scat6Card,
  Scat6Empty,
  Scat6Field,
  Scat6Header,
  Scat6Link,
  Scat6Loading,
  Scat6Notice,
  Scat6SectionTitle,
} from '../components/Scat6UI';
import { goUpToPatient, invalidateScat6, scat6PatientKey } from '../scat6Queries';
import { formatDate } from '../scat6Format';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE, WEB_SIDEBAR_WIDTH } from '../scat6Theme';
import { RtsAction, Scat6RtsMoveModal, moveTitle } from './Scat6RtsMoveModal';

const rtsKey = (id: number) => ['scat6', 'rts', id];

/**
 * Retour au sport (web) : les 6 étapes du consensus d'Amsterdam 2022, validées par le médecin
 * (consultation ou téléphone). Aucun chronomètre : chaque étape affiche ses dates, le médecin confirme
 * le passage ; les règles non respectées deviennent des avertissements. Certificats de reprise en PDF.
 *
 * Paramètres : { rtsId } pour un suivi existant, ou { patientId, injuryAt? } pour en ouvrir un.
 */
export const Scat6RtsView = ({ navigation, route }: { navigation: any; route: any }) => {
  const queryClient = useQueryClient();
  const rtsId = Number(route.params?.rtsId) || null;
  const patientId = Number(route.params?.patientId) || null;
  const { width } = useWindowDimensions();
  const twoColumns = width - WEB_SIDEBAR_WIDTH - Spacings.lg * 2 >= 980;

  const rtsQuery = useQuery({ queryKey: rtsKey(rtsId ?? 0), queryFn: () => getScat6Rts(rtsId!), enabled: !!rtsId });
  const rts = rtsQuery.data;
  const patientQuery = useQuery({
    queryKey: scat6PatientKey(rts?.patient_id ?? patientId ?? 0),
    queryFn: () => getScat6Patient(rts?.patient_id ?? patientId!),
    enabled: !!(rts?.patient_id ?? patientId),
  });
  const patient = patientQuery.data;

  // Retour : toujours à la fiche du patient (voir goUpToPatient).
  const back = () => goUpToPatient(navigation, rts?.patient_id ?? patientId);

  /* ---- Ouverture d'un suivi ---- */

  const [injuryAt, setInjuryAt] = useState<string>(route.params?.injuryAt ?? todayIso());
  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!patientId) return;
    setCreating(true);
    try {
      const created = await createScat6Rts({ patient_id: patientId, injury_at: injuryAt });
      invalidateScat6(queryClient);
      navigation.setParams({ rtsId: created.id, patientId: undefined, injuryAt: undefined });
    } catch (e: any) {
      scat6Notify('Ouverture impossible', e?.message);
    } finally {
      setCreating(false);
    }
  };

  /* ---- Modifications ---- */

  const [action, setAction] = useState<RtsAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  useEffect(() => setNotes(rts?.notes ?? ''), [rts?.id, rts?.notes]);

  const state: RtsState | null = useMemo(
    () =>
      rts
        ? { current_step: rts.current_step, injury_at: rts.injury_at, steps: rts.steps ?? {}, setbacks: rts.setbacks ?? [], notes: rts.notes }
        : null,
    [rts]
  );
  const ctx: RtsContext = useMemo(
    () => ({
      earliestCompetition: rts?.earliest_competition ?? null,
      examsSinceInjury: rts?.exams_since_injury ?? [],
      sport: patient?.sport ?? 'general',
    }),
    [rts, patient?.sport]
  );

  const save = async (next: RtsState, extra: { close?: boolean } = {}) => {
    if (!rts) return;
    setSaving(true);
    try {
      const saved = await updateScat6Rts(rts.id, { ...next, notes: next.notes, ...extra });
      queryClient.setQueryData(rtsKey(rts.id), saved);
      invalidateScat6(queryClient);
      setAction(null);
    } catch (e: any) {
      scat6Notify('Enregistrement impossible', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const confirm = ({ date, note, forced }: { date: string; note: string | null; forced: boolean }) => {
    if (!state || !action) return;
    save(action.kind === 'move' ? moveTo(state, action.target, date, forced, note) : setback(state, date, note));
  };

  const undo = async () => {
    if (!state) return;
    const ok = await scat6Confirm(
      'Annuler la dernière validation ?',
      `L’étape ${state.current_step} est retirée ; l’étape ${state.current_step - 1} redevient l’étape en cours.`,
      'Annuler la validation'
    );
    if (ok) save(undoLast(state));
  };

  const close = async () => {
    if (!state) return;
    const ok = await scat6Confirm(
      'Clôturer le suivi ?',
      'Le suivi est arrêté sans retour à la compétition enregistré (patient perdu de vue, arrêt du sport…). Il restera consultable.',
      'Clôturer'
    );
    if (ok) save(state, { close: true });
  };

  const remove = async () => {
    if (!rts) return;
    const ok = await scat6Confirm('Supprimer ce suivi ?', 'À utiliser pour un suivi ouvert par erreur. Action définitive.', 'Supprimer', true);
    if (!ok) return;
    try {
      await deleteScat6Rts(rts.id);
      invalidateScat6(queryClient);
      back();
    } catch (e: any) {
      scat6Notify('Suppression impossible', e?.message);
    }
  };

  const certificate = async (type: 'contact' | 'competition') => {
    if (!rts || !patient) return;
    try {
      await openScat6Certificate(rts.id, type, `Certificat-reprise-${type}-${patient.name}.pdf`);
    } catch (e: any) {
      scat6Notify('Certificat indisponible', e?.message);
    }
  };

  /* ---- Rendu ---- */

  if ((rtsId && rtsQuery.isLoading) || patientQuery.isLoading) return <Scat6Loading />;
  if (!patient || (rtsId && !rts)) {
    return (
      <View style={styles.page}>
        <Scat6Header title="Retour au sport" onBack={back} />
        <Scat6Empty icon="walk-outline" title="Suivi introuvable" message="Il a peut-être été supprimé." />
      </View>
    );
  }

  const header = (subtitle: string, right?: React.ReactNode) => (
    <Scat6Header title={`Retour au sport · ${patient.name}`} subtitle={subtitle} onBack={back} backLabel="Retour à la fiche" right={right} />
  );

  // Pas encore de suivi : date du choc puis ouverture.
  if (!rts || !state) {
    return (
      <View style={styles.page}>
        {header(`${sportLabel(patient.sport)} · né·e en ${patient.birth_year}`)}
        <Scat6ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.column, { maxWidth: 720 }]}>
            <Scat6Card>
              <Scat6SectionTitle title="Ouvrir le suivi de reprise" hint="Protocole en 6 étapes, au moins 24 h par étape (consensus d’Amsterdam 2022)." />
              <View style={styles.dateRow}>
                <Text style={styles.label}>Date du choc</Text>
                <Scat6DateInput value={injuryAt} onChange={setInjuryAt} max={todayIso()} />
              </View>
              <Scat6Button title="Démarrer le suivi" icon="play" loading={creating} disabled={!injuryAt} onPress={create} style={styles.alignEnd} />
            </Scat6Card>
          </View>
        </Scat6ScrollView>
      </View>
    );
  }

  const day = daysSince(rts.injury_at);
  const finished = rts.status === 'completed';
  const closed = rts.status === 'closed';
  const active = rts.status === 'active';
  const current = state.current_step;

  /* ---- Colonne principale : les 6 étapes ---- */
  const timeline = (
    <View style={styles.flexCol}>
      {finished ? (
        <Scat6Notice tone="success">
          Retour à la compétition autorisé le {formatDate(rts.completed_at)}. Le certificat de reprise est disponible.
        </Scat6Notice>
      ) : closed ? (
        <Scat6Notice tone="warning">Suivi clôturé sans retour à la compétition enregistré.</Scat6Notice>
      ) : (
        <Scat6Notice>
          Au moins 24 h par étape. Étapes 1–3 : symptômes légers tolérés. Étapes 4–6 : seulement après disparition des
          symptômes et signes, y compris à l’effort.
        </Scat6Notice>
      )}

      {RTS_STEPS.map((s) => {
        const st = state.steps[String(s.step)];
        const done = s.step < current || (finished && s.step === RTS_COMPETITION_STEP);
        const isCurrent = s.step === current && !finished;
        const upcoming = s.step > current;
        const gate = s.step === RTS_RESOLUTION_STEP;
        return (
          <View key={s.step}>
            {gate && (
              <View style={styles.gate}>
                <View style={styles.gateLine} />
                <Text style={styles.gateText}>Disparition des symptômes et signes, y compris à l’effort</Text>
                <View style={styles.gateLine} />
              </View>
            )}
            <View style={[styles.step, isCurrent && styles.stepCurrent, upcoming && styles.stepUpcoming]}>
              <View style={[styles.dot, done && styles.dotDone, isCurrent && styles.dotCurrent]}>
                {done ? (
                  <Ionicons name="checkmark" size={18} color={SCAT.card} />
                ) : (
                  <Text style={[styles.dotText, isCurrent && { color: SCAT.card }]}>{s.step}</Text>
                )}
              </View>
              <View style={styles.flex}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, upcoming && { color: SCAT.muted }]}>{s.title}</Text>
                  {isCurrent && <Scat6Badge label="En cours" tone="info" />}
                  {st?.forced && <Scat6Badge label="Validée malgré avertissement" tone="warning" icon="alert-circle-outline" />}
                </View>
                <Text style={styles.stepDetail}>{s.detail}</Text>
                {st?.started_at ? (
                  <Text style={styles.stepDates}>
                    {s.step === RTS_COMPETITION_STEP ? 'Autorisé' : 'Commencée'} le {formatDate(st.started_at)}
                    {st.done_at && s.step !== RTS_COMPETITION_STEP ? ` · franchie le ${formatDate(st.done_at)}` : ''}
                    {isCurrent ? ` · ${daysSince(st.started_at.slice(0, 10))} j` : ''}
                  </Text>
                ) : null}
                {st?.note ? <Text style={styles.stepNote}>« {st.note} »</Text> : null}

                {active && isCurrent && (
                  <View style={styles.stepActions}>
                    <Scat6Button
                      title={current + 1 === RTS_CONTACT_STEP || current + 1 === RTS_COMPETITION_STEP ? moveTitle(current + 1) : 'Étape franchie'}
                      icon="checkmark"
                      small
                      onPress={() => setAction({ kind: 'move', target: (current + 1) as any })}
                    />
                    <Scat6Button title="Symptômes revenus" icon="refresh" variant="secondary" small onPress={() => setAction({ kind: 'setback' })} />
                  </View>
                )}
                {active && upcoming && s.step > current + 1 && (
                  <Scat6Link
                    title={`Passer directement à l’étape ${s.step}`}
                    icon="play-skip-forward-outline"
                    onPress={() => setAction({ kind: 'move', target: s.step })}
                  />
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  /* ---- Colonne de côté : repères, certificats, notes ---- */
  const side = (
    <View style={[styles.flexCol, twoColumns && styles.side]}>
      <Scat6Card>
        <Scat6SectionTitle title="Repères" />
        <Info label="Choc" value={`${formatDate(rts.injury_at)} · J+${day}`} />
        <Info label="Sport" value={`${sportLabel(patient.sport)}${patient.age !== null ? ` · ≈ ${patient.age} ans` : ''}`} />
        <Info
          label="Compétition au plus tôt"
          value={rts.earliest_competition ? `${formatDate(rts.earliest_competition)} (J+${rts.min_competition_days})` : 'Pas de délai fixe'}
        />
        {day > 28 && !finished && (
          <Scat6Notice tone="warning">Symptômes au-delà de 4 semaines : avis spécialisé recommandé (symptômes persistants).</Scat6Notice>
        )}
        <View style={styles.rules}>
          {returnLines(patient.sport, patient.age).map((line) => (
            <View key={line} style={styles.rule}>
              <Ionicons name="arrow-forward-circle" size={16} color={SCAT.blue} style={{ marginTop: 2 }} />
              <Text style={styles.ruleText}>{line}</Text>
            </View>
          ))}
        </View>
      </Scat6Card>

      <Scat6Card>
        <Scat6SectionTitle title="Certificats de reprise" hint="PDF à imprimer, compléter (identité), signer et tamponner." />
        <CertificateRow
          title="Entraînement avec contact"
          available={current >= RTS_CONTACT_STEP}
          hint="Disponible à l’étape 5"
          onPress={() => certificate('contact')}
        />
        <CertificateRow
          title="Retour à la compétition"
          available={finished}
          hint="Disponible à l’étape 6"
          onPress={() => certificate('competition')}
        />
      </Scat6Card>

      {rts.setbacks.length > 0 && (
        <Scat6Card>
          <Scat6SectionTitle title="Symptômes revenus" />
          {rts.setbacks.map((b, i) => (
            <Text key={`${b.at}-${i}`} style={styles.ruleText}>
              {formatDate(b.at)} · étape {b.from}
              {b.to !== b.from ? ` → retour à l’étape ${b.to}` : ' · nouvel essai le lendemain'}
              {b.note ? ` — « ${b.note} »` : ''}
            </Text>
          ))}
        </Scat6Card>
      )}

      <Scat6Card>
        <Scat6Field
          label="Notes du suivi"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={5000}
          editable={active}
          onBlur={() => active && notes !== (rts.notes ?? '') && save({ ...state, notes: notes.trim() || null })}
        />
        {active && (
          <View style={styles.manage}>
            {current > 1 && <Scat6Link title="Annuler la dernière validation" icon="arrow-undo-outline" onPress={undo} />}
            <Scat6Link title="Clôturer le suivi" icon="archive-outline" onPress={close} />
            <Scat6Link title="Supprimer" icon="trash-outline" danger onPress={remove} />
          </View>
        )}
      </Scat6Card>
    </View>
  );

  return (
    <View style={styles.page}>
      {header(
        `Choc le ${formatDate(rts.injury_at)} · J+${day} · ${sportLabel(patient.sport)}`,
        <Scat6Badge
          label={finished ? 'Compétition autorisée' : closed ? 'Clôturé' : `Étape ${current}/6`}
          tone={finished ? 'success' : closed ? 'neutral' : 'warning'}
        />
      )}
      <Scat6ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.column, twoColumns && styles.row]}>
          {timeline}
          {side}
        </View>
      </Scat6ScrollView>

      <Scat6RtsMoveModal action={action} state={state} ctx={ctx} saving={saving} onClose={() => setAction(null)} onConfirm={confirm} />
    </View>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.info}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const CertificateRow: React.FC<{ title: string; available: boolean; hint: string; onPress: () => void }> = ({
  title,
  available,
  hint,
  onPress,
}) => (
  <Pressable
    style={({ hovered }: any) => [styles.cert, available && hovered && styles.certHover, !available && styles.certOff]}
    onPress={available ? onPress : undefined}
    disabled={!available}
    accessibilityRole="button"
    accessibilityLabel={`Certificat : ${title}`}
  >
    <Ionicons name="document-text-outline" size={22} color={available ? SCAT.blue : SCAT.faint} />
    <View style={styles.flex}>
      <Text style={[styles.certTitle, !available && { color: SCAT.faint }]}>{title}</Text>
      <Text style={styles.certHint}>{available ? 'Ouvrir le PDF' : hint}</Text>
    </View>
    {available && <Ionicons name="download-outline" size={20} color={SCAT.blue} />}
  </Pressable>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexCol: {
    flex: 1,
    gap: Spacings.md,
    minWidth: 0,
  },
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
  scroll: {
    padding: Spacings.lg,
    paddingBottom: TAB_BAR_SPACE + Spacings.lg,
  },
  column: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    gap: Spacings.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  side: {
    flex: 0.75,
  },
  alignEnd: {
    alignSelf: 'flex-end',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },

  /* ---- Étapes ---- */
  step: {
    flexDirection: 'row',
    gap: Spacings.md,
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    padding: Spacings.md,
  },
  stepCurrent: {
    borderColor: SCAT.blue,
    borderWidth: 2,
  },
  stepUpcoming: {
    backgroundColor: '#FAFBFD',
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: SCAT.success,
    borderColor: SCAT.success,
  },
  dotCurrent: {
    backgroundColor: SCAT.blue,
    borderColor: SCAT.blueDark,
  },
  dotText: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: SCAT.blueDark,
  },
  stepTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  stepTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: SCAT.blueInk,
  },
  stepDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: SCAT.muted,
    marginTop: 2,
  },
  stepDates: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.text,
    marginTop: 6,
  },
  stepNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: SCAT.muted,
    marginTop: 2,
  },
  stepActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
  },
  gate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  gateLine: {
    flex: 1,
    height: 2,
    backgroundColor: SCAT.warningLine,
  },
  gateText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: SCAT.warning,
    textAlign: 'center',
  },

  /* ---- Côté ---- */
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacings.sm,
  },
  infoLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.muted,
  },
  infoValue: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  rules: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
    paddingTop: Spacings.sm,
  },
  rule: {
    flexDirection: 'row',
    gap: 6,
  },
  ruleText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: SCAT.text,
  },
  cert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SCAT.blueLine,
  },
  certHover: {
    backgroundColor: SCAT.blueSoft,
  },
  certOff: {
    borderColor: SCAT.line,
    borderStyle: 'dashed',
  },
  certTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.blueInk,
  },
  certHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.muted,
  },
  manage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
});
