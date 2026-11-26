import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Spacings from '../../../../constants/Spacings';
import { DIAGNOSIS_LABEL, STEP_INFO, examLabel } from '../../../scat6/core/content';
import { formatScore } from '../../../scat6/core/scoring';
import { getScat6Assessments, Scat6AssessmentRow } from '../../../services/v2/Scat6Service';
import { Scat6Badge, Scat6Button, Scat6Choice, Scat6Empty, Scat6Header, Scat6Loading, Scat6SectionTitle } from './components/Scat6UI';
import { EXAM_ICON } from './components/scat6Icons';
import { SCAT6_EXAMS_KEY, openInPatients } from './scat6Queries';
import { formatDate, relativeDay } from './scat6Format';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE } from './scat6Theme';
import { Scat6ScrollView } from './components/Scat6ScrollView';

type Filter = 'all' | 'post_choc' | 'retest' | 'baseline';

/**
 * Tous les examens du médecin (web) : brouillons à reprendre en tête, puis examens signés.
 * Un clic reprend le brouillon ou ouvre le rapport (dans la pile Patients).
 */
export const Scat6ExamsView = ({ navigation }: { navigation: any }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: SCAT6_EXAMS_KEY, queryFn: getScat6Assessments });

  const rows = useMemo(() => (data ?? []).filter((a) => filter === 'all' || a.exam_kind === filter), [data, filter]);
  const drafts = rows.filter((a) => a.status === 'draft');
  const signed = rows.filter((a) => a.status === 'completed');

  const open = (a: Scat6AssessmentRow) =>
    openInPatients(navigation, a.status === 'draft' ? 'scat6-exam' : 'scat6-report', { uuid: a.uuid });

  return (
    <View style={styles.page}>
      <Scat6Header title="Examens" subtitle="Brouillons à reprendre et examens signés" />
      <Scat6ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {isLoading ? (
            <Scat6Loading />
          ) : isError ? (
            <Scat6Empty
              icon="cloud-offline-outline"
              title="Chargement impossible"
              action={<Scat6Button title="Réessayer" icon="refresh" onPress={() => refetch()} />}
            />
          ) : (data ?? []).length === 0 ? (
            <Scat6Empty
              icon="clipboard-outline"
              title="Aucun examen"
              message="Les examens commencés depuis la fiche d’un patient apparaissent ici."
              action={<Scat6Button title="Voir les patients" icon="people-outline" onPress={() => navigation.navigate('scat6-patients-tab')} />}
            />
          ) : (
            <>
              <View style={styles.filters}>
                {(
                  [
                    ['all', 'Tous'],
                    ['post_choc', 'Après un choc'],
                    ['retest', 'Re-test'],
                    ['baseline', 'Baseline'],
                  ] as [Filter, string][]
                ).map(([key, label]) => (
                  <Scat6Choice key={key} label={label} selected={filter === key} onPress={() => setFilter(key)} />
                ))}
              </View>

              {drafts.length > 0 && (
                <>
                  <Scat6SectionTitle title="En cours" hint="Enregistrés automatiquement" />
                  <View style={styles.list}>
                    {drafts.map((a) => (
                      <ExamRow key={a.uuid} exam={a} onPress={() => open(a)} />
                    ))}
                  </View>
                </>
              )}

              <Scat6SectionTitle title="Signés" hint={`${signed.length} examen(s)`} />
              {signed.length === 0 ? (
                <Text style={styles.muted}>Aucun examen signé pour ce filtre.</Text>
              ) : (
                <View style={styles.list}>
                  {signed.map((a) => (
                    <ExamRow key={a.uuid} exam={a} onPress={() => open(a)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </Scat6ScrollView>
    </View>
  );
};

const ExamRow: React.FC<{ exam: Scat6AssessmentRow; onPress: () => void }> = ({ exam: a, onPress }) => {
  const draft = a.status === 'draft';
  return (
    <Pressable style={({ hovered }: any) => [styles.row, hovered && styles.rowHover]} onPress={onPress} accessibilityRole="button">
      <View style={[styles.icon, draft && styles.iconDraft]}>
        <Ionicons name={draft ? 'time-outline' : EXAM_ICON[a.exam_kind]} size={20} color={draft ? SCAT.draft : SCAT.card} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.name} numberOfLines={1}>
          {a.patient_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {examLabel(a.exam_kind)} ·{' '}
          {draft
            ? `commencé ${relativeDay(a.started_at).toLowerCase()} · étape : ${a.step && a.step in STEP_INFO ? STEP_INFO[a.step as keyof typeof STEP_INFO].title : '—'}`
            : `signé le ${formatDate(a.completed_at)}`}
        </Text>
      </View>
      {!draft && (
        <View style={styles.scores}>
          <Text style={styles.score}>Cognitif {formatScore(a.summary?.cognitive_total ?? null, 50)}</Text>
          <Text style={styles.score}>Symptômes {a.summary?.symptom_count ?? '—'}/22</Text>
        </View>
      )}
      <View style={styles.badge}>
        {draft ? (
          <Scat6Badge label="Reprendre" tone="draft" icon="play" />
        ) : a.exam_kind === 'baseline' ? (
          <Scat6Badge label="Baseline" tone="success" />
        ) : a.diagnosis ? (
          <Scat6Badge
            label={`Commotion : ${DIAGNOSIS_LABEL[a.diagnosis]}`}
            tone={a.diagnosis === 'oui' ? 'danger' : a.diagnosis === 'differe' ? 'warning' : 'neutral'}
          />
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={SCAT.blueLine} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacings.lg,
    paddingBottom: TAB_BAR_SPACE + Spacings.lg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    gap: Spacings.md,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  list: {
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  rowHover: {
    backgroundColor: SCAT.blueSoft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SCAT.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDraft: {
    backgroundColor: SCAT.draftSoft,
  },
  name: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: SCAT.text,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  scores: {
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.text,
  },
  badge: {
    minWidth: 150,
    alignItems: 'flex-end',
  },
  muted: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.muted,
  },
});
