import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import Spacings from '../../../../../constants/Spacings';
import { formatInjury, injuriesWithExams, sinceInjuryLabel } from '../../../../scat6/core/injury';
import { COMPARE_DOMAINS, formatScore } from '../../../../scat6/core/scoring';
import type { Scat6Summary } from '../../../../scat6/core/types';
import type { Scat6AssessmentRow } from '../../../../services/v2/Scat6Service';
import { SCAT, FONTS } from '../scat6Theme';
import { Scat6Choice, Scat6SectionTitle } from './Scat6UI';

/** Domaines suivis dans les graphiques (un graphique par domaine : jamais deux échelles). */
const DOMAINS: (keyof Scat6Summary)[] = ['symptom_count', 'symptom_severity', 'cognitive_total', 'mbess'];

const CHART_H = 120;
const PAD = { top: 16, right: 20, bottom: 22, left: 30 };

interface Point {
  label: string;
  value: number | null;
}

/**
 * Évolution des scores pour un choc : un petit graphique par domaine (symptômes, sévérité, cognitif,
 * mBESS), un point par examen signé (H+5, H+12, J+2…), la baseline en pointillés. Aucun seuil :
 * le graphique montre seulement les valeurs. Les chiffres détaillés restent dans l'historique.
 */
export const Scat6Evolution: React.FC<{ assessments: Scat6AssessmentRow[] }> = ({ assessments }) => {
  const injuries = useMemo(() => injuriesWithExams(assessments), [assessments]);
  const [selected, setSelected] = useState<string | null>(null);
  const group = injuries.find((g) => g.injuryAt === selected) ?? injuries[0];
  if (!group) return null;

  // Baseline signée la plus récente avant le choc.
  const baseline =
    assessments
      .filter(
        (a) =>
          a.exam_kind === 'baseline' &&
          a.status === 'completed' &&
          new Date(a.completed_at ?? 0).getTime() <= new Date(group.injuryAt).getTime() + 86_400_000
      )
      .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())[0] ?? null;

  return (
    <View style={styles.wrap}>
      <Scat6SectionTitle
        title="Évolution"
        hint={`Choc du ${formatInjury(group.injuryAt)} · ${group.exams.length} examen${group.exams.length > 1 ? 's' : ''} signé${
          group.exams.length > 1 ? 's' : ''
        }${baseline ? ' · pointillés : baseline' : ''}`}
      />
      {injuries.length > 1 && (
        <View style={styles.row}>
          {injuries.map((g) => (
            <Scat6Choice
              key={g.injuryAt}
              icon="flash-outline"
              label={`Choc du ${formatInjury(g.injuryAt)}`}
              selected={g.injuryAt === group.injuryAt}
              onPress={() => setSelected(g.injuryAt)}
            />
          ))}
        </View>
      )}
      <View style={styles.grid}>
        {DOMAINS.map((key) => {
          const domain = COMPARE_DOMAINS.find((d) => d.key === key)!;
          const points: Point[] = group.exams.map((e) => ({
            label: sinceInjuryLabel(e.injury_at!, e.started_at ?? e.completed_at ?? Date.now()),
            value: e.summary ? e.summary[key] : null,
          }));
          return (
            <MiniChart
              key={key}
              title={domain.label}
              max={domain.max ?? 1}
              higherIsWorse={domain.higherIsWorse}
              points={points}
              baseline={baseline?.summary ? baseline.summary[key] : null}
            />
          );
        })}
      </View>
    </View>
  );
};

const MiniChart: React.FC<{
  title: string;
  max: number;
  higherIsWorse: boolean;
  points: Point[];
  baseline: number | null;
}> = ({ title, max, higherIsWorse, points, baseline }) => {
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const known = points.map((p, i) => ({ ...p, i })).filter((p): p is Point & { i: number; value: number } => p.value !== null);
  const first = known[0];
  const last = known[known.length - 1];

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - (Math.min(v, max) / max) * plotH;

  // Trait continu entre les examens réalisés (un examen « non réalisé » n'est pas relié à zéro).
  const path = known.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i)},${y(p.value)}`).join(' ');
  const shown = hover ?? last?.i ?? null;
  // Zone de survol : la moitié de l'écart entre deux points, 28 px au plus.
  const half = Math.min(28, (points.length > 1 ? plotW / (points.length - 1) : plotW) / 2);

  return (
    <View style={styles.chart}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSub}>
        {first && last && first.i !== last.i
          ? `${formatScore(first.value)} → ${formatScore(last.value)} (${first.label} → ${last.label})`
          : last
            ? `${formatScore(last.value)} (${last.label})`
            : 'non réalisé'}
        {` · ${higherIsWorse ? 'plus bas' : 'plus haut'} = mieux`}
      </Text>
      <View onLayout={onLayout} style={{ height: CHART_H }}>
        {width > 0 && (
          <Svg width={width} height={CHART_H}>
            {/* Axe : 0 et maximum seulement, discrets. */}
            <Line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke={SCAT.line} strokeWidth={1} />
            <Line x1={PAD.left} x2={width - PAD.right} y1={y(max)} y2={y(max)} stroke={SCAT.line} strokeWidth={1} strokeDasharray="2 4" />
            <SvgText x={PAD.left - 6} y={y(0) + 4} fontSize={11} fill={SCAT.muted} textAnchor="end" fontFamily="Roboto">
              0
            </SvgText>
            <SvgText x={PAD.left - 6} y={y(max) + 4} fontSize={11} fill={SCAT.muted} textAnchor="end" fontFamily="Roboto">
              {max}
            </SvgText>
            {baseline !== null && (
              <Line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(baseline)}
                y2={y(baseline)}
                stroke={SCAT.muted}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            )}
            {known.length > 1 && <Path d={path} stroke={SCAT.blue} strokeWidth={2} fill="none" strokeLinejoin="round" />}
            {known.map((p) => (
              <Circle
                key={p.i}
                cx={x(p.i)}
                cy={y(p.value)}
                r={p.i === shown ? 6 : 4.5}
                fill={SCAT.blue}
                stroke={SCAT.card}
                strokeWidth={2}
              />
            ))}
            {/* Valeur du point survolé (sinon le dernier) : une seule étiquette. */}
            {shown !== null && points[shown]?.value !== null && (
              <SvgText
                x={x(shown)}
                y={y(points[shown].value!) - 10}
                fontSize={12}
                fontWeight="bold"
                fill={SCAT.text}
                textAnchor={shown === 0 && points.length > 1 ? 'start' : shown === points.length - 1 && points.length > 1 ? 'end' : 'middle'}
                fontFamily="Roboto"
              >
                {formatScore(points[shown].value)}
              </SvgText>
            )}
            {points.map((p, i) => (
              <SvgText
                key={i}
                x={x(i)}
                y={CHART_H - 6}
                fontSize={11}
                fill={i === shown ? SCAT.text : SCAT.muted}
                textAnchor={points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle'}
                fontFamily="Roboto"
              >
                {p.label}
              </SvgText>
            ))}
          </Svg>
        )}
        {/* Zones de survol, plus larges que les points. */}
        {width > 0 &&
          points.map((p, i) => (
            <Pressable
              key={i}
              {...({ onHoverIn: () => setHover(i), onHoverOut: () => setHover(null) } as any)}
              onPress={() => setHover(hover === i ? null : i)}
              accessibilityLabel={`${title}, ${p.label} : ${p.value === null ? 'non réalisé' : formatScore(p.value)}`}
              style={[
                styles.hit,
                { left: x(i) - half, width: 2 * half },
              ]}
            />
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacings.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  chart: {
    flexGrow: 1,
    flexBasis: 300,
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    padding: Spacings.md,
    gap: 2,
  },
  chartTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  chartSub: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  hit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
