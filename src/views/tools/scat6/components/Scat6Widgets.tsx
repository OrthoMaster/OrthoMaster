import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { SEVERITY_WORDS } from '../../../../scat6/core/content';
import { cue } from '../../../../scat6/cues';
import { SCAT, FONTS, SEVERITY_COLORS, SEVERITY_TEXT } from '../scat6Theme';
import { Scat6Button } from './Scat6UI';

/* ===================== CHRONOMÈTRE ===================== */

interface StopwatchProps {
  onStart?: () => void;
  onStop: (seconds: number) => void;
  onReset?: () => void;
  /** Durée cible : s'arrête toute seule (mBESS : 20 s), démarre tout de suite.  */
  target?: number;
  startLabel?: string;
  compact?: boolean;
}

/**
 * Chronomètre (mois à l'envers, tandem) ou durée cible (mBESS 20 s), au dixième.
 * Chaque repère est entendu (tick, départ, fin) : le médecin regarde le patient, pas l'écran.
 */
export const Scat6Stopwatch: React.FC<StopwatchProps> = ({ onStart, onStop, onReset, target, startLabel = 'Démarrer', compact }) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Ref : l'intervalle lit toujours le dernier onStop sans redémarrer.
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      if (target && s >= target) {
        setElapsed(target);
        setStartedAt(null);
        cue('end');
        onStopRef.current(target);
      } else {
        setElapsed(s);
      }
    }, 100);
    return () => clearInterval(id);
  }, [startedAt, target]);

  const running = startedAt !== null;

  // Démarrage immédiat (pas de 3-2-1).
  const start = () => {
    onStart?.();
    setElapsed(0);
    setStartedAt(Date.now());
    cue('start');
  };

  const stop = () => {
    const s = Math.round(((Date.now() - (startedAt ?? Date.now())) / 1000) * 10) / 10;
    setStartedAt(null);
    setElapsed(s);
    cue('end');
    onStop(s);
  };

  const progress = target ? Math.min(1, elapsed / target) : null;

  return (
    <View style={[styles.watch, compact && styles.watchCompact]}>
      <View style={styles.watchDisplay}>
        <Ionicons name="stopwatch-outline" size={compact ? 22 : 28} color={running ? SCAT.blue : SCAT.faint} />
        <Text style={[styles.watchTime, compact && styles.watchTimeCompact]}>
          {`${elapsed.toFixed(1)} s`}
          {target ? <Text style={styles.watchTarget}> / {target} s</Text> : null}
        </Text>
      </View>
      {progress !== null && (
        <View style={styles.watchTrack}>
          <View style={[styles.watchFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
      <View style={styles.watchActions}>
        {running ? (
          <Scat6Button title="Arrêter" variant="danger" icon="stop" onPress={stop} small={compact} style={styles.flex} />
        ) : (
          <Scat6Button title={startLabel} icon="play" onPress={start} small={compact} style={styles.flex} />
        )}
        <Scat6Button
          title={compact ? '' : 'Remettre à zéro'}
          accessibilityLabel="Remettre à zéro"
          variant="secondary"
          icon="refresh"
          disabled={running}
          small={compact}
          onPress={() => {
            setElapsed(0);
            onReset?.();
          }}
        />
      </View>
    </View>
  );
};

/* ===================== COMPTEUR ===================== */

/**
 * Compteur – / + (erreurs, heures…). null = pas encore saisi (différent de 0) : « – » le met au minimum,
 * « + » à 1 (ou au minimum s'il est plus grand). `unit` s'affiche après la valeur (« 5 h »).
 */
export const Scat6Counter: React.FC<{
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}> = ({ label, value, onChange, min = 0, max = 99, unit }) => (
  <View style={styles.counter}>
    {label ? <Text style={styles.counterLabel}>{label}</Text> : null}
    <View style={styles.counterControls}>
      <Pressable
        style={[styles.counterButton, (value ?? min) <= min && styles.counterButtonOff]}
        onPress={() => onChange(value === null ? min : Math.max(min, value - 1))}
        accessibilityLabel={`${label} : moins un`}
      >
        <Ionicons name="remove" size={20} color={SCAT.blueDark} />
      </Pressable>
      <Text style={[styles.counterValue, value === null && styles.counterValueEmpty]}>
        {value === null ? '–' : unit ? `${value} ${unit}` : value}
      </Text>
      <Pressable
        style={[styles.counterButton, (value ?? 0) >= max && styles.counterButtonOff]}
        onPress={() => onChange(value === null ? Math.max(min, 1) : Math.min(max, value + 1))}
        accessibilityLabel={`${label} : plus un`}
      >
        <Ionicons name="add" size={20} color={SCAT.blueDark} />
      </Pressable>
    </View>
  </View>
);

/* ===================== MOTS ===================== */

/** Mots de la liste : le médecin coche ceux que le patient a rappelés (dans n'importe quel ordre). */
export const Scat6WordGrid: React.FC<{
  words: string[];
  selected: string[];
  onToggle: (word: string) => void;
  /** Mot surligné pendant la lecture guidée. */
  reading?: number | null;
}> = ({ words, selected, onToggle, reading }) => (
  <View style={styles.words}>
    {words.map((w, i) => {
      const on = selected.includes(w);
      return (
        <Pressable
          key={w}
          style={({ hovered }: any) => [
            styles.word,
            on && styles.wordOn,
            !on && hovered && styles.wordHover,
            reading === i && styles.wordReading,
          ]}
          onPress={() => onToggle(w)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: on }}
          accessibilityLabel={w}
        >
          <Text style={[styles.wordIndex, on && styles.wordTextOn]}>{i + 1}</Text>
          <Text style={[styles.wordText, on && styles.wordTextOn]}>{w}</Text>
          <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={on ? SCAT.card : SCAT.blueLine} />
        </Pressable>
      );
    })}
  </View>
);

/* ===================== SÉVÉRITÉ ===================== */

/** Une ligne de symptôme : 7 cases 0 → 6, la teinte fonce avec la sévérité. */
export const Scat6SeverityRow = React.forwardRef<
  View,
  { label: string; value: number | null; onChange: (v: number) => void; missing?: boolean; index: number }
>(({ label, value, onChange, missing, index }, ref) => {
  // Survol suivi par pointerenter / pointerleave : contrairement au « hovered » d'un Pressable,
  // il reste actif quand la souris passe sur les cases (enfants) et pendant le clic.
  const [hovered, setHovered] = useState(false);
  return (
    <View
      ref={ref}
      {...({ onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false) } as any)}
      style={[styles.sevRow, index % 2 === 1 && styles.sevRowAlt, missing && styles.sevRowMissing, hovered && styles.sevRowHover]}
    >
      <Text style={styles.sevLabel}>{label}</Text>
      <View style={styles.sevBoxes}>
        {[0, 1, 2, 3, 4, 5, 6].map((n) => {
          const on = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={({ hovered: boxHovered }: any) => [
                styles.sevBox,
                on && { backgroundColor: SEVERITY_COLORS[n], borderColor: n === 0 ? SCAT.blueDark : SEVERITY_COLORS[n] },
                !on && boxHovered && styles.sevBoxHover,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label} : ${n} — ${SEVERITY_WORDS[n]}`}
            >
              <Text style={[styles.sevBoxText, on && { color: SEVERITY_TEXT[n], fontFamily: FONTS.title }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

/* ===================== POURCENTAGE ===================== */

const PERCENT_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** Bleu de plus en plus foncé de 0 à 100 % (case remplie). */
const percentColor = (n: number) => {
  const from = [0xdc, 0xe9, 0xfa];
  const to = [0x24, 0x50, 0x8f];
  const k = n / 100;
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * k)).join(',')})`;
};

/**
 * « À combien de % vous sentez-vous normal ? » : 11 cases de 10 %, sans chiffres, de plus en plus foncées.
 * Les cases jusqu'à la valeur choisie sont remplies ; libellés aux deux bouts, valeur affichée.
 */
export const Scat6PercentScale: React.FC<{
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  minLabel: string;
  maxLabel: string;
}> = ({ label, value, onChange, minLabel, maxLabel }) => (
  <View style={styles.pct}>
    <View style={styles.pctHead}>
      <Text style={[styles.flex, styles.pctLabel]}>{label}</Text>
      <Text style={[styles.pctValue, value === null && { color: SCAT.faint }]}>{value === null ? '— %' : `${value} %`}</Text>
    </View>
    <View style={styles.pctBar} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {PERCENT_STEPS.map((n) => {
        const filled = value !== null && n <= value;
        const on = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(on ? null : n)}
            style={({ hovered }: any) => [
              styles.pctBox,
              filled && { backgroundColor: percentColor(n), borderColor: percentColor(n) },
              on && styles.pctBoxOn,
              !filled && hovered && { backgroundColor: percentColor(n), opacity: 0.45 },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${n} %`}
          />
        );
      })}
    </View>
    <View style={styles.pctEnds}>
      <Text style={styles.pctEnd}>{minLabel}</Text>
      <Text style={[styles.pctEnd, { textAlign: 'right' }]}>{maxLabel}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  /* ---- Pourcentage ---- */
  pct: {
    gap: Spacings.xs,
  },
  pctHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  pctLabel: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  pctValue: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: SCAT.blueInk,
    minWidth: 90,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  pctBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
  },
  pctBox: {
    flex: 1,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Case choisie : contour foncé, un peu plus haute.
  pctBoxOn: {
    borderColor: SCAT.blueInk,
    borderWidth: 2.5,
    transform: [{ scaleY: 1.25 }],
  },
  pctEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacings.md,
  },
  pctEnd: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },

  /* ---- Chronomètre ---- */
  watch: {
    backgroundColor: SCAT.blueSoft,
    borderRadius: 16,
    padding: Spacings.md,
    gap: Spacings.sm,
  },
  watchCompact: {
    padding: Spacings.sm,
  },
  watchDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
  },
  watchTime: {
    fontFamily: FONTS.title,
    fontSize: 40,
    color: SCAT.blueInk,
    fontVariant: ['tabular-nums'],
  },
  watchTimeCompact: {
    fontSize: 30,
  },
  watchTarget: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: SCAT.muted,
  },
  watchTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: SCAT.card,
    overflow: 'hidden',
  },
  watchFill: {
    height: '100%',
    backgroundColor: SCAT.blue,
  },
  watchActions: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },

  /* ---- Compteur ---- */
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
  },
  counterLabel: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: SCAT.blueLine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCAT.card,
  },
  counterButtonOff: {
    opacity: 0.4,
  },
  counterValue: {
    minWidth: 44,
    textAlign: 'center',
    fontFamily: FONTS.title,
    fontSize: 24,
    color: SCAT.blueInk,
  },
  counterValueEmpty: {
    color: SCAT.faint,
  },

  /* ---- Mots ---- */
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  word: {
    flexBasis: '18%',
    flexGrow: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: 12,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
  },
  wordOn: {
    backgroundColor: SCAT.blue,
    borderColor: SCAT.blueDark,
  },
  wordHover: {
    backgroundColor: SCAT.blueSoft,
  },
  wordReading: {
    borderColor: SCAT.draft,
    borderWidth: 3,
  },
  wordIndex: {
    width: 18,
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: SCAT.faint,
  },
  wordText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 17,
    color: SCAT.blueInk,
  },
  wordTextOn: {
    color: SCAT.card,
  },

  /* ---- Sévérité ---- */
  sevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingVertical: 8,
    paddingHorizontal: Spacings.sm,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sevRowAlt: {
    backgroundColor: '#F8FAFD',
  },
  sevRowHover: {
    backgroundColor: SCAT.card,
    borderColor: SCAT.blueLine,
    shadowColor: '#12203A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    transform: [{ scale: 1.01 }],
    zIndex: 1,
  },
  sevRowMissing: {
    borderColor: SCAT.draft,
    backgroundColor: SCAT.draftSoft,
  },
  sevLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  sevBoxes: {
    flexDirection: 'row',
    gap: 6,
  },
  sevBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    backgroundColor: SCAT.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sevBoxHover: {
    borderColor: SCAT.blue,
  },
  sevBoxText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.muted,
  },
});
