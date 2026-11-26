import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { EXAM_KINDS, LIST_IDS, sportLabel } from '../../../../scat6/core/content';
import { suggestList, suggestScoat6 } from '../../../../scat6/core/rules';
import type { ExamKind, ListId } from '../../../../scat6/core/types';
import type { Scat6PatientDetail } from '../../../../services/v2/Scat6Service';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Notice, Scat6SectionTitle } from '../components/Scat6UI';
import { EXAM_ICON } from '../components/scat6Icons';
import { SCAT, FONTS } from '../scat6Theme';
import { Scat6ScrollView } from '../components/Scat6ScrollView';

const DAY = 86_400_000;
const DAYS_AGO = [0, 1, 2, 3, 5, 7];

interface Props {
  patient: Scat6PatientDetail;
  initialKind?: ExamKind;
  starting: boolean;
  error: string | null;
  onStart: (input: { kind: ExamKind; injuryAt: string | null; list: ListId }) => void;
}

/**
 * Démarrage d'un examen : type, date du choc (sauf baseline), liste de mots.
 * Le patient est déjà identifié (âge vérifié en amont, comparaison avec sa baseline).
 */
export const ExamStart: React.FC<Props> = ({ patient, initialKind, starting, error, onStart }) => {
  const [kind, setKind] = useState<ExamKind>(initialKind ?? (patient.has_baseline ? 'post_choc' : 'baseline'));
  const [daysAgo, setDaysAgo] = useState<number | null>(0);
  const [otherDate, setOtherDate] = useState<string>('');
  const [tried, setTried] = useState(false);
  const [now] = useState(() => Date.now());

  // Liste proposée : différente de la dernière utilisée pour ce patient.
  const lastList = patient.assessments[0]?.word_list ?? null;
  const [list, setList] = useState<ListId>(suggestList(lastList));

  const needsInjury = kind !== 'baseline';
  const injuryAt = useMemo(() => {
    if (!needsInjury) return null;
    if (otherDate) return new Date(`${otherDate}T12:00:00`).toISOString();
    return daysAgo === null ? null : new Date(now - daysAgo * DAY).toISOString();
  }, [needsInjury, otherDate, daysAgo, now]);
  const tooLate = injuryAt ? suggestScoat6(new Date(injuryAt), new Date(now)) : false;
  const today = new Date(now).toISOString().slice(0, 10);

  const start = () => {
    setTried(true);
    if (needsInjury && !injuryAt) return;
    onStart({ kind, injuryAt, list });
  };

  return (
    <Scat6ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.column}>
        <Scat6Notice>
          Au calme, après repos : 10 à 15 minutes. Sensibilité maximale dans les 72 h ; utilisable jusqu’à 7 jours après le choc.
          Matériel : ruban de 3 m au sol, mousse (facultative). Le chronomètre est intégré.
        </Scat6Notice>

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
                  onPress={() => {
                    setDaysAgo(d);
                    setOtherDate('');
                  }}
                />
              ))}
            </View>
            {Platform.OS === 'web' && (
              <View style={styles.otherDate}>
                <Ionicons name="calendar-outline" size={18} color={SCAT.blueDark} />
                <Text style={styles.otherLabel}>Autre date :</Text>
                {React.createElement('input', {
                  type: 'date',
                  value: otherDate,
                  max: today,
                  onChange: (e: any) => setOtherDate(e.target.value),
                  style: {
                    fontFamily: 'Roboto',
                    fontSize: 15,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1.5px solid ${otherDate ? SCAT.blue : SCAT.line}`,
                    color: SCAT.text,
                  },
                })}
              </View>
            )}
            {tooLate && (
              <Scat6Notice tone="warning">Plus de 7 jours après le choc : préférez le SCOAT6 (évaluation en consultation).</Scat6Notice>
            )}
          </Scat6Card>
        )}

        <Scat6Card>
          <Scat6SectionTitle
            title="Liste de mots"
            hint={lastList ? `Dernière utilisée pour ce patient : ${lastList}. Elle peut encore être changée à l’étape Mémoire.` : 'Elle peut encore être changée à l’étape Mémoire.'}
            right={
              <View style={styles.row}>
                {LIST_IDS.map((id) => (
                  <Scat6Choice key={id} label={`Liste ${id}`} selected={list === id} onPress={() => setList(id)} />
                ))}
              </View>
            }
          />
        </Scat6Card>

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
