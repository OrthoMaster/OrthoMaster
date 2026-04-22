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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const COLOR_BLUE = '#0D253E';
const COLOR_GREEN = '#97D253';


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
    expandable: true,
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
    expandable: true,
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

export function DiplomaModalContent({ onPreReg, onClose }: { onPreReg: () => void, onClose: () => void }) {
  return (
    <View style={styles.addPkgInfoModalOverlay}>
      <View style={styles.addPkgInfoModalContent}>
        {/* Header */}
        <View style={styles.addPkgInfoHeader}>
          <View style={styles.addPreRegTitleWrapper}>
            <Text style={styles.addPreRegTitle}>DIPLÔME</Text>
            <Text style={styles.addPreRegTitle}>CONSEILLER EXPERT</Text>
            <Text style={styles.addPreRegTitle2}>EN ORTHOPÉDIE</Text>
            <Text style={styles.addPreRegSubTitle}>Le moteur de transformation de{'\n'}
              votre officine en pôle mobilité{'\n'}
              par un référent interne</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addPkgInfoCloseButton}
          >
            <Ionicons name="close" size={30} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
          contentContainerStyle={{ padding: Spacings.md }}
          showsVerticalScrollIndicator={false}>
          <View>
            <View style={acc.bulletRow2}>
              <Image
                style={acc.dotImage}
                resizeMode="contain"
                source={require('../../../../assets/v2_images/icon/icon-prereg-diploma-1.png')}
              />
              <Text style={acc.bulletText}>58 jours de formation complète et professionnalisante</Text>
            </View>
            <View style={acc.bulletRow2}>
              <Image
                style={acc.dotImage}
                resizeMode="contain"
                source={require('../../../../assets/v2_images/icon/icon-prereg-diploma-2.png')}
              />
              <Text style={acc.bulletText}>Expertise clinique, technique et commerciale</Text>
            </View>
            <View style={acc.bulletRow2}>
              <Image
                style={acc.dotImage}
                resizeMode="contain"
                source={require('../../../../assets/v2_images/icon/icon-prereg-diploma-3.png')}
              />
              <Text style={acc.bulletText}>Pilotage de l'activité, stratégie et développement</Text>
            </View>
            <View style={acc.bulletRow2}>
              <Image
                style={acc.dotImage}
                resizeMode="contain"
                source={require('../../../../assets/v2_images/icon/icon-prereg-diploma-4.png')}
              />
              <Text style={acc.bulletText}>Certification reconnue et valorisante</Text>
            </View>

            {/* Accordion sections */}
            {SECTIONS.map((s) => (
              <AccordionItem key={s.id} section={s} />
            ))}

            {/* CTA */}
            <TouchableOpacity style={styles.cta} onPress={onPreReg} activeOpacity={0.8}>
              <Text style={styles.ctaText}>En savoir plus sur le diplôme</Text>
            </TouchableOpacity>
            <Text style={styles.sub}>Sans engagement · Réponse sous 48h</Text>
          </View>
        </ScrollView>
      </View>
    </View>
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
  bulletRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginBottom: Spacings.xs
  },
  bulletText: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '500',
    lineHeight: 14,
    color: Colors.text
  },
  dotImage: {
    width: 20,
    height: 20,
    borderRadius: 15,
    backgroundColor: COLOR_BLUE,
    padding: 2
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
    backgroundColor: Colors.lgreenDark,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 16,
    marginHorizontal: 4,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium'
  },
  sub: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
    marginBottom: Spacings.sm,
  },

  // Add Package Info Modal Styles
  addPkgInfoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  addPkgInfoModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addPkgInfoHeader: {
    flexDirection: 'row',
    paddingLeft: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: COLOR_BLUE,
    borderTopEndRadius: 16,
    borderTopStartRadius: 16,
  },
  addPkgInfoCloseButton: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.xs
  },
  addPreRegTitleWrapper: {
    flex: 1
  },
  addPreRegSubTitle: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
    marginTop: Spacings.xs,
    marginBottom: Spacings.sm,
  },
  addPreRegTitle: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    marginBottom: -5
  },
  addPreRegTitle2: {
    fontSize: 24,
    color: COLOR_GREEN,
    fontFamily: 'Poppins-Bold',
  },
});