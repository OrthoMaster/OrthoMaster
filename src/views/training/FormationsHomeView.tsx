/**
 * Accueil de l'onglet Formations (mobile et web) : trois entrées.
 *  - E-learning → Mes formations (training-list)
 *  - Tutorat    → espace rendez-vous experts (booking)
 *  - Diplôme    → pré-inscription au Diplôme Pharmacie (training-diploma)
 */
import React, { useCallback, useRef } from 'react';
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

/** L'illustration dépasse du haut de la carte d'autant. */
const POP = 20;
const FACE_PADDING = Spacings.md;

/** Web : trois cartes côte à côte dès que la zone de contenu le permet. */
const WEB_GRID_MIN_WIDTH = 900;
const WEB_SIDEBAR_WIDTH = 200;

interface EntryCardProps {
  title: string;
  description: string;
  illustration: ImageSourcePropType;
  face: string;
  edge: string;
  badge?: number;
  onPress: () => void;
  style?: any;
}

const EntryCard: React.FC<EntryCardProps> = ({ title, description, illustration, face, edge, badge, onPress, style }) => {
  const press = useRef(new Animated.Value(0)).current;

  const animatePress = (toValue: number) => {
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: !IS_WEB }).start();
  };

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      style={[styles.cardWrapper, style]}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.cardEdge, { backgroundColor: edge }]}>
        <Animated.View style={[styles.cardFace, { backgroundColor: face, transform: [{ translateY }] }]}>
          {/* Illustration 3D sur 40 % de la largeur, qui dépasse un peu du haut de la carte. */}
          <View style={styles.illustrationBox}>
            <Image source={illustration} style={styles.illustration} resizeMode="contain" />
          </View>

          <View style={styles.texts}>
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
    }, [navigation])
  );
  const webGrid = IS_WEB && windowWidth - WEB_SIDEBAR_WIDTH >= WEB_GRID_MIN_WIDTH;

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

  const cardStyle = webGrid ? styles.cardGridItem : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lgreen} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Formations</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, webGrid && styles.contentGrid]}
        showsVerticalScrollIndicator={false}
      >
        <EntryCard
          title="E-learning"
          description="Vos formations en ligne, à suivre à votre rythme."
          illustration={ILLUSTRATIONS.elearning}
          face={Colors.lgreen}
          edge={Colors.lgreenDark}
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
    backgroundColor: Colors.lgreen,
  },
  header: {
    height: IS_WEB || isTablet ? 100 : 60,
    backgroundColor: Colors.lgreen,
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
    paddingTop: Spacings.lg + POP,
    gap: Spacings.lg + POP,
  },
  contentGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    maxWidth: 1200,
    width: '100%',
    paddingTop: Spacings.xl + POP,
  },

  /* ---- Carte 3D ---- */
  cardWrapper: {},
  cardGridItem: {
    flex: 1,
  },
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
  // Carré : l'image (contain) garde ses proportions ; la place est réservée avant le chargement.
  // Marge haute négative : le carré remonte au-dessus de la carte, de POP au-delà du bord.
  illustrationBox: {
    width: '40%',
    // Carte très large (web sur une colonne, tablette) : l'image ne grossit pas au-delà.
    maxWidth: 220,
    aspectRatio: 1,
    // Calé en bas : seul le haut dépasse.
    alignSelf: 'flex-end',
    marginTop: -(POP + FACE_PADDING),
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  texts: {
    flex: 1,
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
