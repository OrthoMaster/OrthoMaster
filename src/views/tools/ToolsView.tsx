/**
 * Accueil de l'onglet Outils (mobile et web), dans le cadre de l'onglet Formations
 * (en-tête de couleur, fond sombre, cartes 3D à tranche) : icône au centre, titre dessous.
 *  - Supports pédagogiques → menu des supports (tools-content)
 *  - Que Choisir ?          → menu de démarrage (tools-que-choisir)
 *  - Guide patient          → menu des guides
 *  - Assistance IA          → web uniquement, abonnés (chatbot-view)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu } from './components/LearningSupport/LearningSupport';

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

/** Hauteur de la tranche : la face s'enfonce d'autant quand on appuie (comme Formations). */
const PRESS_DEPTH = 5;
/** Web : mêmes largeurs que Formations (une carte max 640 px, deux par ligne dès 440 px chacune). */
const WEB_CARD_MAX_WIDTH = 640;
const WEB_TWO_UP_CARD_MIN = 440;
const ICON_SIZE = IS_WEB || isTablet ? 96 : 72;

const ToolCard = ({
  title,
  icon,
  face,
  edge,
  onPress,
  style,
}: {
  title: string;
  icon: ImageSourcePropType;
  face: string;
  edge: string;
  onPress: () => void;
  style?: any;
}) => {
  const press = useRef(new Animated.Value(0)).current;
  const animatePress = (toValue: number) => {
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: !IS_WEB }).start();
  };
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      style={style}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.cardEdge, { backgroundColor: edge }]}>
        <Animated.View style={[styles.cardFace, { backgroundColor: face, transform: [{ translateY }] }]}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
};

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
        contentContainerStyle={[styles.content, styles.contentCentered, twoUp && styles.contentTwoUp]}
        onLayout={(e) => setBodyWidth(e.nativeEvent.layout.width)}
        showsVerticalScrollIndicator={false}
      >
        <ToolCard
          title="Supports pédagogiques"
          icon={require('../../../assets/tools/learning-support/access-icon.png')}
          face={CARD_COLORS.learning.face}
          edge={CARD_COLORS.learning.edge}
          onPress={() => setShowLearningSupportMenu(true)}
          style={cardStyle}
        />
        <ToolCard
          title="Que Choisir ?"
          icon={require('../../../assets/tools/que-choisir/access-icon.png')}
          face={CARD_COLORS.queChoisir.face}
          edge={CARD_COLORS.queChoisir.edge}
          onPress={() => setShowQueChoisirMenu(true)}
          style={cardStyle}
        />
        <ToolCard
          title="Guide patient"
          icon={require('../../../assets/tools/guide-patient/access-icon.png')}
          face={CARD_COLORS.guidePatient.face}
          edge={CARD_COLORS.guidePatient.edge}
          onPress={() => setShowGuidePatientMenu(true)}
          style={cardStyle}
        />
        {IS_WEB && hasSubscription && (
          <ToolCard
            title="Assistance IA"
            icon={require('../../../assets/tools/guide-patient/access-icon.png')}
            face={CARD_COLORS.chatbot.face}
            edge={CARD_COLORS.chatbot.edge}
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
  // Mobile et web : le bloc de cartes est centré verticalement (alignContent pour le cas 2 + 1 sur le web).
  contentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignContent: 'center',
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
  cardEdge: {
    borderRadius: 16,
    paddingBottom: PRESS_DEPTH,
  },
  cardFace: {
    borderRadius: 16,
    paddingVertical: Spacings.lg,
    paddingHorizontal: Spacings.md,
    alignItems: 'center',
    gap: Spacings.sm,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.white,
    textAlign: 'center',
  },

  /* ---- Menus ---- */
  modalWeb: {
    width: 700,
    alignSelf: 'center',
  },
});
