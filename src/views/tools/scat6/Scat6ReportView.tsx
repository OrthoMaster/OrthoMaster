import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Spacings from '../../../../constants/Spacings';
import {
  BACKGROUND,
  DIAGNOSIS_LABEL,
  MBESS_STANCES,
  NEURO_LABEL,
  ORIENTATION,
  STEP_INFO,
  SYMPTOMS,
  examLabel,
  sportLabel,
} from '../../../scat6/core/content';
import { compareWithBaseline, digitsBackward, monthsBackward, summarize, tandemGait } from '../../../scat6/core/scoring';
import type { Scat6Summary, SkippablePart } from '../../../scat6/core/types';
import { getScat6Assessment, openScat6Report } from '../../../services/v2/Scat6Service';
import { scat6Notify } from './components/Scat6Dialog';
import { Scat6CompareTable, Scat6Consignes } from './components/Scat6Results';
import { Scat6Button, Scat6Card, Scat6Empty, Scat6Header, Scat6Loading, Scat6Notice, Scat6SectionTitle } from './components/Scat6UI';
import { scat6ExamKey } from './scat6Queries';
import { formatDate, formatDateTime, formatTime } from './scat6Format';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE, WEB_SIDEBAR_WIDTH } from './scat6Theme';
import { Scat6ScrollView } from './components/Scat6ScrollView';

/**
 * Rapport d'un examen signé (web) : décision, comparaison avec la baseline, détail des tests,
 * consignes si commotion. Le PDF (serveur) reprend le même contenu.
 */
export const Scat6ReportView = ({ navigation, route }: { navigation: any; route: any }) => {
  const uuid: string = route.params?.uuid;
  const [downloading, setDownloading] = useState(false);
  const { width } = useWindowDimensions();
  // Deux colonnes dès que chacune garde ~420 px (barre latérale de 200 px et marges déduites).
  const twoColumns = width - WEB_SIDEBAR_WIDTH - Spacings.lg * 2 >= 420 * 2 + Spacings.md;

  const { data: a, isLoading, refetch } = useQuery({
    queryKey: scat6ExamKey(uuid),
    queryFn: () => getScat6Assessment(uuid),
    enabled: !!uuid,
  });

  // Brouillon ouvert par erreur (lien ancien) : on le reprend.
  useEffect(() => {
    if (a?.status === 'draft') navigation.replace('scat6-exam', { uuid: a.uuid });
  }, [a?.status]);

  const back = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else if (a) navigation.navigate('scat6-patient', { patientId: a.patient_id });
    else navigation.navigate('scat6-patients');
  };

  if (isLoading) return <Scat6Loading />;
  if (!a) {
    return (
      <View style={styles.page}>
        <Scat6Header title="Rapport SCAT6" onBack={back} />
        <Scat6Empty
          icon="document-outline"
          title="Rapport introuvable"
          action={<Scat6Button title="Réessayer" icon="refresh" variant="secondary" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  if (a.status === 'draft') return <Scat6Loading />;

  const data = a.data;
  const t = data.tests;
  const isBaseline = a.exam_kind === 'baseline';
  // Les scores signés (serveur) font foi ; recalcul seulement s'ils manquent.
  const summary: Scat6Summary = a.summary ?? summarize(data);
  const rows = compareWithBaseline(summary, isBaseline ? null : a.baseline?.summary ?? null);
  const skipped = Object.entries(data.skipped ?? {}) as [SkippablePart, string][];
  const showConsignes = a.diagnosis === 'oui' || a.diagnosis === 'differe';
  const answer = (code: string) => data.answers[code];

  const download = async () => {
    setDownloading(true);
    try {
      await openScat6Report(a.uuid, `SCAT6-${a.patient.name}-${(a.completed_at ?? '').slice(0, 10)}.pdf`);
    } catch (e: any) {
      scat6Notify('PDF indisponible', e?.message);
    } finally {
      setDownloading(false);
    }
  };

  const banner = isBaseline
    ? { tone: SCAT.success, soft: SCAT.successSoft, icon: 'flag' as const, title: 'Baseline enregistrée', text: 'Référence pour les prochains examens de ce patient.' }
    : a.diagnosis === 'oui'
      ? { tone: SCAT.danger, soft: SCAT.dangerSoft, icon: 'warning' as const, title: 'Commotion cérébrale : Oui', text: 'Pas de retour au sport aujourd’hui ; reprise progressive selon les règles ci-dessous.' }
      : a.diagnosis === 'differe'
        ? { tone: SCAT.warning, soft: SCAT.warningSoft, icon: 'time' as const, title: 'Diagnostic différé', text: 'En cas de doute : re-tester le lendemain ou avant 72 h.' }
        : { tone: SCAT.blue, soft: SCAT.blueSoft, icon: 'checkmark-circle' as const, title: 'Commotion cérébrale : Non', text: 'Selon le jugement clinique du médecin.' };

  // Cartes de détail 1 → 4 (étapes du SCAT6).
  const details = [
    <Scat6Card key="background" style={styles.cell}>
      <Scat6SectionTitle title="1 · Renseignements" />
      {BACKGROUND.map((i) => (
        <Line key={i.code} label={i.label} value={yesNo(answer(i.code))} strong={answer(i.code)?.value === true} />
      ))}
      {data.background_notes ? <Text style={styles.note}>{data.background_notes}</Text> : null}
    </Scat6Card>,
    <Scat6Card key="symptoms" style={styles.cell}>
      <Scat6SectionTitle
        title={`2 · Symptômes ${isBaseline ? '(habituellement)' : '(maintenant)'}`}
        hint={summary.symptom_count === null ? null : `${summary.symptom_count}/22 · sévérité ${summary.symptom_severity}/132`}
      />
      {SYMPTOMS.filter((s) => Number(answer(s.code)?.value ?? 0) > 0).map((s) => (
        <Line key={s.code} label={s.label} value={String(answer(s.code)?.value)} strong />
      ))}
      {summary.symptom_count === 0 && <Text style={styles.muted}>Aucun symptôme.</Text>}
      {!isBaseline && (
        <>
          <Line label="Aggravés par l’activité physique" value={yesNo(answer('S.phys'))} />
          <Line label="Aggravés par l’activité mentale" value={yesNo(answer('S.ment'))} />
          <Line label="Se sent normal à" value={data.percent_normal === null ? '—' : `${data.percent_normal} %`} />
        </>
      )}
    </Scat6Card>,
    <Scat6Card key="cognitive" style={styles.cell}>
      <Scat6SectionTitle title="3 · Cognitif" hint={summary.cognitive_total === null ? null : `Total ${summary.cognitive_total}/50`} />
      {ORIENTATION.map((i) => (
        <Line
          key={i.code}
          label={i.label}
          value={answer(i.code)?.value === true ? 'Correct' : answer(i.code)?.value === false ? 'Incorrect' : '—'}
          strong={answer(i.code)?.value === false}
        />
      ))}
      <Line
        label={`Mémoire immédiate (liste ${t.memory.list})`}
        value={t.memory.endedAt ? `${t.memory.trials.map((tr) => tr.length).join(' + ')} = ${summary.immediate}/30` : '—'}
      />
      {t.memory.endedAt ? <Text style={styles.muted}>Fin du 3e essai à {formatTime(t.memory.endedAt)}</Text> : null}
      <Line label={`Chiffres à l’envers (liste ${t.digits.list})`} value={digitsBackward(t.digits.results) === null ? '—' : `${digitsBackward(t.digits.results)}/4`} />
      <Line
        label="Mois à l’envers"
        value={t.months.done ? `${t.months.seconds} s · ${t.months.errors ?? 0} erreur(s) → ${monthsBackward(t.months)}/1` : '—'}
      />
      <Line label="Mémoire différée" value={summary.delayed === null ? '—' : `${summary.delayed}/10`} />
    </Scat6Card>,
    <Scat6Card key="balance" style={styles.cell}>
      <Scat6SectionTitle
        title="4 · Équilibre"
        hint={t.mbess.foot ? `Pied testé : ${t.mbess.foot === 'gauche' ? 'gauche' : 'droit'}` : null}
      />
      {MBESS_STANCES.map((s, i) => (
        <Line
          key={s.key}
          label={s.label}
          value={`${t.mbess.firm[i] ?? '—'}${t.mbess.foam ? ` · sol instable ${t.mbess.foam[i] ?? '—'}` : ''}`}
        />
      ))}
      <Line label="mBESS sol ferme" value={summary.mbess === null ? '—' : `${summary.mbess}/30`} strong />
      <Line
        label="Marche en tandem"
        value={
          t.tandem.done
            ? t.tandem.trials.map((v) => (v === null ? '—' : v < 0 ? 'échec' : `${v} s`)).join(' · ')
            : t.mbess.normal === false
              ? 'non réalisée (équilibre non normal)'
              : '—'
        }
      />
      {t.tandem.done && tandemGait(t.tandem.trials) ? (
        <Text style={styles.muted}>
          Meilleur {tandemGait(t.tandem.trials)!.best} s · moyenne {tandemGait(t.tandem.trials)!.mean} s
        </Text>
      ) : null}
      {t.tandem.dualBest !== null ? (
        <Line label="Double tâche" value={`${t.tandem.dualBest} s · ${t.tandem.dualErrors ?? 0} erreur(s)`} />
      ) : null}
    </Scat6Card>,
  ];

  return (
    <View style={styles.page}>
      <Scat6Header
        title={`Rapport · ${a.patient.name}`}
        subtitle={`${examLabel(a.exam_kind)} · signé le ${formatDateTime(a.completed_at)} par Dr ${a.signed_by ?? ''}`}
        onBack={back}
        right={<Scat6Button title="Télécharger le PDF" icon="download-outline" variant="light" small loading={downloading} onPress={download} />}
      />

      <Scat6ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {/* ---- Décision ---- */}
          <View style={[styles.banner, { backgroundColor: banner.soft, borderColor: banner.tone }]}>
            <View style={[styles.bannerIcon, { backgroundColor: banner.tone }]}>
              <Ionicons name={banner.icon} size={26} color={SCAT.card} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.bannerTitle, { color: banner.tone }]}>{banner.title}</Text>
              <Text style={styles.bannerText}>{banner.text}</Text>
              {a.neuro ? <Text style={styles.bannerText}>Examen neurologique : {NEURO_LABEL[a.neuro]}</Text> : null}
            </View>
            <View style={styles.bannerMeta}>
              <Meta label="Sport" value={sportLabel(a.patient.sport)} />
              <Meta label="Âge" value={a.patient.age !== null ? `≈ ${a.patient.age} ans` : '—'} />
              {!isBaseline && <Meta label="Choc" value={formatDate(a.injury_at)} />}
            </View>
          </View>
          {a.notes ? (
            <Scat6Card>
              <Text style={styles.label}>Notes cliniques</Text>
              <Text style={styles.body}>{a.notes}</Text>
            </Scat6Card>
          ) : null}

          {/* ---- Résumé ---- */}
          <Scat6Card>
            <Scat6SectionTitle
              title={isBaseline ? 'Scores' : 'Comparaison avec la baseline'}
              hint={!isBaseline && a.baseline ? `Baseline du ${formatDate(a.baseline.completed_at)} · liste ${a.baseline.word_list}` : null}
            />
            <Scat6CompareTable rows={rows} withBaseline={!isBaseline} />
            {!isBaseline && !a.baseline && <Scat6Notice tone="warning">Aucune baseline signée avant cet examen.</Scat6Notice>}
            {skipped.length > 0 && (
              <Scat6Notice tone="warning">
                Non réalisé : {skipped.map(([s, reason]) => `${STEP_INFO[s]?.title ?? s} (${reason})`).join(', ')}.
              </Scat6Notice>
            )}
          </Scat6Card>

          {/* ---- Détail ---- */}
          {/*
            Deux colonnes indépendantes (et non des lignes) : une carte courte ne laisse pas de vide
            sous elle en attendant la carte voisine, plus longue. Gauche : 1 et 3 ; droite : 2 et 4.
          */}
          {twoColumns ? (
            <View style={styles.grid}>
              <View style={styles.gridColumn}>
                {details[0]}
                {details[2]}
              </View>
              <View style={styles.gridColumn}>
                {details[1]}
                {details[3]}
              </View>
            </View>
          ) : (
            <View style={styles.gridColumn}>{details}</View>
          )}

          {showConsignes && (
            <>
              <Scat6SectionTitle title="Consignes à remettre au patient" />
              <Scat6Consignes sport={a.patient.sport} age={a.patient.age} deferred={a.diagnosis === 'differe'} />
            </>
          )}

          <View style={styles.actions}>
            {a.patient.status?.code === 'rts' && a.patient.status.rts_id ? (
              <Scat6Button
                title={`Retour au sport · étape ${a.patient.status.step}/6`}
                icon="walk-outline"
                variant="secondary"
                onPress={() => navigation.navigate('scat6-rts', { rtsId: a.patient.status.rts_id })}
              />
            ) : null}
            <Scat6Button
              title="Fiche du patient"
              icon="person-outline"
              variant="secondary"
              onPress={() => navigation.navigate('scat6-patient', { patientId: a.patient_id })}
            />
            <Scat6Button
              title="Nouvel examen"
              icon="add"
              onPress={() => navigation.navigate('scat6-exam', { patientId: a.patient_id, kind: isBaseline ? 'post_choc' : 'retest' })}
            />
          </View>
        </View>
      </Scat6ScrollView>
    </View>
  );
};

const yesNo = (a: { value: unknown; status: string } | undefined) =>
  !a || a.status !== 'done' ? '—' : a.value === true ? 'Oui' : a.value === false ? 'Non' : String(a.value);

const Line: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={[styles.lineValue, strong && styles.lineStrong]}>{value}</Text>
  </View>
);

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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

  /* ---- Décision ---- */
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.md,
    borderRadius: 18,
    borderWidth: 2,
    padding: Spacings.lg,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
  },
  bannerText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  bannerMeta: {
    flexDirection: 'row',
    gap: Spacings.lg,
  },
  metaLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.muted,
  },
  metaValue: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.blueDark,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: SCAT.text,
  },

  /* ---- Détail ---- */
  grid: {
    flexDirection: 'row',
    gap: Spacings.md,
    alignItems: 'flex-start',
  },
  gridColumn: {
    flex: 1,
    gap: Spacings.md,
    minWidth: 0,
  },
  cell: {
    gap: 6,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacings.md,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  lineLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: SCAT.text,
  },
  lineValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.muted,
    textAlign: 'right',
  },
  lineStrong: {
    fontFamily: FONTS.medium,
    color: SCAT.blueInk,
  },
  note: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: SCAT.text,
    backgroundColor: SCAT.blueSoft,
    borderRadius: 10,
    padding: Spacings.sm,
  },
  muted: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: Spacings.sm,
  },
});
