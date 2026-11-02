/**
 * Accueil de l'onglet Formations (mobile et web) : trois entrées.
 *  - E-learning → Mes formations (training-list)
 *  - Tutorat    → espace rendez-vous experts (booking)
 *  - Diplôme    → pré-inscription au Diplôme Pharmacie (training-diploma)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  useWindowDimensions,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { getExpertRequests, getMyBookingSetup } from '../../services/v2/BookingService';
import { EXPERT_REQUESTS_KEY } from '../booking/requests/RequestsView';
import { DIPLOMA_COLOR, DIPLOMA_COLOR_DARK } from './DiplomaView';

const IS_WEB = Platform.OS === 'web';
/** Web : en-tête vert foncé, pour ne pas se confondre avec la carte E-learning (vert clair). */
const HEADER_COLOR = IS_WEB ? Colors.lgreenDark : Colors.lgreen;
const isTablet = !IS_WEB && Dimensions.get('window').width >= 768;

/** Hauteur de la tranche : la face s'enfonce d'autant quand on appuie. */
const PRESS_DEPTH = 5;

/** Illustrations 3D hébergées sur S3 : modifiables sans nouvelle version de l'application. */
const ILLUSTRATION_BASE = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/settings/formations';
const ILLUSTRATIONS = {
  elearning: { uri: `${ILLUSTRATION_BASE}/elearning_3d.png` },
  tutorat: { uri: `${ILLUSTRATION_BASE}/tutorat_3d.png` },
  diplome: { uri: `${ILLUSTRATION_BASE}/diplome_3d.png` },
};

/** Part de la hauteur de l'illustration qui dépasse au-dessus de la carte. */
const POP_RATIO = 0.4;
const FACE_PADDING = Spacings.md;

/**
 * Web (illustration au-dessus du texte) : image plus grande et carte plus basse,
 * donc une plus grande part de l'image dépasse et des marges plus serrées.
 */
const COLUMN_POP_RATIO = 0.5;
/**
 * Web : le bas de l'image descend sur la zone du texte d'autant (part de sa hauteur).
 * Le bas des illustrations 3D est transparent : rien ne recouvre le texte.
 */
const COLUMN_SINK_RATIO = 0.1;
const COLUMN_FACE_PADDING = Spacings.sm;

/** Web : nombre de colonnes selon la largeur de la fenêtre (lg ≥ 1200 : 4, md ≥ 992 : 3, sinon 2). */
const WEB_SIDEBAR_WIDTH = 200;
const webColumns = (windowWidth: number) => (windowWidth >= 1200 ? 4 : windowWidth >= 992 ? 3 : 2);

/**
 * Animation de l'illustration, différente pour chaque carte : lente et discrète.
 *  - float  : flotte de haut en bas
 *  - sway   : se balance légèrement
 *  - breathe: grossit et rétrécit doucement
 */
type Motion = 'float' | 'sway' | 'breathe';

const useIllustrationMotion = (motion: Motion) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const half = motion === 'float' ? 2400 : motion === 'sway' ? 2800 : 3200;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
        Animated.timing(progress, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [motion, progress]);

  if (motion === 'float') {
    return [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }];
  }
  if (motion === 'sway') {
    return [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) }];
  }
  return [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }];
};

/**
 * Disposition de la carte :
 *  - row         : illustration à gauche, texte à droite (mobile)
 *  - row-reverse : texte à gauche, illustration à droite (mobile, E-learning)
 *  - column      : illustration centrée en haut, texte dessous aligné à gauche (web)
 */
type CardLayout = 'row' | 'row-reverse' | 'column';

interface EntryCardProps {
  title: string;
  description: string;
  illustration: ImageSourcePropType;
  face: string;
  edge: string;
  badge?: number;
  layout: CardLayout;
  motion: Motion;
  onPress: () => void;
  style?: any;
}

const EntryCard: React.FC<EntryCardProps> = ({ title, description, illustration, face, edge, badge, layout, motion, onPress, style }) => {
  const motionTransform = useIllustrationMotion(motion);

  const press = useRef(new Animated.Value(0)).current;

  const animatePress = (toValue: number) => {
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: !IS_WEB }).start();
  };

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  // La hauteur de l'illustration dépend de la largeur de la carte (40 %) : mesurée au rendu.
  // Une marge en % se calcule sur la largeur du parent, pas sur la hauteur de l'image.
  const [size, setSize] = useState(0);
  const column = layout === 'column';
  const pop = Math.round(size * (column ? COLUMN_POP_RATIO : POP_RATIO));
  const sink = column ? Math.round(size * COLUMN_SINK_RATIO) : 0;

  return (
    <Pressable
      // Place au-dessus de la carte pour la partie de l'illustration qui dépasse.
      style={[styles.cardWrapper, style, { marginTop: pop }]}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.cardEdge, { backgroundColor: edge }]}>
        <Animated.View
          style={[
            styles.cardFace,
            layout === 'row-reverse' && styles.cardFaceReverse,
            layout === 'column' && styles.cardFaceColumn,
            { backgroundColor: face, transform: [{ translateY }] },
          ]}
        >
          {/* Illustration 3D sur 40 % de la largeur ; 40 % de sa hauteur dépasse du haut de la carte. */}
          <View
            style={[
              styles.illustrationBox,
              layout === 'column' && styles.illustrationBoxColumn,
              {
                marginTop: -(pop + (column ? COLUMN_FACE_PADDING : FACE_PADDING)),
                marginBottom: -sink,
                opacity: size ? 1 : 0,
              },
            ]}
            onLayout={(e) => {
              const next = Math.round(e.nativeEvent.layout.height);
              if (next !== size) setSize(next);
            }}
          >
            <Animated.View style={[styles.illustration, { transform: motionTransform }]}>
              <Image source={illustration} style={styles.illustration} resizeMode="contain" />
            </Animated.View>
          </View>

          <View style={[styles.texts, layout === 'column' && styles.textsColumn]}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {!!badge && badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.description} numberOfLines={3}>{description}</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

export const FormationsHomeView = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();

  // Barre d'onglets visible : l'espace rendez-vous (Tutorat) la masque en entrant.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
      // Heure, batterie… en blanc. <StatusBar> ne se réapplique pas au retour sur l'écran
      // (l'espace rendez-vous les passe en sombre) : on le refait à chaque prise de focus.
      if (Platform.OS !== 'web') {
        StatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') StatusBar.setBackgroundColor(Colors.lgreen, true);
      }
    }, [navigation])
  );
  // Web : grille de cartes de largeur fixe (une rangée incomplète garde la même largeur de carte).
  const columns = webColumns(windowWidth);
  const gridWidth = windowWidth - WEB_SIDEBAR_WIDTH - Spacings.lg * 2;
  const cardWidth = Math.floor((gridWidth - Spacings.lg * (columns - 1)) / columns);

  /* ---- Tutorat : texte selon le rôle, pastille des demandes en attente (expert) ---- */
  const { data: bookingSetup } = useQuery({
    queryKey: ['booking', 'me'],
    queryFn: () => getMyBookingSetup(),
    staleTime: 60 * 1000,
  });
  const isExpert = bookingSetup?.is_expert === true;
  // Même requête que l'onglet Demandes : le chiffre suit la liste sans appel en plus.
  const { data: expertRequests } = useQuery({
    queryKey: EXPERT_REQUESTS_KEY,
    queryFn: async () => {
      const result = await getExpertRequests();
      if (!result) throw new Error('requests');
      return result;
    },
    enabled: isExpert,
  });
  const pendingRequests = expertRequests?.pending.length ?? 0;

  const cardStyle = IS_WEB ? { width: cardWidth } : null;
  // Web : illustration centrée au-dessus du texte. Mobile : côte à côte, E-learning et Diplôme inversées.
  const layoutFor = (mobile: CardLayout): CardLayout => (IS_WEB ? 'column' : mobile);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lgreen} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Formations</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, IS_WEB && styles.contentGrid, IS_WEB && columns >= 3 && styles.contentGridCentered]}
        showsVerticalScrollIndicator={false}
      >
        <EntryCard
          title="E-learning"
          description="Vos formations en ligne, à suivre à votre rythme."
          illustration={ILLUSTRATIONS.elearning}
          face={Colors.lgreen}
          edge={Colors.lgreenDark}
          layout={layoutFor('row-reverse')}
          motion="float"
          onPress={() => navigation.navigate('training-list')}
          style={cardStyle}
        />
        <EntryCard
          title="Tutorat"
          description={
            isExpert
              ? 'Vos demandes, votre agenda et vos disponibilités.'
              : 'Échangez avec un expert sur un sujet de votre pratique.'
          }
          illustration={ILLUSTRATIONS.tutorat}
          face={Colors.lblue}
          edge={Colors.lblueDark}
          layout={layoutFor('row')}
          motion="sway"
          badge={pendingRequests}
          onPress={() => navigation.navigate('booking')}
          style={cardStyle}
        />
        <EntryCard
          title="Diplôme"
          description="Pré-inscription au Diplôme Pharmacie."
          illustration={ILLUSTRATIONS.diplome}
          face={DIPLOMA_COLOR}
          edge={DIPLOMA_COLOR_DARK}
          layout={layoutFor('row-reverse')}
          motion="breathe"
          onPress={() => navigation.navigate('training-diploma')}
          style={cardStyle}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // Même titre que l'en-tête Médias.
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  // Place en haut et entre les cartes pour l'illustration qui dépasse.
  content: {
    padding: Spacings.lg,
    gap: Spacings.lg,
  },
  // lg / md : la rangée incomplète (3 cartes sur 4 colonnes…) est centrée.
  contentGridCentered: {
    justifyContent: 'center',
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    columnGap: Spacings.lg,
    rowGap: Spacings.lg,
    paddingTop: Spacings.xl,
  },

  /* ---- Carte 3D ---- */
  cardWrapper: {},
  cardEdge: {
    flex: IS_WEB ? 1 : undefined,
    borderRadius: 16,
    paddingBottom: PRESS_DEPTH,
  },
  cardFace: {
    flex: IS_WEB ? 1 : undefined,
    borderRadius: 16,
    padding: FACE_PADDING,
    paddingLeft: Spacings.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  cardFaceReverse: {
    flexDirection: 'row-reverse',
    paddingLeft: FACE_PADDING,
    paddingRight: Spacings.xs,
  },
  cardFaceColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: COLUMN_FACE_PADDING,
    // paddingLeft / paddingRight explicites : paddingLeft de cardFace l'emporterait sur paddingHorizontal.
    paddingLeft: Spacings.lg,
    paddingRight: Spacings.lg,
    // Texte collé sous l'image.
    gap: 0,
  },
  // Carré : l'image (contain) garde ses proportions ; la place est réservée avant le chargement.
  // Marge haute négative (calculée au rendu) : le carré remonte au-dessus de la carte.
  illustrationBox: {
    width: '40%',
    // Carte très large (web sur une colonne, tablette) : l'image ne grossit pas au-delà.
    maxWidth: 220,
    aspectRatio: 1,
    // Calé en haut : 40 % au-dessus de la carte, même si le texte rend la carte plus haute.
    alignSelf: 'flex-start',
  },
  // Web : centrée, le texte passe dessous.
  illustrationBoxColumn: {
    alignSelf: 'center',
    width: '55%',
    maxWidth: 260,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  texts: {
    flex: 1,
  },
  textsColumn: {
    flex: undefined,
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.white,
    flexShrink: 1,
  },
  description: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.white,
    marginTop: Spacings.xxxs,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.white,
  },
});
