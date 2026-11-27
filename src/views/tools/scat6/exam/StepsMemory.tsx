import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { DIGIT_LISTS, INSTRUCTIONS, LIST_IDS, MONTHS_REVERSED, WORD_LISTS } from '../../../../scat6/core/content';
import { delayedRecallRemainingMs } from '../../../../scat6/core/rules';
import { digitsBackward, digitsState, monthsBackward } from '../../../../scat6/core/scoring';
import type { ListId } from '../../../../scat6/core/types';
import { cue } from '../../../../scat6/cues';
import { scat6Confirm } from '../components/Scat6Dialog';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Instruction, Scat6Link, Scat6Notice, Scat6SectionTitle } from '../components/Scat6UI';
import { Scat6Counter, Scat6Stopwatch, Scat6WordGrid } from '../components/Scat6Widgets';
import { formatTime } from '../scat6Format';
import { SCAT, FONTS } from '../scat6Theme';
import { ScoreTile } from './StepsHistory';
import type { StepProps } from './stepTypes';

/* ===================== 3 · MÉMOIRE IMMÉDIATE ===================== */

/**
 * 10 mots lus à 1 par seconde, 3 essais TOUJOURS, ordre libre. Ne pas dire au patient qu'il devra
 * s'en souvenir plus tard. L'essai en cours est enregistré (reprise au bon essai).
 */
export const MemoryStep: React.FC<StepProps> = ({ exam, data, showMissing, target }) => {
  const mem = data.tests.memory;
  const trial = Math.min(2, Math.max(0, mem.current ?? 0));
  const words = WORD_LISTS[mem.list];
  const total = mem.trials.reduce((s, x) => s + x.length, 0);
  const [reading, setReading] = useState<number | null>(null);

  // Lecture guidée : un mot surligné par seconde (rythme officiel), avec un tick.
  useEffect(() => {
    if (reading === null) return;
    cue('tick');
    const id = setTimeout(() => setReading(reading + 1 < words.length ? reading + 1 : null), 1000);
    return () => clearTimeout(id);
  }, [reading, words.length]);

  const toggle = (word: string) => {
    const trials = mem.trials.map((x, i) =>
      i !== trial ? x : x.includes(word) ? x.filter((w) => w !== word) : [...x, word]
    ) as typeof mem.trials;
    exam.patchTests({ memory: { ...mem, trials } });
  };

  // Autre liste, dans l'ordre A → B → C → A. La liste en cours n'est pas affichée (rapport seulement).
  const changeList = async () => {
    const list = LIST_IDS[(LIST_IDS.indexOf(mem.list) + 1) % LIST_IDS.length];
    if (total > 0 && !(await scat6Confirm('Changer de liste ?', 'Les essais déjà saisis seront effacés.', 'Changer', true))) return;
    // La mémoire différée porte sur la même liste : elle repart aussi de zéro.
    exam.patchTests({
      memory: { list, trials: [[], [], []], endedAt: null, current: 0 },
      delayed: { recalled: [], done: false },
    });
  };


  return (
    <>
      <Scat6Card>
        <Scat6SectionTitle
          title="Liste de mots"
          hint="Choisie différente de celle du dernier examen du patient. Les listes sont équivalentes."
          right={<Scat6Button title="Changer de liste" icon="swap-horizontal" variant="secondary" small onPress={changeList} />}
        />
        {mem.endedAt ? (
          <Scat6Notice tone="success">
            Essais terminés à {formatTime(mem.endedAt)} : la mémoire différée sera possible 5 minutes plus tard.
          </Scat6Notice>
        ) : (
          <Scat6Notice tone="warning">
            Lisez 1 mot par seconde. Les 3 essais sont toujours réalisés. Ne dites pas au patient qu’il devra s’en souvenir plus tard.
          </Scat6Notice>
        )}
      </Scat6Card>

      <Scat6Instruction text={trial === 0 ? INSTRUCTIONS.memoryTrial1 : INSTRUCTIONS.memoryTrial23} />

      <Scat6Card ref={target('trials')} highlight={showMissing && !mem.endedAt && trial < 2}>
        <View style={styles.trialHead}>
          <View style={styles.row}>
            {[0, 1, 2].map((i) => (
              <Scat6Choice
                key={i}
                label={`Essai ${i + 1} · ${mem.trials[i].length}/10`}
                selected={trial === i}
                onPress={() => exam.patchTests({ memory: { ...mem, current: i } })}
              />
            ))}
          </View>
          <Scat6Button
            title={reading === null ? 'Lecture guidée (1 mot / s)' : 'Arrêter la lecture'}
            icon={reading === null ? 'volume-medium-outline' : 'stop'}
            variant="secondary"
            small
            onPress={() => setReading(reading === null ? 0 : null)}
          />
        </View>
        <Text style={styles.help}>Lisez la liste, puis cochez les mots que le patient répète (essai {trial + 1}).</Text>
        <Scat6WordGrid words={words} selected={mem.trials[trial]} onToggle={toggle} reading={reading} />
        {!mem.endedAt && trial < 2 && (
          <Scat6Button
            title={`Passer à l’essai ${trial + 2}`}
            icon="arrow-forward"
            variant="secondary"
            onPress={() => exam.patchTests({ memory: { ...mem, current: trial + 1 } })}
            style={styles.alignStart}
          />
        )}
      </Scat6Card>

      <View style={styles.row}>
        <ScoreTile label="Mémoire immédiate" value={`${total}/30`} />
      </View>
    </>
  );
};

/* ===================== 3 · CONCENTRATION ===================== */

/** Chiffres à l'envers (/4) + mois à l'envers (/1). */
export const ConcentrationStep: React.FC<StepProps> = ({ exam, data, showMissing, target }) => {
  const { digits, months } = data.tests;
  const state = digitsState(digits.results);
  const digitScore = digitsBackward(digits.results);
  const monthScore = monthsBackward(months);

  const changeList = async (list: ListId) => {
    if (list === digits.list) return;
    if (
      digits.results.some((r) => r.length) &&
      !(await scat6Confirm('Changer de liste ?', 'Les séries déjà notées seront effacées.', 'Changer', true))
    )
      return;
    exam.patchTests({ digits: { list, results: [] } });
  };

  const mark = (ok: boolean) => {
    if (state.done) return;
    const results = digits.results.map((r) => [...r]);
    results[state.len] = [...(results[state.len] ?? []), ok];
    exam.patchTests({ digits: { ...digits, results } });
  };

  const restart = async () => {
    if (await scat6Confirm('Recommencer les chiffres ?', 'Les séries déjà notées seront effacées.', 'Recommencer', true)) {
      exam.patchTests({ digits: { ...digits, results: [] } });
    }
  };

  const series = !state.done ? DIGIT_LISTS[digits.list][state.len][state.attempt] : null;

  return (
    <>
      <Scat6Card ref={target('digits')} highlight={showMissing && !state.done}>
        <Scat6SectionTitle
          title="Chiffres à l’envers"
          right={
            <View style={styles.row}>
              {LIST_IDS.map((id) => (
                <Scat6Choice key={id} label={`Liste ${id}`} selected={digits.list === id} onPress={() => changeList(id)} />
              ))}
            </View>
          }
        />
        <Scat6Instruction text={INSTRUCTIONS.digits} />

        {state.done ? (
          <Scat6Notice tone="success">Chiffres à l’envers terminés : {digitScore ?? 0}/4.</Scat6Notice>
        ) : (
          <View style={styles.series}>
            <Text style={styles.seriesMeta}>
              {state.len + 3} chiffres · essai {state.attempt + 1} sur 2 — lire 1 chiffre par seconde
            </Text>
            <Text style={styles.seriesDigits}>{series}</Text>
            <Text style={styles.seriesExpected}>Réponse attendue : {series?.split('-').reverse().join('-')}</Text>
            <View style={styles.markRow}>
              <Scat6Button title="Réussi" icon="checkmark" onPress={() => mark(true)} style={styles.markButton} />
              <Scat6Button title="Échoué" icon="close" variant="secondary" onPress={() => mark(false)} style={styles.markButton} />
            </View>
          </View>
        )}

        {digits.results.length > 0 && (
          <View style={styles.history}>
            {digits.results.map((attempts, len) => (
              <View key={len} style={styles.historyItem}>
                <Text style={styles.historyLen}>{len + 3} chiffres</Text>
                {attempts.map((ok, i) => (
                  <Ionicons key={i} name={ok ? 'checkmark-circle' : 'close-circle'} size={18} color={ok ? SCAT.success : SCAT.danger} />
                ))}
              </View>
            ))}
            <Scat6Link title="Recommencer" icon="refresh" onPress={restart} />
          </View>
        )}
      </Scat6Card>

      <Scat6Card ref={target('months')} highlight={showMissing && state.done && !months.done}>
        <Scat6SectionTitle title="Mois à l’envers" hint="1 point si aucune erreur et moins de 30 secondes." />
        <Scat6Instruction text={INSTRUCTIONS.months} />
        <Text style={styles.help}>Aide à l’examinateur : {MONTHS_REVERSED.join(' · ')}</Text>
        <View style={styles.monthsRow}>
          <View style={styles.flex}>
            <Scat6Stopwatch
              onStop={(seconds) => exam.patchTests({ months: { ...months, seconds, done: true, errors: months.errors ?? 0 } })}
              onReset={() => exam.patchTests({ months: { ...months, seconds: null, done: false } })}
            />
          </View>
          <View style={styles.monthsSide}>
            <Scat6Counter
              label="Erreurs"
              value={months.errors}
              max={12}
              onChange={(errors) => exam.patchTests({ months: { ...months, errors } })}
            />
            {months.done && (
              <Text style={styles.help}>
                {months.seconds} s · {months.errors ?? 0} erreur(s) → {monthScore}/1
              </Text>
            )}
          </View>
        </View>
      </Scat6Card>

      <View style={styles.row}>
        <ScoreTile
          label="Concentration"
          value={digitScore !== null && monthScore !== null ? `${digitScore + monthScore}/5` : '—'}
        />
      </View>
    </>
  );
};

/* ===================== 5 · MÉMOIRE DIFFÉRÉE ===================== */

/** Rappel des mots, ouvert au moins 5 minutes après la fin de la mémoire immédiate (R8). */
export const DelayedRecallStep: React.FC<StepProps> = ({ exam, data, target, now }) => {
  const { memory, delayed } = data.tests;
  const remaining = memory.endedAt ? delayedRecallRemainingMs(new Date(memory.endedAt), new Date(now)) : null;
  const locked = remaining === null || remaining > 0;

  // Fin du délai entendue : le médecin fait peut-être l'équilibre pendant l'attente.
  const wasLocked = useRef(locked);
  useEffect(() => {
    if (wasLocked.current && !locked && remaining !== null) cue('end');
    wasLocked.current = locked;
  }, [locked, remaining]);

  const mm = remaining ? Math.floor(remaining / 60000) : 0;
  const ss = remaining ? String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0') : '00';

  const toggle = (w: string) =>
    exam.patchTests({
      delayed: {
        done: true,
        recalled: delayed.recalled.includes(w) ? delayed.recalled.filter((x) => x !== w) : [...delayed.recalled, w],
      },
    });

  return (
    <>
      <View ref={target('lock')}>
        {remaining === null ? (
          <Scat6Notice tone="warning">
            La mémoire immédiate n’a pas été terminée : la mémoire différée ne peut pas être réalisée.
          </Scat6Notice>
        ) : locked ? (
          <View style={styles.wait}>
            <Ionicons name="hourglass-outline" size={34} color={SCAT.blue} />
            <View style={styles.flex}>
              <Text style={styles.waitTitle}>
                Disponible dans {mm}:{ss}
              </Text>
              <Text style={styles.help}>
                Au moins 5 minutes après la fin de la mémoire immédiate ({formatTime(memory.endedAt)}). Un signal sonore
                indique la fin du délai.
              </Text>
            </View>
          </View>
        ) : (
          <Scat6Notice tone="success">Le délai de 5 minutes est respecté.</Scat6Notice>
        )}
      </View>

      {!locked && (
        <>
          <Scat6Instruction text={INSTRUCTIONS.delayed} />
          <Scat6Card>
            <Scat6SectionTitle title="Mots rappelés" hint="Aucun mot rappelé est un résultat valable (0/10)." />
            <Scat6WordGrid words={WORD_LISTS[memory.list]} selected={delayed.recalled} onToggle={toggle} />
          </Scat6Card>
          <View style={styles.row}>
            <ScoreTile label="Mémoire différée" value={`${delayed.recalled.length}/10`} />
          </View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  markRow: {
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  markButton: {
    minWidth: 160,
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  help: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  trialHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
  },

  /* ---- Chiffres ---- */
  series: {
    alignItems: 'center',
    gap: Spacings.xs,
    backgroundColor: SCAT.blueSoft,
    borderRadius: 16,
    padding: Spacings.lg,
  },
  seriesMeta: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.blueDark,
  },
  seriesDigits: {
    fontFamily: FONTS.title,
    fontSize: 48,
    letterSpacing: 4,
    color: SCAT.blueInk,
  },
  seriesExpected: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.muted,
    marginBottom: Spacings.xs,
  },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyLen: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.text,
    marginRight: 2,
  },

  /* ---- Mois ---- */
  monthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
    alignItems: 'center',
  },
  monthsSide: {
    minWidth: 220,
    gap: Spacings.xs,
  },

  /* ---- Attente ---- */
  wait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: SCAT.blueLine,
    borderStyle: 'dashed',
    padding: Spacings.lg,
  },
  waitTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: SCAT.blueInk,
    fontVariant: ['tabular-nums'],
  },
});
