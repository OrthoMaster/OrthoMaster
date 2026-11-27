import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { EXAM_KINDS, sportLabel } from '../../../../scat6/core/content';
import { recentInjuries, sinceInjuryLabel } from '../../../../scat6/core/injury';
import { suggestList, suggestScoat6 } from '../../../../scat6/core/rules';
import type { ExamKind, ListId } from '../../../../scat6/core/types';
import type { Scat6PatientDetail } from '../../../../services/v2/Scat6Service';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Notice, Scat6SectionTitle } from '../components/Scat6UI';
import { EXAM_ICON } from '../components/scat6Icons';
import { SCAT, FONTS } from '../scat6Theme';
import { Scat6ScrollView } from '../components/Scat6ScrollView';
import { formatDateTime } from '../scat6Format';

const DAY = 86_400_000;
const DAYS_AGO = [0, 1, 2, 3, 5, 7];

/** AAAA-MM-JJ en heure locale (toISOString donnerait le jour UTC). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Champ date / heure natif du navigateur (souris ou clavier). */
const webInput = (type: 'date' | 'time', value: string, onChange: (v: string) => void, extra: object = {}, error = false) =>
  React.createElement('input', {
    type,
    value,
    ...extra,
    onChange: (e: any) => onChange(e.target.value),
    style: {
      fontFamily: 'Roboto',
      fontSize: 15,
      padding: '8px 10px',
      borderRadius: 10,
      border: `1.5px solid ${error ? SCAT.danger : value ? SCAT.blue : SCAT.line}`,
      color: SCAT.text,
    },
  });

interface Props {
  patient: Scat6PatientDetail;
  initialKind?: ExamKind;
  starting: boolean;
  error: string | null;
  onStart: (input: { kind: ExamKind; injuryAt: string | null; list: ListId }) => void;
}

/**
 * Démarrage d'un examen : type, date du choc (sauf baseline). La liste de mots est choisie automatiquement.
 * Le patient est déjà identifié (âge vérifié en amont, comparaison avec sa baseline).
 */
export const ExamStart: React.FC<Props> = ({ patient, initialKind, starting, error, onStart }) => {
  const [kind, setKind] = useState<ExamKind>(initialKind ?? (patient.has_baseline ? 'post_choc' : 'baseline'));
  const [daysAgo, setDaysAgo] = useState<number | null>(0);
  const [otherDate, setOtherDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [tried, setTried] = useState(false);
  const [now] = useState(() => Date.now());

  // Chocs récents du patient (< 7 jours) : un nouvel examen peut s'y rattacher (H+3, H+12, J+2…).
  const recent = useMemo(() => recentInjuries(patient.assessments, now), [patient.assessments, now]);
  const [choc, setChoc] = useState<string | 'new'>(recent[0]?.injuryAt ?? 'new');

  // Liste de mots : différente de la dernière utilisée pour ce patient (changeable à l'étape Mémoire).
  const list: ListId = suggestList(patient.assessments[0]?.word_list ?? null);

  const needsInjury = kind !== 'baseline';
  // Heure du choc : obligatoire sur le web (sert à H+…), midi par défaut ailleurs.
  const timeNeeded = Platform.OS === 'web';
  const injuryAt = useMemo(() => {
    if (!needsInjury) return null;
    if (choc !== 'new') return choc;
    if (timeNeeded && !time) return null;
    const hhmm = time || '12:00';
    const day = otherDate || (daysAgo === null ? null : localDay(new Date(now - daysAgo * DAY)));
    if (!day) return null;
    const at = new Date(`${day}T${hhmm}:00`);
    return at.getTime() > now ? null : at.toISOString();
  }, [needsInjury, choc, otherDate, daysAgo, time, timeNeeded, now]);
  const future = needsInjury && choc === 'new' && !!time && injuryAt === null && (!!otherDate || daysAgo !== null);
  const tooLate = injuryAt ? suggestScoat6(new Date(injuryAt), new Date(now)) : false;
  const today = localDay(new Date(now));

  const start = () => {
    setTried(true);
    if (needsInjury && !injuryAt) return;
    onStart({ kind, injuryAt, list });
  };

  return (
    <Scat6ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.column}>
        <Scat6Card>
          <Scat6SectionTitle title="Type d’examen" />
          <View style={styles.kinds}>
            {EXAM_KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <View key={k.id} style={[styles.kind, on && styles.kindOn]}>
                  <Scat6Choice label={k.label} icon={EXAM_ICON[k.id]} selected={on} onPress={() => setKind(k.id)} />
                  <Text style={styles.kindHint}>{k.hint}</Text>
                </View>
              );
            })}
          </View>
          {kind !== 'baseline' && !patient.has_baseline && (
            <Scat6Notice tone="warning">Pas de baseline pour ce patient : les résultats ne pourront pas être comparés.</Scat6Notice>
          )}
        </Scat6Card>

        {needsInjury && (
          <Scat6Card highlight={tried && !injuryAt}>
            <Scat6SectionTitle
              title="Choc"
              hint={recent.length ? 'Plusieurs examens peuvent suivre le même choc (H+3, H+12, J+2…).' : null}
            />

            {/* Chocs récents du patient : rattacher l'examen au même choc. */}
            {recent.length > 0 && (
              <View style={styles.row}>
                {recent.map((g) => (
                  <Scat6Choice
                    key={g.injuryAt}
                    icon="flash-outline"
                    label={`Choc du ${formatDateTime(g.injuryAt)} · ${sinceInjuryLabel(g.injuryAt, now)} · ${g.count} examen${g.count > 1 ? 's' : ''}`}
                    selected={choc === g.injuryAt}
                    onPress={() => setChoc(g.injuryAt)}
                  />
                ))}
                <Scat6Choice icon="add" label="Nouveau choc" selected={choc === 'new'} onPress={() => setChoc('new')} />
              </View>
            )}

            {choc === 'new' && (
              <>
                {recent.length > 0 && <Text style={styles.subLabel}>Date du nouveau choc</Text>}
                <View style={styles.row}>
                  {DAYS_AGO.map((d) => (
                    <Scat6Choice
                      key={d}
                      label={d === 0 ? 'Aujourd’hui' : d === 1 ? 'Hier' : `Il y a ${d} jours`}
                      selected={!otherDate && daysAgo === d}
                      onPress={() => {
                        setDaysAgo(d);
                        setOtherDate('');
                      }}
                    />
                  ))}
                </View>
                {Platform.OS === 'web' && (
                  <View style={styles.otherRow}>
                    <View style={styles.otherDate}>
                      <Ionicons name="calendar-outline" size={18} color={SCAT.blueDark} />
                      <Text style={styles.otherLabel}>Autre date :</Text>
                      {webInput('date', otherDate, setOtherDate, { max: today })}
                    </View>
                    <View style={styles.otherDate}>
                      <Ionicons name="time-outline" size={18} color={tried && !time ? SCAT.danger : SCAT.blueDark} />
                      <Text style={[styles.otherLabel, tried && !time && { color: SCAT.danger }]}>Heure du choc :</Text>
                      {webInput('time', time, setTime, {}, tried && !time)}
                      <Text style={styles.kindHint}>approximative si besoin</Text>
                    </View>
                  </View>
                )}
                {future && <Scat6Notice tone="warning">Cette heure est dans le futur.</Scat6Notice>}
              </>
            )}

            {injuryAt && (
              <Text style={styles.when}>
                Examen à <Text style={styles.whenStrong}>{sinceInjuryLabel(injuryAt, now)}</Text> du choc ({formatDateTime(injuryAt)})
              </Text>
            )}
            {tooLate && (
              <Scat6Notice tone="warning">Plus de 7 jours après le choc : préférez le SCOAT6 (évaluation en consultation).</Scat6Notice>
            )}
          </Scat6Card>
        )}

        {error ? <Scat6Notice tone="danger">{error}</Scat6Notice> : null}

        <View style={styles.actions}>
          <Text style={styles.summary}>
            {patient.name} · {sportLabel(patient.sport)} · {EXAM_KINDS.find((k) => k.id === kind)?.label}
          </Text>
          <Scat6Button title="Commencer l’examen" icon="play" loading={starting} onPress={start} />
        </View>
      </View>
    </Scat6ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: Spacings.lg,
  },
  column: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    gap: Spacings.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  kind: {
    flexGrow: 1,
    flexBasis: 220,
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    alignItems: 'flex-start',
  },
  kindOn: {
    borderColor: SCAT.blue,
    backgroundColor: SCAT.blueSoft,
  },
  kindHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  otherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.lg,
  },
  otherDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  subLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  when: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: SCAT.text,
  },
  whenStrong: {
    fontFamily: FONTS.title,
    color: SCAT.blueInk,
  },
  otherLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    paddingVertical: Spacings.sm,
  },
  summary: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.muted,
  },
});
