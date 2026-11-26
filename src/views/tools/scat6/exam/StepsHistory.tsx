import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Spacings from '../../../../../constants/Spacings';
import { BACKGROUND, INSTRUCTIONS, ORIENTATION, SEVERITY_WORDS, SYMPTOMS } from '../../../../scat6/core/content';
import { symptomScore } from '../../../../scat6/core/scoring';
import { Scat6Card, Scat6Field, Scat6Instruction, Scat6Notice, Scat6YesNo } from '../components/Scat6UI';
import { Scat6SeverityRow } from '../components/Scat6Widgets';
import { SCAT, FONTS, SEVERITY_COLORS, SEVERITY_TEXT } from '../scat6Theme';
import type { StepProps } from './stepTypes';

const valueOf = (props: StepProps, code: string) => {
  const a = props.data.answers[code];
  return a && a.status === 'done' ? a.value : null;
};

/* ===================== 1 · RENSEIGNEMENTS ===================== */

export const BackgroundStep: React.FC<StepProps> = (props) => {
  const { exam, data, showMissing, target } = props;
  return (
    <>
      <Scat6Card>
        <Text style={styles.lead}>Antécédents du patient (« Oui » = antécédent présent).</Text>
        <View>
          {BACKGROUND.map((item) => (
            <Scat6YesNo
              key={item.code}
              ref={target(item.code)}
              label={item.label}
              value={valueOf(props, item.code) as boolean | null}
              missing={showMissing && valueOf(props, item.code) === null}
              onChange={(v) => exam.answer(item.code, v)}
            />
          ))}
        </View>
      </Scat6Card>
      <Scat6Card>
        <Scat6Field
          label="Notes (commotions antérieures et date, traitements en cours…)"
          value={data.background_notes}
          onChangeText={(background_notes) => exam.updateData((d) => ({ ...d, background_notes }))}
          multiline
          maxLength={2000}
        />
      </Scat6Card>
    </>
  );
};

/* ===================== 2 · SYMPTÔMES ===================== */

export const SymptomsStep: React.FC<StepProps> = (props) => {
  const { exam, data, record, showMissing, target } = props;
  const baseline = record.exam_kind === 'baseline';
  const score = symptomScore(data.answers);

  return (
    <>
      <Scat6Instruction text={baseline ? INSTRUCTIONS.symptomsBaseline : INSTRUCTIONS.symptomsPost} />
      <Scat6Notice>Le patient peut remplir la grille lui-même sur cet écran.</Scat6Notice>

      <Scat6Card style={styles.noGap}>
        <View style={styles.legend}>
          {SEVERITY_WORDS.map((w, n) => (
            <View key={w} style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: SEVERITY_COLORS[n] }]}>
                <Text style={[styles.legendNum, { color: SEVERITY_TEXT[n] }]}>{n}</Text>
              </View>
              <Text style={styles.legendText}>{w}</Text>
            </View>
          ))}
        </View>
        {SYMPTOMS.map((s, i) => (
          <Scat6SeverityRow
            key={s.code}
            ref={target(s.code)}
            index={i}
            label={s.label}
            value={valueOf(props, s.code) as number | null}
            missing={showMissing && valueOf(props, s.code) === null}
            onChange={(v) => exam.answer(s.code, v)}
          />
        ))}
      </Scat6Card>

      <View style={styles.scoreRow}>
        <ScoreTile label="Nombre de symptômes" value={score ? `${score.count}/22` : '—'} />
        <ScoreTile label="Sévérité" value={score ? `${score.severity}/132` : '—'} />
        {score && score.missing > 0 ? <ScoreTile label="Sans réponse" value={String(score.missing)} muted /> : null}
      </View>

      {!baseline && (
        <Scat6Card>
          <Scat6YesNo
            label="Les symptômes s’aggravent-ils avec l’activité physique ?"
            value={valueOf(props, 'S.phys') as boolean | null}
            onChange={(v) => exam.answer('S.phys', v)}
          />
          <Scat6YesNo
            label="Les symptômes s’aggravent-ils avec l’activité mentale ?"
            value={valueOf(props, 'S.ment') as boolean | null}
            onChange={(v) => exam.answer('S.ment', v)}
          />
          <Scat6Field
            label="Si 100 % correspond à « parfaitement normal », à combien de % vous sentez-vous ?"
            placeholder="0 – 100"
            keyboardType="number-pad"
            maxLength={3}
            style={styles.percent}
            value={data.percent_normal === null ? '' : String(data.percent_normal)}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, '');
              exam.updateData((d) => ({ ...d, percent_normal: digits === '' ? null : Math.min(100, Number(digits)) }));
            }}
          />
        </Scat6Card>
      )}
    </>
  );
};

/* ===================== 3 · ORIENTATION ===================== */

export const OrientationStep: React.FC<StepProps> = (props) => {
  const { exam, showMissing, target, now } = props;
  const date = new Date(now);
  // Réponses attendues, rappelées à l'examinateur à côté de chaque question.
  const expected: Record<string, string> = {
    'O.1': date.toLocaleDateString('fr-FR', { month: 'long' }),
    'O.2': date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
    'O.3': date.toLocaleDateString('fr-FR', { weekday: 'long' }),
    'O.4': String(date.getFullYear()),
    'O.5': date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
  const answered = ORIENTATION.filter((i) => valueOf(props, i.code) !== null);
  const correct = ORIENTATION.filter((i) => valueOf(props, i.code) === true).length;

  return (
    <>
      <Scat6Card>
        {ORIENTATION.map((item) => (
          <Scat6YesNo
            key={item.code}
            ref={target(item.code)}
            label={item.label}
            hint={`Attendu : ${expected[item.code]}`}
            yesLabel="Correct"
            noLabel="Incorrect"
            positive="yes"
            value={valueOf(props, item.code) as boolean | null}
            missing={showMissing && valueOf(props, item.code) === null}
            onChange={(v) => exam.answer(item.code, v)}
          />
        ))}
      </Scat6Card>
      <View style={styles.scoreRow}>
        <ScoreTile label="Orientation" value={answered.length === ORIENTATION.length ? `${correct}/5` : '—'} />
      </View>
    </>
  );
};

/* ===================== Tuile de score ===================== */

export const ScoreTile: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <View style={[styles.tile, muted && styles.tileMuted]}>
    <Text style={[styles.tileLabel, muted && { color: SCAT.muted }]}>{label}</Text>
    <Text style={[styles.tileValue, muted && { color: SCAT.muted }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  lead: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.muted,
  },
  noGap: {
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
    paddingBottom: Spacings.sm,
    marginBottom: Spacings.xs,
    borderBottomWidth: 1,
    borderBottomColor: SCAT.line,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SCAT.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendNum: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  legendText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.muted,
  },
  percent: {
    maxWidth: 160,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  // Tuile d'information (pas un bouton) : plate.
  tile: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: SCAT.blueSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SCAT.blueLine,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
  },
  tileMuted: {
    backgroundColor: SCAT.card,
    borderColor: SCAT.line,
  },
  tileLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.blueDark,
  },
  tileValue: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: SCAT.blueInk,
  },
});
