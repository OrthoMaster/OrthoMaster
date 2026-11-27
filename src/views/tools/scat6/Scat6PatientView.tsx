import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Spacings from '../../../../constants/Spacings';
import { DIAGNOSIS_LABEL, EXAM_KINDS, STEP_INFO, examLabel, sportLabel } from '../../../scat6/core/content';
import { formatScore } from '../../../scat6/core/scoring';
import { MIN_AGE } from '../../../scat6/core/rules';
import { patientStatusLabel } from '../../../scat6/core/rts';
import type { ExamKind } from '../../../scat6/core/types';
import { Scat6AssessmentRow, deleteScat6Draft, getScat6Patient } from '../../../services/v2/Scat6Service';
import { scat6Confirm, scat6Notify } from './components/Scat6Dialog';
import { Scat6PatientForm } from './components/Scat6PatientForm';
import {
  Scat6Badge,
  Scat6Button,
  Scat6Card,
  Scat6Empty,
  Scat6Header,
  Scat6Link,
  Scat6Loading,
  Scat6Notice,
  Scat6SectionTitle,
} from './components/Scat6UI';
import { EXAM_ICON } from './components/scat6Icons';
import { invalidateScat6, scat6PatientKey } from './scat6Queries';
import { formatDate, formatDateTime, relativeDay } from './scat6Format';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE } from './scat6Theme';
import { Scat6ScrollView } from './components/Scat6ScrollView';

/**
 * Fiche patient (web) : commencer un examen, reprendre un brouillon, historique des examens signés.
 * GET /scat/patients/{id}
 */
export const Scat6PatientView = ({ navigation, route }: { navigation: any; route: any }) => {
  const patientId = Number(route.params?.patientId);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: patient, isLoading, isError, refetch } = useQuery({
    queryKey: scat6PatientKey(patientId),
    queryFn: () => getScat6Patient(patientId),
    enabled: !!patientId,
  });

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('scat6-patients'));

  if (isLoading) return <Scat6Loading />;
  if (isError || !patient) {
    return (
      <View style={styles.page}>
        <Scat6Header title="Patient" onBack={back} />
        <Scat6Empty
          icon="person-outline"
          title="Patient introuvable"
          message="Il a peut-être été supprimé."
          action={<Scat6Button title="Réessayer" icon="refresh" variant="secondary" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  const tooYoung = patient.age !== null && patient.age < MIN_AGE;
  const drafts = patient.assessments.filter((a) => a.status === 'draft');
  const done = patient.assessments.filter((a) => a.status === 'completed');

  const activeRts = patient.rts.find((r) => r.status === 'active') ?? null;
  const status = patientStatusLabel(patient.status);

  /**
   * Retour au sport : ouvre le suivi en cours, sinon en démarre un. Si l'état du patient ne l'appelle pas
   * (pas de commotion retenue, diagnostic différé…), avertissement que le médecin peut passer.
   */
  const openRts = async () => {
    if (activeRts) return navigation.navigate('scat6-rts', { rtsId: activeRts.id });
    const lastExam = patient.assessments.find((a) => a.status === 'completed' && a.exam_kind !== 'baseline');
    const warning: Record<string, string> = {
      retest: 'Diagnostic différé au dernier examen : un re-test est recommandé avant de démarrer la reprise.',
      sans_restriction: 'Dernier examen : pas de commotion retenue.',
      reprise: 'Le dernier suivi est terminé (compétition autorisée). Un nouveau suivi correspond à une nouvelle commotion.',
      none: 'Aucune commotion diagnostiquée dans l’application (diagnostic posé ailleurs, étapes déjà faites sur papier ?).',
    };
    const reason = patient.status?.code === 'commotion' ? null : warning[patient.status?.code ?? 'none'];
    if (reason && !(await scat6Confirm('Démarrer un suivi de reprise ?', reason, 'Continuer'))) return;
    navigation.navigate('scat6-rts', {
      patientId: patient.id,
      injuryAt: lastExam?.injury_at?.slice(0, 10) ?? undefined,
    });
  };

  const start = (kind: ExamKind) => {
    if (tooYoung) {
      scat6Notify('Moins de 13 ans', 'Le SCAT6 ne s’applique pas avant 13 ans. Utilisez le Child SCAT6.');
      return;
    }
    navigation.navigate('scat6-exam', { patientId: patient.id, kind });
  };

  const removeDraft = async (a: Scat6AssessmentRow) => {
    const ok = await scat6Confirm(
      'Abandonner cet examen ?',
      `L’examen commencé le ${formatDateTime(a.started_at)} sera supprimé.`,
      'Abandonner',
      true
    );
    if (!ok) return;
    try {
      await deleteScat6Draft(a.uuid);
      invalidateScat6(queryClient);
    } catch (e: any) {
      scat6Notify('Suppression impossible', e?.message);
    }
  };

  return (
    <View style={styles.page}>
      <Scat6Header
        title={patient.name}
        subtitle={`${sportLabel(patient.sport)} · né·e en ${patient.birth_year}${patient.age !== null ? ` (≈ ${patient.age} ans)` : ''}`}
        onBack={back}
        backLabel="Retour aux patients"
        right={
          <>
            {status && <Scat6Badge label={status.label} tone={status.tone} />}
            <Scat6Button title="Modifier" icon="create-outline" variant="light" small onPress={() => setEditing(true)} />
          </>
        }
      />

      <Scat6ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {tooYoung && (
            <Scat6Notice tone="danger">
              Moins de 13 ans : le SCAT6 ne s’applique pas. Utilisez le Child SCAT6 (non disponible dans l’application).
            </Scat6Notice>
          )}
          {patient.notes ? <Scat6Notice>{patient.notes}</Scat6Notice> : null}

          {/* ---- Commencer ---- */}
          <Scat6SectionTitle title="Nouvel examen" hint="Au calme, après repos · 10 à 15 minutes · chronomètre, ruban de 3 m et mousse (facultative)." />
          <View style={styles.kinds}>
            {EXAM_KINDS.map((k) => (
              <KindCard
                key={k.id}
                icon={EXAM_ICON[k.id]}
                title={k.label}
                hint={k.hint}
                recommended={k.id === 'baseline' && !patient.has_baseline}
                disabled={tooYoung}
                onPress={() => start(k.id)}
              />
            ))}
            {/* Retour au sport : 4e carte, à côté des examens. */}
            <KindCard
              icon="walk-outline"
              title="Retour au sport"
              hint={activeRts ? `Étape ${activeRts.current_step}/6 en cours · choc du ${formatDate(activeRts.injury_at)}` : 'Reprise en 6 étapes et certificat de reprise.'}
              recommended={patient.status?.code === 'commotion'}
              recommendedLabel="À démarrer"
              onPress={openRts}
            />
          </View>

          {/* ---- Suivis de reprise terminés ---- */}
          {patient.rts.some((r) => r.status !== 'active') && (
            <>
              <Scat6SectionTitle title="Suivis de reprise" />
              <View style={styles.table}>
                {patient.rts
                  .filter((r) => r.status !== 'active')
                  .map((r, i) => (
                    <Pressable
                      key={r.id}
                      style={({ hovered }: any) => [styles.tr, i % 2 === 1 && styles.trAlt, hovered && styles.trHover]}
                      onPress={() => navigation.navigate('scat6-rts', { rtsId: r.id })}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.td, styles.cDate]}>Choc du {formatDate(r.injury_at)}</Text>
                      <Text style={[styles.td, styles.cKind]}>
                        {r.status === 'completed' ? `Compétition autorisée le ${formatDate(r.completed_at)}` : `Clôturé à l’étape ${r.current_step}`}
                      </Text>
                      <View style={styles.cDiag}>
                        <Scat6Badge label={r.status === 'completed' ? 'Terminé' : 'Clôturé'} tone={r.status === 'completed' ? 'success' : 'neutral'} />
                      </View>
                      <View style={styles.cGo}>
                        <Ionicons name="chevron-forward" size={20} color={SCAT.blue} />
                      </View>
                    </Pressable>
                  ))}
              </View>
            </>
          )}

          {/* ---- Brouillons ---- */}
          {drafts.length > 0 && (
            <>
              <Scat6SectionTitle title="En cours" hint="Enregistrés automatiquement : reprenez là où vous vous êtes arrêté." />
              {drafts.map((a) => (
                <View key={a.uuid} style={styles.draft}>
                  <View style={styles.draftIcon}>
                    <Ionicons name="time-outline" size={22} color={SCAT.draft} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.draftTitle}>{examLabel(a.exam_kind)}</Text>
                    <Text style={styles.draftMeta}>
                      Commencé {relativeDay(a.started_at).toLowerCase()} · dernière étape :{' '}
                      {a.step && a.step in STEP_INFO ? STEP_INFO[a.step as keyof typeof STEP_INFO].title : 'démarrage'}
                    </Text>
                  </View>
                  <Scat6Link title="Abandonner" icon="trash-outline" danger onPress={() => removeDraft(a)} />
                  <Scat6Button
                    title="Reprendre"
                    icon="play"
                    small
                    onPress={() => navigation.navigate('scat6-exam', { uuid: a.uuid })}
                  />
                </View>
              ))}
            </>
          )}

          {/* ---- Historique ---- */}
          <Scat6SectionTitle title="Historique" hint={done.length ? `${done.length} examen(s) signé(s)` : null} />
          {done.length === 0 ? (
            <Scat6Card>
              <Text style={styles.emptyText}>
                Aucun examen signé. {patient.has_baseline ? '' : 'Commencez par une baseline : les examens suivants s’y compareront.'}
              </Text>
            </Scat6Card>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tr, styles.thead]}>
                <Text style={[styles.th, styles.cDate]}>Date</Text>
                <Text style={[styles.th, styles.cKind]}>Examen</Text>
                <Text style={[styles.th, styles.cNum]}>Symptômes</Text>
                <Text style={[styles.th, styles.cNum]}>Cognitif</Text>
                <Text style={[styles.th, styles.cNum]}>mBESS</Text>
                <Text style={[styles.th, styles.cDiag, styles.right]}>Commotion</Text>
                <View style={styles.cGo} />
              </View>
              {done.map((a, i) => (
                <Pressable
                  key={a.uuid}
                  style={({ hovered }: any) => [styles.tr, i % 2 === 1 && styles.trAlt, hovered && styles.trHover]}
                  onPress={() => navigation.navigate('scat6-report', { uuid: a.uuid })}
                  accessibilityRole="button"
                >
                  <Text style={[styles.td, styles.cDate]}>{formatDate(a.completed_at)}</Text>
                  <View style={[styles.cKind, styles.kindCell]}>
                    <Ionicons name={EXAM_ICON[a.exam_kind]} size={16} color={SCAT.blueDark} />
                    <Text style={styles.td}>{examLabel(a.exam_kind)}</Text>
                  </View>
                  <Text style={[styles.td, styles.cNum]}>
                    {a.summary?.symptom_count ?? '—'} · {a.summary?.symptom_severity ?? '—'}
                  </Text>
                  <Text style={[styles.td, styles.cNum]}>{formatScore(a.summary?.cognitive_total ?? null, 50)}</Text>
                  <Text style={[styles.td, styles.cNum]}>{formatScore(a.summary?.mbess ?? null, 30)}</Text>
                  <View style={styles.cDiag}>
                    {a.exam_kind === 'baseline' ? (
                      <Scat6Badge label="Baseline" tone="success" />
                    ) : a.diagnosis ? (
                      <Scat6Badge
                        label={DIAGNOSIS_LABEL[a.diagnosis]}
                        tone={a.diagnosis === 'oui' ? 'danger' : a.diagnosis === 'differe' ? 'warning' : 'neutral'}
                      />
                    ) : null}
                  </View>
                  <View style={styles.cGo}>
                    <Ionicons name="document-text-outline" size={20} color={SCAT.blue} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Scat6ScrollView>

      <Scat6PatientForm
        visible={editing}
        patient={patient}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          invalidateScat6(queryClient);
        }}
        onDeleted={() => {
          setEditing(false);
          invalidateScat6(queryClient);
          navigation.navigate('scat6-patients');
        }}
      />
    </View>
  );
};

/** Carte 3D d'un type d'examen (comme les cartes Outils). */
const KindCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  recommended?: boolean;
  recommendedLabel?: string;
  disabled?: boolean;
  onPress: () => void;
}> = ({ icon, title, hint, recommended, recommendedLabel = 'Recommandé', disabled, onPress }) => (
  <Pressable
    style={({ hovered, pressed }: any) => [
      styles.kind,
      hovered && !disabled && styles.kindHover,
      pressed && !disabled && styles.kindPressed,
      disabled && styles.kindDisabled,
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Commencer : ${title}`}
  >
    <View style={styles.kindIcon}>
      <Ionicons name={icon} size={24} color={SCAT.card} />
    </View>
    <View style={styles.flex}>
      <View style={styles.kindTitleRow}>
        <Text style={styles.kindTitle}>{title}</Text>
        {recommended && <Scat6Badge label={recommendedLabel} tone="warning" icon="star" />}
      </View>
      <Text style={styles.kindHint}>{hint}</Text>
    </View>
    <Ionicons name="arrow-forward-circle" size={28} color={SCAT.card} />
  </Pressable>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  /* ---- Page ---- */
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

  /* ---- Types d'examen ---- */
  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  kind: {
    flexGrow: 1,
    flexBasis: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: SCAT.blue,
    borderRadius: 18,
    borderBottomWidth: 6,
    borderBottomColor: SCAT.blueDark,
    padding: Spacings.md,
  },
  kindHover: {
    backgroundColor: '#4F8DD8',
  },
  kindPressed: {
    borderBottomWidth: 2,
    marginTop: 4,
  },
  kindDisabled: {
    opacity: 0.45,
  },
  kindIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  kindTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: SCAT.card,
  },
  kindHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },

  /* ---- Brouillons ---- */
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: SCAT.draft,
    padding: Spacings.md,
  },
  draftIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SCAT.draftSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: SCAT.text,
  },
  draftMeta: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },

  /* ---- Historique ---- */
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.muted,
  },
  table: {
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
    paddingVertical: 12,
  },
  thead: {
    backgroundColor: SCAT.blueSoft,
    paddingVertical: 9,
  },
  trAlt: {
    backgroundColor: '#F8FAFD',
  },
  trHover: {
    backgroundColor: SCAT.blueSoft,
  },
  th: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: SCAT.blueDark,
  },
  td: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  cDate: {
    flex: 1.1,
  },
  cKind: {
    flex: 1.5,
  },
  kindCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cNum: {
    flex: 1,
    textAlign: 'right',
  },
  cDiag: {
    flex: 1.1,
    alignItems: 'flex-end',
  },
  right: {
    textAlign: 'right',
  },
  cGo: {
    width: 28,
    alignItems: 'flex-end',
  },
});
