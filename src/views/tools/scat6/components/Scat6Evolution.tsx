import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import Spacings from '../../../../../constants/Spacings';
import { episodeIndex, sinceInjuryLabel } from '../../../../scat6/core/injury';
import { COMPARE_DOMAINS, formatScore } from '../../../../scat6/core/scoring';
import type { Scat6Summary } from '../../../../scat6/core/types';
import type { Scat6AssessmentRow } from '../../../../services/v2/Scat6Service';
import { SCAT, FONTS } from '../scat6Theme';
import { Scat6SectionTitle } from './Scat6UI';

/** Domaines suivis dans les graphiques (un graphique par domaine : jamais deux échelles). */
const DOMAINS: (keyof Scat6Summary)[] = ['symptom_count', 'symptom_severity', 'cognitive_total', 'mbess'];
/** Au-delà, les étiquettes se chevauchent : on montre les derniers examens. */
const MAX_POINTS = 8;

const CHART_H = 140;
const PAD = { top: 22, right: 22, bottom: 34, left: 38 };

interface Point {
  /** 1re ligne sous le point : « H+5 », « Baseline »… */
  label: string;
  /** 2e ligne : date courte. */
  date: string;
  value: number | null;
  baseline: boolean;
  /** Relié au point précédent ? Non au début d'un nouveau choc (« Après un choc » qui ne suit pas un autre). */
  connect: boolean;
}

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '';

/**
 * Évolution des scores : tous les examens signés du patient (baselines comprises), du plus ancien au
 * plus récent, un petit graphique par domaine. Le trait relie les examens à la suite, sauf au début d'un
 * nouveau choc (« Après un choc » qui suit une baseline ou un re-test) : là, il s'interrompt.
 * Baseline = carré, examen après un choc / re-test = rond. Aucun seuil : seulement les valeurs.
 */
export const Scat6Evolution: React.FC<{ assessments: Scat6AssessmentRow[] }> = ({ assessments }) => {
  // 4 graphiques sur une ligne si la place le permet, sinon 2 × 2 (jamais 3 + 1).
  const [gridWidth, setGridWidth] = useState(0);
  const perRow = gridWidth >= 4 * 300 + 3 * Spacings.md ? 4 : gridWidth >= 2 * 250 + Spacings.md ? 2 : 1;
  const chartWidth = gridWidth ? (gridWidth - (perRow - 1) * Spacings.md) / perRow : undefined;

  const { exams, episodes, total } = useMemo(() => {
    const done = assessments
      .filter((a) => a.status === 'completed')
      .sort((a, b) => new Date(a.started_at ?? a.completed_at ?? 0).getTime() - new Date(b.started_at ?? b.completed_at ?? 0).getTime());
    return { exams: done.slice(-MAX_POINTS), episodes: episodeIndex(done), total: done.length };
  }, [assessments]);

  // Rien à suivre tant qu'il n'y a pas au moins deux examens signés.
  if (exams.length < 2) return null;

  const pointsFor = (key: keyof Scat6Summary): Point[] =>
    exams.map((e, i) => {
      const prev = exams[i - 1];
      const episode = episodes.get(e.uuid);
      const at = e.started_at ?? e.completed_at;
      return {
        label: e.exam_kind === 'baseline' ? 'Baseline' : episode?.injuryAt ? sinceInjuryLabel(episode.injuryAt, at ?? Date.now()) : '—',
        date: shortDate(at),
        value: e.summary ? e.summary[key] : null,
        baseline: e.exam_kind === 'baseline',
        connect: !!prev && !(e.exam_kind === 'post_choc' && prev.exam_kind !== 'post_choc'),
      };
    });

  return (
    <View style={styles.wrap}>
      <Scat6SectionTitle
        title="Évolution"
        hint={`${total > MAX_POINTS ? `${MAX_POINTS} derniers examens signés` : 'Examens signés'} · carré : baseline · le trait s’interrompt à chaque nouveau choc`}
      />
      <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {DOMAINS.map((key) => {
          const domain = COMPARE_DOMAINS.find((d) => d.key === key)!;
          return (
            <MiniChart
              key={key}
              width={chartWidth}
              title={domain.label}
              max={domain.max ?? 1}
              higherIsWorse={domain.higherIsWorse}
              points={pointsFor(key)}
            />
          );
        })}
      </View>
    </View>
  );
};

const MiniChart: React.FC<{
  width?: number;
  title: string;
  max: number;
  higherIsWorse: boolean;
  points: Point[];
}> = ({ width: cardWidth, title, max, higherIsWorse, points }) => {
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const known = points.map((p, i) => ({ ...p, i })).filter((p): p is Point & { i: number; value: number } => p.value !== null);
  const last = known[known.length - 1];

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - (Math.min(v, max) / max) * plotH;

  // Segments : relie deux examens réalisés consécutifs, sauf si un nouveau choc commence entre eux.
  let path = '';
  for (let k = 0; k < known.length; k++) {
    const p = known[k];
    const prev = known[k - 1];
    const linked = !!prev && points.slice(prev.i + 1, p.i + 1).every((q) => q.connect);
    path += `${linked ? 'L' : 'M'}${x(p.i)},${y(p.value)} `;
  }

  const shown = hover ?? last?.i ?? null;
  const half = Math.min(28, (points.length > 1 ? plotW / (points.length - 1) : plotW) / 2);
  const anchor = (i: number) => (points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle');

  return (
    <View style={[styles.chart, cardWidth ? { width: cardWidth, flexGrow: 0, flexBasis: 'auto' } : null]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSub}>
        {last ? `Dernier : ${formatScore(last.value)} (${last.label}, ${last.date})` : 'non réalisé'}
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
            {path && <Path d={path} stroke={SCAT.blue} strokeWidth={2} fill="none" strokeLinejoin="round" />}
            {known.map((p) => {
              const r = p.i === shown ? 6 : 4.5;
              return p.baseline ? (
                <Rect
                  key={p.i}
                  x={x(p.i) - r}
                  y={y(p.value) - r}
                  width={2 * r}
                  height={2 * r}
                  rx={1.5}
                  fill={SCAT.card}
                  stroke={SCAT.blueDark}
                  strokeWidth={2}
                />
              ) : (
                <Circle key={p.i} cx={x(p.i)} cy={y(p.value)} r={r} fill={SCAT.blue} stroke={SCAT.card} strokeWidth={2} />
              );
            })}
            {/* Valeur du point survolé (sinon le dernier) : une seule étiquette. */}
            {shown !== null && points[shown]?.value !== null && (
              <SvgText
                x={x(shown)}
                // Au-dessus du point ; sous le point s'il est en haut du graphique (pour ne pas sortir du cadre).
                y={y(points[shown].value!) - 10 < 13 ? y(points[shown].value!) + 19 : y(points[shown].value!) - 10}
                fontSize={12}
                fontWeight="bold"
                fill={SCAT.text}
                textAnchor={anchor(shown)}
                fontFamily="Roboto"
              >
                {formatScore(points[shown].value)}
              </SvgText>
            )}
            {points.map((p, i) => (
              <React.Fragment key={i}>
                <SvgText x={x(i)} y={CHART_H - 18} fontSize={11} fill={i === shown ? SCAT.text : SCAT.muted} textAnchor={anchor(i)} fontFamily="Roboto">
                  {p.label}
                </SvgText>
                <SvgText x={x(i)} y={CHART_H - 5} fontSize={10} fill={SCAT.faint} textAnchor={anchor(i)} fontFamily="Roboto">
                  {p.date}
                </SvgText>
              </React.Fragment>
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
              accessibilityLabel={`${title}, ${p.label} ${p.date} : ${p.value === null ? 'non réalisé' : formatScore(p.value)}`}
              style={[styles.hit, { left: x(i) - half, width: 2 * half }]}
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
