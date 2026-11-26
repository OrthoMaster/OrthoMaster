import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { INSTRUCTIONS, MBESS_ERRORS, MBESS_STANCES } from '../../../../scat6/core/content';
import { mbess, tandemGait } from '../../../../scat6/core/scoring';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Field, Scat6Instruction, Scat6Link, Scat6Notice, Scat6SectionTitle, Scat6YesNo } from '../components/Scat6UI';
import { Scat6Counter, Scat6Stopwatch } from '../components/Scat6Widgets';
import { SCAT, FONTS } from '../scat6Theme';
import { ScoreTile } from './StepsHistory';
import type { StepProps } from './stepTypes';

/* ===================== 4 · ÉQUILIBRE (mBESS) ===================== */

/**
 * 3 positions × 20 s, yeux fermés, mains sur les hanches, pieds nus. 1 point par erreur (10 au plus
 * par position) ; position non tenue 5 s → 10. Mousse facultative.
 */
export const BalanceStep: React.FC<StepProps> = ({ exam, data, showMissing, target }) => {
  const m = data.tests.mbess;

  const set = (surface: 'firm' | 'foam', i: number, v: number) => {
    const arr = [...(m[surface] ?? [null, null, null])];
    arr[i] = Math.min(10, v);
    exam.patchTests({ mbess: { ...m, [surface]: arr } });
  };

  const stances = (surface: 'firm' | 'foam') => (
    <View style={styles.stances}>
      {MBESS_STANCES.map((s, i) => {
        const value = (m[surface] ?? [])[i] ?? null;
        return (
          <Scat6Card
            key={`${surface}-${s.key}`}
            ref={target(`${surface}-${i}`)}
            highlight={showMissing && value === null}
            style={styles.stance}
          >
            <View>
              <Text style={styles.stanceTitle}>{s.label}</Text>
              <Text style={[styles.help, styles.stanceHint]}>{s.hint}</Text>
            </View>
            {/* Fin des 20 s : un compteur vide passe à 0, l'examinateur n'ajoute que les erreurs comptées. */}
            <Scat6Stopwatch target={20} startLabel="Démarrer 20 s" compact onStop={() => value === null && set(surface, i, 0)} />
            <Scat6Counter label="Erreurs" value={value} max={10} onChange={(v) => set(surface, i, v)} />
            <Scat6Link title="Position non tenue 5 s (= 10)" onPress={() => set(surface, i, 10)} />
          </Scat6Card>
        );
      })}
    </View>
  );

  const firm = mbess(m.firm);
  const foam = mbess(m.foam);

  return (
    <>
      <Scat6Card ref={target('foot')} highlight={showMissing && !m.foot}>
        <Scat6SectionTitle
          title="Pied testé (non dominant)"
          right={
            <View style={styles.row}>
              <Scat6Choice label="Gauche" selected={m.foot === 'gauche'} onPress={() => exam.patchTests({ mbess: { ...m, foot: 'gauche' } })} />
              <Scat6Choice label="Droit" selected={m.foot === 'droite'} onPress={() => exam.patchTests({ mbess: { ...m, foot: 'droite' } })} />
            </View>
          }
        />
        <Text style={styles.help}>Yeux fermés, mains sur les hanches, pieds nus, sans strapping. 20 secondes par position.</Text>
        <View style={styles.errors}>
          <Text style={styles.errorsTitle}>Erreurs (1 point chacune) :</Text>
          {MBESS_ERRORS.map((e) => (
            <View key={e} style={styles.errorItem}>
              <Ionicons name="remove-circle-outline" size={14} color={SCAT.blueDark} />
              <Text style={styles.help}>{e}</Text>
            </View>
          ))}
        </View>
      </Scat6Card>

      <Scat6SectionTitle title="Sol ferme" />
      {stances('firm')}

      {m.foam ? (
        <>
          <Scat6SectionTitle
            title="Mousse (≈ 50 × 40 × 6 cm)"
            right={<Scat6Link title="Retirer le test sur mousse" icon="close" onPress={() => exam.patchTests({ mbess: { ...m, foam: null } })} />}
          />
          {stances('foam')}
        </>
      ) : (
        <Scat6Button
          title="Ajouter le test sur mousse (facultatif)"
          icon="add"
          variant="secondary"
          onPress={() => exam.patchTests({ mbess: { ...m, foam: [null, null, null] } })}
          style={styles.alignStart}
        />
      )}

      <View style={styles.row}>
        <ScoreTile label="mBESS sol ferme" value={firm === null ? '—' : `${firm}/30`} />
        {m.foam ? <ScoreTile label="mBESS mousse" value={foam === null ? '—' : `${foam}/30`} /> : null}
      </View>

      <Scat6Card ref={target('normal')} highlight={showMissing && m.normal === null}>
        <Scat6YesNo
          label="Examen de l’équilibre normal ?"
          hint="La marche en tandem n’est réalisée que s’il est normal."
          value={m.normal}
          onChange={(normal) => exam.patchTests({ mbess: { ...m, normal } })}
        />
      </Scat6Card>
    </>
  );
};

/* ===================== 4 · MARCHE EN TANDEM ===================== */

/**
 * Ligne de 3 m : 1 essai d'entraînement puis 3 essais chronométrés (meilleur temps et moyenne).
 * Échec : sortie de la ligne, écart talon-orteils, appui sur l'examinateur ou un objet.
 */
export const TandemStep: React.FC<StepProps> = ({ exam, data, showMissing, target }) => {
  const td = data.tests.tandem;
  const nextEmpty = td.trials.findIndex((v) => v === null);
  const result = tandemGait(td.trials);

  const setTrial = (i: number, v: number | null) => {
    const trials = [...td.trials];
    trials[i] = v;
    exam.patchTests({ tandem: { ...td, trials, done: trials.some((x) => x !== null) } });
  };

  return (
    <>
      <Scat6Instruction text={INSTRUCTIONS.tandem} />
      <Scat6Notice>Ligne de 3 m × 38 mm (ruban adhésif). Un essai d’entraînement, puis 3 essais chronométrés.</Scat6Notice>

      <Scat6Card ref={target('chrono')} highlight={showMissing && !td.done}>
        <Scat6Stopwatch
          startLabel={nextEmpty >= 0 ? `Démarrer l’essai ${nextEmpty + 1}` : 'Démarrer'}
          onStop={(s) => {
            if (nextEmpty >= 0) setTrial(nextEmpty, s);
          }}
        />
        <View style={styles.trials}>
          {td.trials.map((v, i) => (
            <View key={i} style={styles.trial}>
              <Text style={styles.trialLabel}>Essai {i + 1}</Text>
              <Text style={[styles.trialValue, v !== null && v < 0 && { color: SCAT.danger }]}>
                {v === null ? '—' : v < 0 ? 'Échec' : `${v} s`}
              </Text>
              <View style={styles.row}>
                {v === null || v >= 0 ? <Scat6Link title="Échec" onPress={() => setTrial(i, -1)} /> : null}
                {v !== null ? <Scat6Link title="Effacer" onPress={() => setTrial(i, null)} /> : null}
              </View>
            </View>
          ))}
        </View>
      </Scat6Card>

      {result && (
        <View style={styles.row}>
          <ScoreTile label="Meilleur temps" value={`${result.best} s`} />
          <ScoreTile label="Moyenne" value={`${result.mean} s`} />
          {result.failed ? <ScoreTile label="Essais échoués" value={String(result.failed)} muted /> : null}
        </View>
      )}

      <Scat6Card>
        <Scat6SectionTitle title="Double tâche (facultative)" />
        <Scat6Instruction text={INSTRUCTIONS.dualTask} />
        <View style={styles.dual}>
          <View style={styles.dualField}>
            <Scat6Field
              label="Meilleur temps en double tâche (s)"
              keyboardType="decimal-pad"
              placeholder="ex. 14,2"
              value={td.dualBest === null ? '' : String(td.dualBest).replace('.', ',')}
              onChangeText={(v) => {
                const n = Number(v.replace(',', '.'));
                exam.patchTests({ tandem: { ...td, dualBest: v.trim() === '' || !Number.isFinite(n) || n <= 0 ? null : n } });
              }}
            />
          </View>
          <View style={styles.dualField}>
            <Scat6Counter
              label="Erreurs de calcul"
              value={td.dualErrors}
              onChange={(dualErrors) => exam.patchTests({ tandem: { ...td, dualErrors } })}
            />
          </View>
        </View>
      </Scat6Card>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  help: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  errors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Spacings.md,
    rowGap: 4,
  },
  errorsTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.text,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  /* ---- Positions ---- */
  stances: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  stance: {
    flexGrow: 1,
    flexBasis: 260,
    gap: Spacings.sm,
    padding: Spacings.md,
  },
  // Deux lignes réservées : les chronomètres des trois positions restent alignés.
  stanceHint: {
    minHeight: 40,
  },
  stanceTitle: {
    fontFamily: FONTS.title,
    fontSize: 17,
    color: SCAT.blueInk,
  },

  /* ---- Tandem ---- */
  trials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  trial: {
    flexGrow: 1,
    flexBasis: 180,
    borderWidth: 1,
    borderColor: SCAT.line,
    borderRadius: 14,
    padding: Spacings.sm,
    alignItems: 'center',
  },
  trialLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.muted,
  },
  trialValue: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: SCAT.blueInk,
  },
  dual: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.lg,
    alignItems: 'flex-end',
  },
  dualField: {
    flexGrow: 1,
    flexBasis: 260,
  },
});
