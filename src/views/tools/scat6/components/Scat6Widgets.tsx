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
  onStop: (seconds: number) => void;
  onReset?: () => void;
  /** Compte à rebours : s'arrête tout seul (mBESS : 20 s), précédé d'un 3-2-1. */
  target?: number;
  startLabel?: string;
  compact?: boolean;
}

/**
 * Chronomètre (mois à l'envers, tandem) ou durée cible (mBESS 20 s), au dixième.
 * Chaque repère est entendu (tick, départ, fin) : le médecin regarde le patient, pas l'écran.
 */
export const Scat6Stopwatch: React.FC<StopwatchProps> = ({ onStop, onReset, target, startLabel = 'Démarrer', compact }) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Ref : l'intervalle lit toujours le dernier onStop sans redémarrer.
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    if (countdown === null) return;
    cue('tick');
    const id = setTimeout(() => {
      if (countdown > 1) return setCountdown(countdown - 1);
      setCountdown(null);
      setElapsed(0);
      setStartedAt(Date.now());
      cue('start');
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown]);

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
  const counting = countdown !== null;

  const start = () => {
    if (target) return setCountdown(3);
    setElapsed(0);
    setStartedAt(Date.now());
    cue('start');
  };

  const stop = () => {
    if (counting) return setCountdown(null);
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
        <Text style={[styles.watchTime, compact && styles.watchTimeCompact, counting && { color: SCAT.blue }]}>
          {counting ? String(countdown) : `${elapsed.toFixed(1)} s`}
          {target && !counting ? <Text style={styles.watchTarget}> / {target} s</Text> : null}
        </Text>
      </View>
      {progress !== null && (
        <View style={styles.watchTrack}>
          <View style={[styles.watchFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
      <View style={styles.watchActions}>
        {running || counting ? (
          <Scat6Button title={counting ? 'Annuler' : 'Arrêter'} variant="danger" icon="stop" onPress={stop} small={compact} style={styles.flex} />
        ) : (
          <Scat6Button title={startLabel} icon="play" onPress={start} small={compact} style={styles.flex} />
        )}
        <Scat6Button
          title={compact ? '' : 'Remettre à zéro'}
          accessibilityLabel="Remettre à zéro"
          variant="secondary"
          icon="refresh"
          disabled={running || counting}
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

/** Compteur – / + (erreurs). null = pas encore saisi (différent de 0) : « – » le met à 0, « + » à 1. */
export const Scat6Counter: React.FC<{
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
}> = ({ label, value, onChange, max = 99 }) => (
  <View style={styles.counter}>
    <Text style={styles.counterLabel}>{label}</Text>
    <View style={styles.counterControls}>
      <Pressable
        style={[styles.counterButton, (value ?? 0) <= 0 && styles.counterButtonOff]}
        onPress={() => onChange(Math.max(0, (value ?? 0) - 1))}
        accessibilityLabel={`${label} : moins un`}
      >
        <Ionicons name="remove" size={20} color={SCAT.blueDark} />
      </Pressable>
      <Text style={[styles.counterValue, value === null && styles.counterValueEmpty]}>{value === null ? '–' : value}</Text>
      <Pressable
        style={[styles.counterButton, (value ?? 0) >= max && styles.counterButtonOff]}
        onPress={() => onChange(Math.min(max, (value ?? 0) + 1))}
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
