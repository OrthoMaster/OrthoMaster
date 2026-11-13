/**
 * Accueil de l'onglet Outils (mobile et web), présenté comme l'onglet Formations :
 * en-tête de couleur, fond sombre, cartes 3D avec l'icône qui dépasse au-dessus.
 *  - Supports pédagogiques → menu des supports (tools-content)
 *  - Que Choisir ?          → menu de démarrage (tools-que-choisir)
 *  - Guide patient          → menu des guides
 *  - Assistance IA          → web uniquement, abonnés (chatbot-view)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu } from './components/LearningSupport/LearningSupport';
import { EntryCard, WEB_CARD_MAX_WIDTH, WEB_TWO_UP_CARD_MIN } from '../training/FormationsHomeView';

import { me } from '../../services/v2/AuthService';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const IS_WEB = Platform.OS === 'web';
const isTablet = !IS_WEB && Dimensions.get('window').width >= 768;
const HEADER_COLOR = Colors.blue;

/* ---- Couleurs des cartes : celles des anciens boutons, avec une tranche plus foncée ---- */
const CARD_COLORS = {
  learning: { face: '#5AC4F6', edge: '#35A5DA' },
  queChoisir: { face: '#33C0B7', edge: '#249A92' },
  guidePatient: { face: '#FBB200', edge: '#D69500' },
  chatbot: { face: Colors.purple, edge: '#6F528F' },
};

// Icônes plates : elles dépassent moins que les illustrations 3D de Formations.
const POP_RATIO = 0.3;

export const ToolsView = ({ navigation }) => {
  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false);
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false);
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false);

  // Comme Formations : barre d'état claire sur l'en-tête, rétablie à chaque retour sur l'onglet.
  useFocusEffect(
    useCallback(() => {
      if (!IS_WEB) {
        StatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') StatusBar.setBackgroundColor(HEADER_COLOR, true);
      }
    }, [])
  );

  /* ---- Web : Assistance IA réservée aux abonnés ---- */
  const [hasSubscription, setHasSubscription] = useState(false);
  useEffect(() => {
    if (!IS_WEB) return;
    me().then((user) => setHasSubscription(!!user?.has_subscription)).catch(() => setHasSubscription(false));
  }, []);

  /* ---- Web : deux cartes par ligne quand elles tiennent, comme Formations ---- */
  const [bodyWidth, setBodyWidth] = useState(0);
  const usable = bodyWidth - Spacings.lg * 2;
  const twoUp = IS_WEB && usable >= WEB_TWO_UP_CARD_MIN * 2 + Spacings.lg;
  const cardStyle = !IS_WEB
    ? null
    : twoUp
      ? { width: Math.min(WEB_CARD_MAX_WIDTH, Math.floor((usable - Spacings.lg) / 2)) }
      : styles.cardWeb;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_COLOR} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outils</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, twoUp && styles.contentTwoUp]}
        onLayout={(e) => setBodyWidth(e.nativeEvent.layout.width)}
        showsVerticalScrollIndicator={false}
      >
        <EntryCard
          title="Supports pédagogiques"
          description="Des images pour expliquer la zone douloureuse au patient."
          illustration={require('../../../assets/tools/learning-support/access-icon.png')}
          face={CARD_COLORS.learning.face}
          edge={CARD_COLORS.learning.edge}
          layout="row-reverse"
          motion="float"
          popRatio={POP_RATIO}
          titleLines={2}
          onPress={() => setShowLearningSupportMenu(true)}
          style={cardStyle}
        />
        <EntryCard
          title="Que Choisir ?"
          description="Le bon dispositif orthopédique selon la pathologie."
          illustration={require('../../../assets/tools/que-choisir/access-icon.png')}
          face={CARD_COLORS.queChoisir.face}
          edge={CARD_COLORS.queChoisir.edge}
          layout="row"
          motion="sway"
          popRatio={POP_RATIO}
          onPress={() => setShowQueChoisirMenu(true)}
          style={cardStyle}
        />
        <EntryCard
          title="Guide patient"
          description="Des QR codes pour apprendre à utiliser les dispositifs."
          illustration={require('../../../assets/tools/guide-patient/access-icon.png')}
          face={CARD_COLORS.guidePatient.face}
          edge={CARD_COLORS.guidePatient.edge}
          layout="row-reverse"
          motion="breathe"
          popRatio={POP_RATIO}
          onPress={() => setShowGuidePatientMenu(true)}
          style={cardStyle}
        />
        {IS_WEB && hasSubscription && (
          <EntryCard
            title="Assistance IA"
            description="Posez vos questions à l'assistant OrthoMaster."
            illustration={require('../../../assets/tools/guide-patient/access-icon.png')}
            face={CARD_COLORS.chatbot.face}
            edge={CARD_COLORS.chatbot.edge}
            layout="row"
            motion="float"
            popRatio={POP_RATIO}
            onPress={() => navigation.navigate('chatbot-view')}
            style={cardStyle}
          />
        )}
      </ScrollView>

      <Modal style={IS_WEB && styles.modalWeb} isVisible={showQueChoisirMenu}>
        <QueChoisirMenu
          onClose={() => setShowQueChoisirMenu(false)}
          onStart={(category, filtersConfig) => {
            setShowQueChoisirMenu(false);
            navigation.navigate('tools-que-choisir', { category, filtersConfig });
          }}
        />
      </Modal>

      <Modal style={IS_WEB && styles.modalWeb} isVisible={showGuidePatientMenu}>
        <GuidePatientMenu onClose={() => setShowGuidePatientMenu(false)} />
      </Modal>

      <Modal style={IS_WEB && styles.modalWeb} isVisible={showLearningSupportMenu}>
        <LearningSupportMenu
          onClose={() => setShowLearningSupportMenu(false)}
          onStart={(content) => {
            setShowLearningSupportMenu(false);
            navigation.navigate('tools-content', IS_WEB ? { content, type: 'tool' } : { content });
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Écran ---- */
  container: {
    flex: 1,
    backgroundColor: HEADER_COLOR,
  },
  header: {
    height: IS_WEB || isTablet ? 100 : 60,
    backgroundColor: HEADER_COLOR,
    justifyContent: 'center',
    paddingHorizontal: Spacings.lg,
  },
  headerTitle: {
    fontSize: IS_WEB ? 28 : 20,
    fontFamily: IS_WEB ? 'Poppins-Bold' : 'Poppins-Medium',
    color: Colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  content: {
    padding: Spacings.lg,
    gap: Spacings.lg,
  },
  contentTwoUp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  /* ---- Cartes ---- */
  cardWeb: {
    width: '100%',
    maxWidth: WEB_CARD_MAX_WIDTH,
    alignSelf: 'center',
  },

  /* ---- Menus ---- */
  modalWeb: {
    width: 700,
    alignSelf: 'center',
  },
});
