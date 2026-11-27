import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { CONSIGNES, returnLines, sportLabel } from '../../../../scat6/core/content';
import { CompareRow, formatScore } from '../../../../scat6/core/scoring';
import { SCAT, FONTS } from '../scat6Theme';

/* ===================== TABLEAU ACTUEL / BASELINE ===================== */

/**
 * Étape 6 du SCAT6 : chaque domaine à côté de la baseline. Aucun seuil, aucun verdict ;
 * l'écart est seulement coloré selon le sens (plus de symptômes = moins bon, plus de mots = mieux).
 */
/** Pastille d'écart (+2 / −1 / 0) : rouge si moins bon, vert si meilleur. Aucun seuil. */
const Delta: React.FC<{ value: number | null; higherIsWorse: boolean }> = ({ value, higherIsWorse }) => {
  if (value === null) return <Text style={[styles.td, styles.tdMuted]}>—</Text>;
  const worse = value !== 0 && value > 0 === higherIsWorse;
  return (
    <View style={[styles.delta, value === 0 ? styles.deltaSame : worse ? styles.deltaWorse : styles.deltaBetter]}>
      <Text style={[styles.deltaText, value === 0 ? null : worse ? styles.deltaTextWorse : styles.deltaTextBetter]}>
        {value > 0 ? `+${value}` : value}
      </Text>
    </View>
  );
};

/**
 * Tableau des scores : actuel, baseline et écart ; avec `previousLabel` (« H+5 »), aussi l'examen
 * précédent du même choc et l'évolution depuis cet examen.
 */
export const Scat6CompareTable: React.FC<{ rows: CompareRow[]; withBaseline: boolean; previousLabel?: string | null }> = ({
  rows,
  withBaseline,
  previousLabel,
}) => (
  <View style={styles.table}>
    <View style={[styles.tr, styles.thead]}>
      <Text style={[styles.th, styles.cLabel]}>Domaine</Text>
      <Text style={[styles.th, styles.cNum]}>Actuel</Text>
      {previousLabel ? (
        <>
          <Text style={[styles.th, styles.cNum]}>Précédent ({previousLabel})</Text>
          <Text style={[styles.th, styles.cNum]}>Évolution</Text>
        </>
      ) : null}
      {withBaseline && (
        <>
          <Text style={[styles.th, styles.cNum]}>Baseline</Text>
          <Text style={[styles.th, styles.cNum]}>Écart</Text>
        </>
      )}
    </View>
    {rows.map((r, i) => {
      const total = r.key === 'cognitive_total';
      return (
        <View key={r.key} style={[styles.tr, i % 2 === 1 && styles.trAlt, total && styles.trTotal]}>
          <Text style={[styles.td, styles.cLabel, total && styles.tdStrong]}>{r.label}</Text>
          <Text style={[styles.td, styles.cNum, styles.tdStrong, r.current === null && styles.tdMuted]}>
            {r.current === null ? 'non réalisé' : formatScore(r.current, r.max, r.unit)}
          </Text>
          {previousLabel ? (
            <>
              <Text style={[styles.td, styles.cNum, r.previous === null && styles.tdMuted]}>
                {formatScore(r.previous, undefined, r.unit)}
              </Text>
              <View style={[styles.cNum, styles.deltaCell]}>
                <Delta value={r.prevDelta} higherIsWorse={r.higherIsWorse} />
              </View>
            </>
          ) : null}
          {withBaseline && (
            <>
              <Text style={[styles.td, styles.cNum, r.baseline === null && styles.tdMuted]}>
                {formatScore(r.baseline, undefined, r.unit)}
              </Text>
              <View style={[styles.cNum, styles.deltaCell]}>
                <Delta value={r.delta} higherIsWorse={r.higherIsWorse} />
              </View>
            </>
          )}
        </View>
      );
    })}
  </View>
);

/* ===================== CONSIGNES ===================== */

/** Après une commotion diagnostiquée ou différée : consignes au patient et règles de reprise du sport. */
export const Scat6Consignes: React.FC<{ sport: string; age: number | null; deferred?: boolean }> = ({ sport, age, deferred }) => (
  <View style={styles.consignes}>
    <View style={[styles.block, styles.blockNeutral]}>
      <Text style={styles.blockTitle}>Les 48 prochaines heures</Text>
      {CONSIGNES.surveillance.map((line) => (
        <Line key={line} text={line} />
      ))}
    </View>
    <View style={[styles.block, styles.blockWarning]}>
      <Text style={[styles.blockTitle, { color: '#6B4300' }]}>Interdit sans avis médical</Text>
      {CONSIGNES.interdits.map((line) => (
        <Line key={line} text={line} icon="close-circle" color={SCAT.warning} />
      ))}
    </View>
    <View style={[styles.block, styles.blockDanger]}>
      <Text style={[styles.blockTitle, { color: SCAT.dangerDark }]}>Appeler le 15 / 112 si</Text>
      {CONSIGNES.appelerSi.map((line) => (
        <Line key={line} text={line} icon="alert-circle" color={SCAT.danger} />
      ))}
    </View>
    <View style={[styles.block, styles.blockInfo]}>
      <Text style={styles.blockTitle}>Reprise — {sportLabel(sport)}</Text>
      {returnLines(sport, age).map((line) => (
        <Line key={line} text={line} icon="arrow-forward-circle" color={SCAT.blue} />
      ))}
      {deferred && <Line text="En cas de doute : re-tester le lendemain ou avant 72 h." icon="time" color={SCAT.blue} />}
    </View>
  </View>
);

const Line: React.FC<{ text: string; icon?: keyof typeof Ionicons.glyphMap; color?: string }> = ({
  text,
  icon = 'ellipse',
  color = SCAT.muted,
}) => (
  <View style={styles.line}>
    <Ionicons name={icon} size={icon === 'ellipse' ? 7 : 16} color={color} style={icon === 'ellipse' ? styles.dot : styles.lineIcon} />
    <Text style={styles.lineText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  /* ---- Tableau ---- */
  table: {
    borderWidth: 1,
    borderColor: SCAT.line,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: SCAT.card,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
    paddingVertical: 9,
    gap: Spacings.sm,
  },
  thead: {
    backgroundColor: SCAT.blueSoft,
    borderBottomWidth: 1,
    borderBottomColor: SCAT.blueLine,
  },
  trAlt: {
    backgroundColor: '#F8FAFD',
  },
  trTotal: {
    backgroundColor: SCAT.blueSoft,
  },
  th: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: SCAT.blueDark,
  },
  td: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  tdStrong: {
    fontFamily: FONTS.medium,
  },
  tdMuted: {
    color: SCAT.faint,
    fontFamily: FONTS.regular,
    fontSize: 13,
  },
  cLabel: {
    flex: 2.2,
  },
  cNum: {
    flex: 1,
    textAlign: 'right',
  },
  deltaCell: {
    alignItems: 'flex-end',
  },
  delta: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
  },
  deltaSame: {
    backgroundColor: '#EEF1F5',
  },
  deltaWorse: {
    backgroundColor: SCAT.warningSoft,
  },
  deltaBetter: {
    backgroundColor: SCAT.successSoft,
  },
  deltaText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.muted,
  },
  deltaTextWorse: {
    color: SCAT.warning,
  },
  deltaTextBetter: {
    color: SCAT.success,
  },

  /* ---- Consignes ---- */
  consignes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  block: {
    flexGrow: 1,
    flexBasis: 320,
    borderRadius: 14,
    padding: Spacings.md,
    gap: 6,
    borderWidth: 1,
  },
  blockNeutral: {
    backgroundColor: SCAT.card,
    borderColor: SCAT.line,
  },
  blockWarning: {
    backgroundColor: SCAT.warningSoft,
    borderColor: SCAT.warningLine,
  },
  blockDanger: {
    backgroundColor: SCAT.dangerSoft,
    borderColor: '#F4B4B2',
  },
  blockInfo: {
    backgroundColor: SCAT.blueSoft,
    borderColor: SCAT.blueLine,
  },
  blockTitle: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: SCAT.blueInk,
    marginBottom: 2,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    marginTop: 7,
  },
  lineIcon: {
    marginTop: 2,
  },
  lineText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: SCAT.text,
  },
});
