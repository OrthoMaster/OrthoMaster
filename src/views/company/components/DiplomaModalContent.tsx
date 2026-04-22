// DiplomaModalContent.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Data ────────────────────────────────────────────────────────────────────

type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'bullet'; items: string[] }
  | { type: 'module'; items: { label: string; description: string }[] }
  | { type: 'quote'; value: string }
  | { type: 'link'; label: string; url: string };

interface Section {
  id: string;
  title: string;
  expandable?: boolean; // default true — false = always visible, no toggle
  content: ContentBlock[];
}

const SECTIONS: Section[] = [
  {
    id: 'access',
    title: "CONDITIONS D'ACCÈS",
    expandable: true,
    content: [
      {
        type: 'bullet',
        items: [
          'Accessible à tous (pharmacien, préparateur) sans prérequis',
          "Programme 100% opérationnel et adapté à l'orthopédie officinale actuelle.",
          'Chaque semaine une nouvelle compétence à appliquer directement à votre activité',
        ],
      },
    ],
  },
  {
    id: 'format',
    title: 'FORMAT',
    expandable: true,
    content: [
      {
        type: 'bullet',
        items: [
          'Enseignement de 406 heures réparties sur 58 jours',
          'Hybride : 26% présentiel · 41% classe virtuelle · 28% e-learning · 5% autonomie',
          '74% du temps sur lieu de travail',
          'Épreuves écrite et orale sur une journée',
          'Session : min 12 / max 20 inscrits',
        ],
      },
    ],
  },
  {
    id: 'finance',
    title: 'CONDITIONS FINANCIÈRES',
    expandable: true,
    content: [
      { type: 'text', value: 'Formation 100% financée et compatible avec le CDI Alternant * :' },
      {
        type: 'bullet',
        items: [
          "Côté pharmacie : Réduction de charges + aides de l'état",
          "Côté apprenant : Conserve son CDI, statut étudiant pendant la formation (exemption d'impôts n+1, réduction des prélèvements sociaux)",
        ],
      },
      { type: 'quote', value: '* : attention les conditions peuvent évoluer' },
    ],
  },
  {
    id: 'programme',
    title: 'PROGRAMME',
    expandable: true,
    content: [
      { type: 'text', value: '8 phases clés pour transformer votre officine en pôle mobilité en 58 jours' },
      {
        type: 'module',
        items: [
          { label: 'Module 1', description: "Poser les fondations — Comprendre son environnement et structurer sa stratégie" },
          { label: 'Module 2', description: 'Prise en charge personnalisée — Analyser les besoins et adapter son conseil' },
          { label: 'Module 3', description: 'Expertise clinique — Comprendre les pathologies et construire une réponse adaptée' },
          { label: 'Module 4', description: "Espace orthopédique — Structurer l'offre pour améliorer le parcours patient" },
          { label: 'Module 5', description: 'Pilotage — Suivre, analyser et améliorer la qualité et la performance' },
          { label: 'Module 6', description: 'Réseau de soins — Collaborer avec les prescripteurs et renforcer son rôle' },
          { label: 'Module 7', description: 'Excellence — Optimiser le suivi patient, la prévention et la qualité' },
          { label: 'Module 8', description: 'Validation — Formaliser et projeter le développement de son activité' },
        ],
      },
      { type: 'link', label: 'Voir le programme complet →', url: 'https://drive.google.com/file/d/1VfQVNzuBWlYms0WR9grFmaChjzv7hnFo/view?usp=sharing' },
    ],
  },
  {
    id: 'promise',
    title: 'NOTRE PROMESSE',
    expandable: true,
    content: [
      {
        type: 'text',
        value: "Acquisition de compétences en rapport avec un projet professionnel d'évolution sur poste ou réorientation.",
      },
      {
        type: 'quote',
        value: "« À la fin de la formation, vous n'avez pas seulement appris… vous avez transformé votre officine. »",
      },
    ],
  },
  {
    id: 'date',
    title: 'DATE ET LIEU',
    expandable: false,
    content: [
      {
        type: 'text',
        value: 'Préinscrivez-vous et nous vous contacterons pour vous communiquer nos prochaines sessions.',
      },
    ],
  },
  {
    id: 'inscription',
    title: 'CANDIDATURE ET INSCRIPTION',
    expandable: false,
    content: [
      {
        type: 'text',
        value: 'Cliquez sur le lien ci-dessous et nous reviendrons vers vous pour répondre à vos questions et avancer dans les démarches.',
      },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({ section }: { section: Section }) {
  const isExpandable = section.expandable !== false;
  const [open, setOpen] = useState(!isExpandable);
  const animation = useRef(new Animated.Value(!isExpandable ? 1 : 0)).current;

  const toggle = () => {
    if (!isExpandable) return;
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  const rotate = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={acc.wrapper}>
      {/* Header row */}
      <TouchableOpacity
        style={acc.header}
        onPress={toggle}
        activeOpacity={isExpandable ? 0.7 : 1}
        disabled={!isExpandable}
      >
        <Text style={acc.title}>{section.title}</Text>
        {isExpandable && (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={16} color={Colors.success} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Body */}
      {open && (
        <View style={acc.body}>
          {section.content.map((block, i) => {
            if (block.type === 'text') {
              return <Text key={i} style={acc.bodyText}>{block.value}</Text>;
            }
            if (block.type === 'quote') {
              return (
                <View key={i} style={acc.quoteBox}>
                  <Text style={acc.quoteText}>{block.value}</Text>
                </View>
              );
            }
            if (block.type === 'bullet') {
              return (
                <View key={i}>
                  {block.items.map((item, j) => (
                    <View key={j} style={acc.bulletRow}>
                      <View style={acc.dot} />
                      <Text style={acc.bodyText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            if (block.type === 'module') {
              return (
                <View key={i}>
                  {block.items.map((m, j) => (
                    <View key={j} style={acc.moduleRow}>
                      <Text style={acc.moduleLabel}>{m.label}</Text>
                      <Text style={acc.moduleDesc}>{m.description}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            if (block.type === 'link') {
              return (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(block.url)}>
                  <Text style={acc.link}>{block.label}</Text>
                </TouchableOpacity>
              );
            }
            return null;
          })}
        </View>
      )}
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DiplomaModalContent({ onPreReg }: { onPreReg: () => void }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
    >
      {/* Highlight quote */}
      <View style={[styles.note, { backgroundColor: Colors.blue3 }]}>
        <Text style={[styles.noteText, { color: Colors.blueDark }]}>
          « Ce diplôme n'est pas une formation classique, c'est une méthode pour transformer
          votre activité orthopédie en vrai pôle mobilité rentable,
          avec des actions concrètes chaque semaine. »
        </Text>
      </View>

      {/* Accordion sections */}
      {SECTIONS.map((s) => (
        <AccordionItem key={s.id} section={s} />
      ))}

      {/* CTA */}
      <TouchableOpacity style={styles.cta} onPress={onPreReg} activeOpacity={0.8}>
        <Text style={styles.ctaText}>PRÉ-INSCRIPTION</Text>
        <Ionicons name="paper-plane" size={18} color={Colors.white} />
      </TouchableOpacity>
      <Text style={styles.sub}>Sans engagement · Réponse sous 48h</Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const acc = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacings.xxxs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 12,
    color: Colors.subtext2,
    flex: 1,
    fontFamily: 'Poppins-Bold',
    lineHeight: 18,
    letterSpacing: 0.8,
  },
  body: {
    paddingBottom: Spacings.md,
    paddingHorizontal: Spacings.xs,
    gap: Spacings.xxs,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Poppins-Regular',
    flex: 1,
    marginBottom: Spacings.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginTop: 7,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacings.sm,
    alignItems: 'flex-start',
  },
  moduleLabel: {
    fontSize: 12,
    color: Colors.success,
    minWidth: 60,
    fontFamily: 'Poppins-Bold',
  },
  moduleDesc: {
    fontSize: 14,
    lineHeight: 17,
    color: Colors.subtext2,
    flex: 1,
    fontFamily: 'Poppins-Regular'
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    paddingLeft: Spacings.sm,
    marginVertical: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.gray,
    fontFamily: 'Poppins-Regular'
  },
  link: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  note: {
    borderRadius: 8,
    padding: Spacings.md,
    marginBottom: Spacings.md,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.7,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 16,
    marginHorizontal: 4,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 15,
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Bold'
  },
  sub: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
    marginBottom: Spacings.sm,
  },
});