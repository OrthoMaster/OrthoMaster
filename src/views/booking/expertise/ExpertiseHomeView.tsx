import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import {
  ExpertBookingSetup,
  expertShowcaseUrl,
  getMyBookingSetup,
  updateMyBookingSettings,
} from '../../../services/v2/BookingService';
import { ExpertiseSectionCard } from '../components/ExpertiseSectionCard';
import { ShowcaseWebViewModal } from '../components/ShowcaseWebViewModal';
import { notify } from '../bookingActions';
import { withAlpha } from '../bookingPalette';
import { expertTheme } from '../expertTheme';
import { ExpertIdentityCard } from '../components/ExpertIdentityCard';

const QUERY_KEY = ['booking', 'me'];

/* ---- Version web : mise en page sur deux colonnes ---- */
/** Barre latérale commune du web (AppTab.web) : la zone de contenu est le reste. */
const WEB_SIDEBAR_WIDTH = 200;
/** À partir de cette largeur de contenu : profil à gauche, configuration à droite. */
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_MAX_WIDTH = 1040;
/** Colonne du profil, à la largeur d'un téléphone. */
const WEB_PROFILE_COLUMN = 380;
/** Une colonne (écran étroit) : largeur bornée pour que les cartes ne s'étirent pas. */
const WEB_SINGLE_MAX_WIDTH = 560;

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count > 1 ? pluralForm : singular}`;

type ExpertStatus = 'online' | 'incomplete' | 'off';

/** online : reçoit des demandes ; incomplete : activé mais rien à réserver ; off : désactivé. */
const STATUS: Record<ExpertStatus, { dot: string; text: string; label: string }> = {
  online: { dot: Colors.success, text: Colors.success, label: 'Reçoit des demandes' },
  incomplete: { dot: Colors.warning, text: Colors.yellowDark, label: 'Activé · profil incomplet' },
  off: { dot: Colors.gray, text: Colors.subtext2, label: 'Demandes désactivées' },
};

/** Pastille posée sur l'avatar ; pulsation seulement quand l'expert reçoit des demandes. */
const StatusDot = ({ color, pulse }: { color: string; pulse: boolean }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) {
      anim.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.statusDotWrap} pointerEvents="none">
      {pulse && (
        <Animated.View
          style={[
            styles.statusDotRing,
            {
              backgroundColor: color,
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            },
          ]}
        />
      )}
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    </View>
  );
};

/**
 * Onglet Expertise : profil public, activation des demandes et accès à la configuration.
 * Lit et écrit le cache ['booking', 'me'] partagé avec BookingTabs : chaque écriture
 * renvoie l'état complet, tous les écrans de l'espace se mettent à jour d'un coup.
 */
export const ExpertiseHomeView = ({ navigation }) => {
  const queryClient = useQueryClient();
  const bottomInset = useFloatingTabBarInset();
  const { width } = useWindowDimensions();
  const [showShowcase, setShowShowcase] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  // Indicateur réservé au tirage manuel : lié à isFetching, il apparaissait à chaque retour
  // sur l'écran (rechargement du cache partagé) et décalait la page vers le bas sur iOS.
  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const { data, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMyBookingSetup(),
  });

  // BookingTabs n'affiche cet onglet qu'à un expert chargé ; garde pour le typage.
  if (!data || !data.is_expert) {
    return null;
  }

  const setup = data as ExpertBookingSetup;
  const { expert, settings } = setup;
  const resolved = settings.resolved;

  const activeOffers = setup.offers.filter((offer) => offer.active_flg);
  const liveRules = setup.rules.filter((rule) => !rule.expired);
  const missingOffer = activeOffers.length === 0;
  const missingRule = liveRules.length === 0;
  const incomplete = resolved.enabled_flg && (missingOffer || missingRule);
  const statusKey: ExpertStatus = !resolved.enabled_flg ? 'off' : incomplete ? 'incomplete' : 'online';
  const status = STATUS[statusKey];

  // Lien vitrine seulement une fois la page publiée (brochure_published_at).
  const showcaseUrl = expert.showcase_published ? expertShowcaseUrl(expert.slug) : null;

  // Même thème que la fiche publique : palette choisie, ou bleu de l'espace par défaut.
  // Seule la carte d'identité de cet écran le porte ; le reste garde les couleurs communes.
  const theme = expertTheme(expert.palette, expert.palette_color);

  const showcaseInAppUrl = showcaseUrl ? `${showcaseUrl}?inapp=true` : null;

  /* ---- Actions ---- */

  // Optimiste : l'interrupteur bascule tout de suite, retour arrière si le serveur refuse.
  const toggleEnabled = async (value: boolean) => {
    const previous = setup;
    queryClient.setQueryData(QUERY_KEY, {
      ...setup,
      settings: { ...settings, resolved: { ...resolved, enabled_flg: value } },
    });

    setSavingToggle(true);
    const result = await updateMyBookingSettings({ enabled_flg: value });
    setSavingToggle(false);

    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
    } else {
      queryClient.setQueryData(QUERY_KEY, previous);
      notify('Enregistrement impossible', result.message ?? 'Réessayez dans un instant.');
    }
  };

  const openShowcase = () => {
    if (!showcaseUrl) return;

    // Sur le web, ouverture dans le clic même : depuis un effet, le navigateur bloquerait l'onglet.
    if (Platform.OS === 'web') {
      window.open(showcaseUrl, '_blank', 'noopener');
      return;
    }
    setShowShowcase(true);
  };

  /* ---- Mise en page ---- */

  // Web large : deux colonnes ; web étroit : une colonne bornée et centrée ; mobile : inchangé.
  const isWeb = Platform.OS === 'web';
  const wide = isWeb && width - WEB_SIDEBAR_WIDTH >= WEB_TWO_COLUMNS_FROM;

  /* ---- Sections ---- */

  const exceptionsCount = setup.exceptions.length;
  const availabilitySummary = missingRule
    ? 'Aucune demi-journée ouverte'
    : plural(liveRules.length, 'demi-journée', 'demi-journées') +
      (exceptionsCount > 0 ? ` · ${plural(exceptionsCount, 'exception', 'exceptions')}` : '');

  const sections = [
    {
      key: 'offers',
      route: 'expertise-offers',
      icon: 'school-outline' as const,
      title: 'Offres',
      summary: missingOffer ? 'Aucune offre active' : plural(activeOffers.length, 'offre active', 'offres actives'),
      warning: missingOffer,
    },
    {
      key: 'availability',
      route: 'expertise-availability',
      icon: 'calendar-clock' as const,
      title: 'Disponibilités',
      summary: availabilitySummary,
      warning: missingRule,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + Spacings.md },
          isWeb && (wide ? styles.webWide : styles.webSingle),
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={pullToRefresh} colors={[Colors.lblue]} tintColor={Colors.lblue} />
        }
      >
        {/* ---- En-tête, comme les autres onglets (Agenda, Demandes) ---- */}
        <View style={styles.head}>
          <Text style={styles.title}>Mon expertise</Text>
          <View style={styles.headActions}>
            <TouchableOpacity
              style={styles.round}
              onPress={() => navigation.navigate('expertise-profile')}
              hitSlop={8}
              accessibilityLabel="Modifier le profil"
            >
              <MaterialCommunityIcons name="account-edit-outline" size={23} color={Colors.lblueDark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={wide ? styles.webColumns : styles.stack}>
        {/* Web large : profil et activation dans une colonne de la largeur d'un téléphone, qui reste visible. */}
        <View style={wide ? styles.webProfileColumn : styles.stack}>
        {/* ---- Identité : comme vos confrères la voient ---- */}
        <ExpertIdentityCard
          expert={expert}
          theme={theme}
          width={width - Spacings.md * 2}
          avatarBadge={<StatusDot color={status.dot} pulse={statusKey === 'online'} />}
        >
          {showcaseUrl && (
            <TouchableOpacity
              style={[styles.showcaseLink, { borderColor: withAlpha(theme.primary, 0.35), backgroundColor: theme.card }]}
              onPress={openShowcase}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Ouvrir la page vitrine web"
            >
              <Ionicons name="globe-outline" size={18} color={theme.primary} />
              <Text style={[styles.showcaseUrl, { color: theme.primary }]} numberOfLines={1} ellipsizeMode="middle">
                {showcaseUrl.replace(/^https?:\/\//, '')}
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </ExpertIdentityCard>

        {/* ---- Activation ---- */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTexts}>
              <Text style={styles.toggleTitle}>Accepter les demandes</Text>
              <Text style={styles.toggleHint}>
                {resolved.enabled_flg
                  ? 'Vos confrères peuvent vous proposer un rendez-vous.'
                  : "Votre profil n'apparaît pas à vos confrères."}
              </Text>
            </View>
            <Switch
              value={resolved.enabled_flg}
              onValueChange={toggleEnabled}
              disabled={savingToggle}
              trackColor={{ false: Colors.disabledBackground, true: Colors.lblue }}
              thumbColor={Colors.white}
              // iOS peint ce fond sous la piste : fixe, il déborde en gris à droite quand l'interrupteur est activé.
              ios_backgroundColor={resolved.enabled_flg ? Colors.lblue : Colors.disabledBackground}
            />
          </View>

          {incomplete && (
            <View style={styles.warning}>
              <MaterialCommunityIcons name="alert-outline" size={20} color={Colors.warning} />
              <Text style={styles.warningText}>
                Profil incomplet : ajoutez
                {missingOffer ? ' au moins une offre active' : ''}
                {missingOffer && missingRule ? ' et' : ''}
                {missingRule ? ' au moins une demi-journée dans la semaine type' : ''} pour recevoir des demandes.
              </Text>
            </View>
          )}
        </View>

        </View>

        {/* ---- Configuration ---- */}
        <View style={wide ? styles.webConfigColumn : styles.stack}>
        <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>Configuration</Text>
        <View style={styles.sections}>
          {sections.map((section, index) => (
            <ExpertiseSectionCard
              key={section.key}
              last={index === sections.length - 1}
              icon={section.icon}
              title={section.title}
              summary={section.summary}
              warning={section.warning}
              onPress={() => navigation.navigate(section.route)}
            />
          ))}
        </View>
        </View>
        </View>
      </ScrollView>

      <ShowcaseWebViewModal visible={showShowcase} url={showcaseInAppUrl} onClose={() => setShowShowcase(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    gap: Spacings.md,
  },
  // Blocs empilés (mobile, web étroit) : même écart que le contenu.
  stack: {
    gap: Spacings.md,
  },

  /* ---- Web ---- */
  webSingle: {
    width: '100%',
    maxWidth: WEB_SINGLE_MAX_WIDTH,
    alignSelf: 'center',
  },
  webWide: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: Spacings.lg,
  },
  webColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xl,
  },
  // Reste visible pendant le défilement de la configuration.
  webProfileColumn: {
    width: WEB_PROFILE_COLUMN,
    gap: Spacings.md,
    position: 'sticky' as any,
    top: Spacings.md,
  },
  webConfigColumn: {
    flex: 1,
    minWidth: 0,
    gap: Spacings.md,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  /* ---- En-tête ---- */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    paddingTop: Spacings.sm,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
  },
  headActions: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: withAlpha(Colors.lblueDark, 0.45),
    backgroundColor: withAlpha(Colors.lblueDark, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Page vitrine (bas de la carte d'identité) ---- */
  showcaseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 46,
    paddingHorizontal: Spacings.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  showcaseUrl: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  /* ---- Pastille de statut ---- */
  statusDotWrap: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  statusDotRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  /* ---- Activation ---- */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  toggleTexts: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  toggleHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
    marginTop: Spacings.xxxs,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginTop: Spacings.md,
    padding: Spacings.sm,
    borderRadius: 10,
    backgroundColor: Colors.warningBackground,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.warning,
  },

  /* ---- Configuration ---- */
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.xs,
    marginLeft: Spacings.xxs,
  },
  // Web large : le titre s'aligne sur le haut de la carte profil (son avatar dépasse au-dessus).
  sectionTitleWide: {
    marginTop: 0,
  },
  // Liste sans fond : les lignes se séparent par un filet.
  sections: {
    paddingHorizontal: Spacings.xxs,
  },
});