import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../constants/Spacings';
import { DISCLAIMER } from '../../../scat6/core/content';
import { Scat6Card, Scat6Header, Scat6Notice, Scat6SectionTitle } from './components/Scat6UI';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE } from './scat6Theme';
import { Scat6ScrollView } from './components/Scat6ScrollView';

type IconName = keyof typeof Ionicons.glyphMap;

const MATERIAL: { icon: IconName; text: string }[] = [
  { icon: 'home-outline', text: 'Une pièce calme, patient au repos, 10 à 15 minutes.' },
  { icon: 'resize-outline', text: 'Ruban adhésif au sol : ligne de 3 m (marche sur une ligne).' },
  { icon: 'square-outline', text: 'Mousse ≈ 50 × 40 × 6 cm (facultative, mBESS sur mousse).' },
  { icon: 'stopwatch-outline', text: 'Chronomètre et signaux sonores intégrés : activez le son de l’ordinateur.' },
];

const STEPS: { n: string; title: string; text: string }[] = [
  { n: '1', title: 'Renseignements', text: 'Antécédents : blessures à la tête, migraines, troubles de l’apprentissage, TDA/H, troubles psychologiques, antécédents neurologiques.' },
  { n: '2', title: 'Symptômes', text: '22 symptômes notés de 0 à 6 (/22 · /132). Baseline : « habituellement » ; après un choc : « maintenant ».' },
  { n: '3', title: 'Cognitif', text: 'Orientation /5, mémoire immédiate /30 (3 essais toujours), concentration /5 (chiffres et mois à l’envers).' },
  { n: '4', title: 'Équilibre', text: 'mBESS : 3 positions × 20 s, yeux fermés (/30 erreurs) ; marche sur une ligne si l’équilibre est normal.' },
  { n: '5', title: 'Mémoire différée', text: 'Au moins 5 minutes après la fin de la mémoire immédiate (/10) : l’équilibre occupe ce délai.' },
  { n: '6', title: 'Décision', text: 'Comparaison avec la baseline, examen neurologique, diagnostic Oui / Non / Différé, signature.' },
];

const RULES: { icon: IconName; text: string }[] = [
  { icon: 'person-outline', text: 'À partir de 13 ans. Avant : Child SCAT6 (non disponible dans l’application).' },
  { icon: 'calendar-outline', text: 'Sensibilité maximale dans les 72 h ; au-delà de 7 jours, préférer le SCOAT6.' },
  { icon: 'remove-circle-outline', text: 'Une partie non réalisée est notée comme telle, avec sa raison : jamais comptée 0.' },
  { icon: 'git-compare-outline', text: 'Aucun seuil automatique : les scores se lisent à côté de la baseline du patient.' },
  { icon: 'list-outline', text: 'Listes de mots A, B, C équivalentes ; l’application propose une liste différente de la précédente.' },
  { icon: 'shield-checkmark-outline', text: 'L’application ne dit jamais « apte » : la reprise relève du seul médecin.' },
];

/** Aide-mémoire du protocole SCAT6 (web) : matériel, déroulé, règles appliquées par l'outil. */
export const Scat6GuideView = () => (
  <View style={styles.page}>
    <Scat6Header title="Protocole SCAT6" subtitle="Sport Concussion Assessment Tool, 6e édition (CISG 2023)" />
    <Scat6ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.column}>
        <View style={styles.grid}>
          <Scat6Card style={styles.cell}>
            <Scat6SectionTitle title="Avant de commencer" />
            {MATERIAL.map((m) => (
              <Bullet key={m.text} icon={m.icon} text={m.text} />
            ))}
          </Scat6Card>
          <Scat6Card style={styles.cell}>
            <Scat6SectionTitle title="Règles appliquées" />
            {RULES.map((r) => (
              <Bullet key={r.text} icon={r.icon} text={r.text} />
            ))}
          </Scat6Card>
        </View>

        <Scat6Card>
          <Scat6SectionTitle title="Déroulé de l’examen" />
          <View style={styles.steps}>
            {STEPS.map((s) => (
              <View key={s.n} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.n}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.text}>{s.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </Scat6Card>

        <Scat6Notice>{DISCLAIMER}</Scat6Notice>
        <Text style={styles.copyright}>SCAT6 © Concussion in Sport Group 2023 · version française.</Text>
      </View>
    </Scat6ScrollView>
  </View>
);

const Bullet: React.FC<{ icon: IconName; text: string }> = ({ icon, text }) => (
  <View style={styles.bullet}>
    <View style={styles.bulletIcon}>
      <Ionicons name={icon} size={18} color={SCAT.blueDark} />
    </View>
    <Text style={[styles.text, styles.flex]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
  scroll: {
    padding: Spacings.lg,
    paddingBottom: TAB_BAR_SPACE + Spacings.lg,
  },
  column: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    gap: Spacings.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
    alignItems: 'stretch',
  },
  cell: {
    flexGrow: 1,
    flexBasis: 420,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  bulletIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: SCAT.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 21,
    color: SCAT.text,
  },
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  step: {
    flexGrow: 1,
    flexBasis: 300,
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SCAT.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: SCAT.card,
  },
  stepTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: SCAT.blueInk,
  },
  copyright: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.faint,
    textAlign: 'center',
  },
});
