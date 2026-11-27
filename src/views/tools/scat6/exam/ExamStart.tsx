import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { EXAM_KINDS, sportLabel } from '../../../../scat6/core/content';
import { currentEpisode, formatInjury, injuryDay, injuryFromDay, injuryFromDelay, sinceInjuryLabel, timeKnown } from '../../../../scat6/core/injury';
import { suggestList, suggestScoat6 } from '../../../../scat6/core/rules';
import type { ExamKind, ListId } from '../../../../scat6/core/types';
import type { Scat6PatientDetail } from '../../../../services/v2/Scat6Service';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Link, Scat6Notice, Scat6SectionTitle } from '../components/Scat6UI';
import { Scat6Counter } from '../components/Scat6Widgets';
import { EXAM_ICON } from '../components/scat6Icons';
import { SCAT, FONTS } from '../scat6Theme';
import { Scat6ScrollView } from '../components/Scat6ScrollView';

const DAY = 86_400_000;
const DAYS_AGO = [0, 1];

/** Nombre de jours calendaires (heure locale) entre `t` et `now`. */
const calendarDaysAgo = (t: number, now: number) => {
  const day = (x: number) => {
    const d = new Date(x);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  return Math.round((day(now) - day(t)) / DAY);
};

/** AAAA-MM-JJ en heure locale (toISOString donnerait le jour UTC). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Champ date / heure natif du navigateur (souris ou clavier). */
const webInput = (type: 'date', value: string, onChange: (v: string) => void, extra: { style?: object; [k: string]: any } = {}, error = false) =>
  React.createElement('input', {
    type,
    value,
    ...extra,
    onChange: (e: any) => onChange(e.target.value),
    style: {
      ...extra.style,
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
  const [now] = useState(() => Date.now());
  // Choc que ce nouvel examen continue (re-test, ou « Après un choc » juste après un autre), sinon nouveau choc.
  const episode = useMemo(() => currentEpisode(patient.assessments, kind, now), [patient.assessments, kind, now]);
  // Jour proposé : celui du choc en cours, sinon aujourd'hui (tant que le médecin n'a pas choisi).
  const episodeDaysAgo = episode?.injuryAt ? calendarDaysAgo(new Date(episode.injuryAt).getTime(), now) : 0;
  const [dayChoice, setDayChoice] = useState<{ daysAgo: number | null; otherDate: string } | null>(null);
  const daysAgo = dayChoice ? dayChoice.daysAgo : DAYS_AGO.includes(episodeDaysAgo) ? episodeDaysAgo : null;
  const otherDate = dayChoice ? dayChoice.otherDate : !DAYS_AGO.includes(episodeDaysAgo) && episode?.injuryAt ? injuryDay(episode.injuryAt) : '';
  const setDaysAgo = (d: number | null) => setDayChoice({ daysAgo: d, otherDate: '' });
  const setOtherDate = (v: string) => setDayChoice({ daysAgo: v ? null : daysAgo, otherDate: v });
  // Facultatif : nombre d'heures depuis le choc (0 = à l'instant, 1 à 24 h), en plus du jour.
  const [hours, setHours] = useState<number | null>(null);
  const [tried, setTried] = useState(false);

  // Liste de mots : différente de la dernière utilisée pour ce patient (changeable à l'étape Mémoire).
  const list: ListId = suggestList(patient.assessments[0]?.word_list ?? null);

  const needsInjury = kind !== 'baseline';
  const day = otherDate || (daysAgo === null ? null : localDay(new Date(now - daysAgo * DAY)));
  // Le médecin donne le jour (et, s'il veut, les heures). Sans heures saisies, on reprend en silence l'heure
  // du choc en cours s'il tombe ce jour-là (H+ cohérent entre ses examens).
  const known = episode?.injuryAt && day && injuryDay(episode.injuryAt) === day ? episode.injuryAt : null;
  const injuryAt = useMemo(() => {
    if (!needsInjury || !day) return null;
    if (hours !== null && !otherDate) return injuryFromDelay(hours, now);
    if (known && timeKnown(known)) return known;
    return injuryFromDay(day);
  }, [needsInjury, day, known, hours, otherDate, now]);
  /** Jour choisi : les heures saisies restent si elles tombent sur ce jour, sinon effacées. */
  const pickDay = (d: number) => {
    setDaysAgo(d);
    if (hours !== null && calendarDaysAgo(now - hours * 3_600_000, now) !== d) setHours(null);
  };
  /** Heures depuis le choc : le jour (aujourd'hui / hier) suit. */
  const pickHours = (h: number | null) => {
    setHours(h);
    if (h !== null) setDaysAgo(calendarDaysAgo(now - h * 3_600_000, now));
  };

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
            <Scat6SectionTitle title="Date du choc" />
            <View style={styles.row}>
              {DAYS_AGO.map((d) => (
                <Scat6Choice
                  key={d}
                  label={d === 0 ? 'Aujourd’hui' : d === 1 ? 'Hier' : `Il y a ${d} jours`}
                  selected={!otherDate && daysAgo === d}
                  onPress={() => pickDay(d)}
                />
              ))}
            </View>
            {Platform.OS === 'web' && (
              <View style={styles.otherDate}>
                <Ionicons name="calendar-outline" size={18} color={SCAT.blueDark} />
                <Text style={styles.otherLabel}>Autre date :</Text>
                {webInput('date', otherDate, (v) => {
                  setOtherDate(v);
                  setHours(null);
                }, { max: today })}
              </View>
            )}

            {/* Facultatif, choc d'aujourd'hui ou d'hier : depuis combien d'heures. */}
            {!otherDate && (daysAgo === 0 || daysAgo === 1) && (
              <View style={styles.hoursRow}>
                <Text style={styles.subLabel}>Heures après le choc (facultatif)</Text>
                <Scat6Choice label="À l’instant" selected={hours === 0} onPress={() => pickHours(hours === 0 ? null : 0)} />
                <Scat6Counter
                  label=""
                  unit="h"
                  min={1}
                  max={24}
                  value={hours !== null && hours >= 1 ? hours : null}
                  onChange={pickHours}
                />
                {hours !== null && <Scat6Link title="Effacer" onPress={() => pickHours(null)} />}
              </View>
            )}

            {injuryAt && (
              <Text style={styles.when}>
                Examen à <Text style={styles.whenStrong}>{sinceInjuryLabel(injuryAt, now)}</Text> du choc ({formatInjury(injuryAt)}
                {timeKnown(injuryAt) ? '' : ', heure inconnue'})
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
  otherDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  hoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingTop: Spacings.xs,
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
