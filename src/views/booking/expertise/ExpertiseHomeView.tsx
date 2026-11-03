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
  updateMyConsultation,
} from '../../../services/v2/BookingService';
import { ExpertiseSectionCard } from '../components/ExpertiseSectionCard';
import { ShowcaseWebViewModal } from '../components/ShowcaseWebViewModal';
import { confirmAction, notify } from '../bookingActions';
import { withAlpha } from '../bookingPalette';
import { expertTheme } from '../expertTheme';
import { ExpertIdentityCard } from '../components/ExpertIdentityCard';
import { ExpertiseServiceCard } from './components/ExpertiseServiceCard';
import { CONSULT_COLOR, CONSULT_SOFT, durationText } from '../bookingKinds';
import { formatPrice } from '../bookingFormat';

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
  incomplete: { dot: Colors.warning, text: Colors.yellowDark, label: 'Activé · incomplet' },
  off: { dot: Colors.gray, text: Colors.subtext2, label: 'Désactivé' },
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
  const [savingToggle, setSavingToggle] = useState<'themes' | 'consultation' | null>(null);

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

  /* ---- Thèmes et Consultation : deux activations indépendantes ---- */
  const themesOn = resolved.enabled_flg;
  // Thèmes : il faut un thème actif et des demi-journées ouvertes pour être réservé.
  const themesKey: ExpertStatus = !themesOn ? 'off' : missingOffer || missingRule ? 'incomplete' : 'online';
  const consult = setup.consultation;
  const consultOn = !!consult?.enabled;
  const consultKey: ExpertStatus = !consultOn ? 'off' : consult?.price == null ? 'incomplete' : 'online';
  // Pastille du profil : en ligne si l'un des deux reçoit des demandes.
  const statusKey: ExpertStatus =
    themesKey === 'online' || consultKey === 'online'
      ? 'online'
      : themesKey === 'incomplete' || consultKey === 'incomplete'
        ? 'incomplete'
        : 'off';
  const status = STATUS[statusKey];

  // Lien vitrine seulement une fois la page publiée (brochure_published_at).
  const showcaseUrl = expert.showcase_published ? expertShowcaseUrl(expert.slug) : null;

  // Même thème que la fiche publique : palette choisie, ou bleu de l'espace par défaut.
  // Seule la carte d'identité de cet écran le porte ; le reste garde les couleurs communes.
  const theme = expertTheme(expert.palette, expert.palette_color);

  const showcaseInAppUrl = showcaseUrl ? `${showcaseUrl}?inapp=true` : null;

  /* ---- Actions ---- */

  // Optimiste : l'interrupteur bascule tout de suite, retour arrière si le serveur refuse.
  const toggleThemes = async (value: boolean) => {
    // Pas de demande sur les thèmes sans au moins un thème actif.
    if (value && missingOffer) {
      confirmAction(
        'Aucun thème actif',
        'Créez et activez au moins un thème avant d’accepter des demandes sur vos thèmes.',
        'Créer un thème',
        () => navigation.navigate('expertise-offer-form')
      );
      return;
    }

    const previous = setup;
    queryClient.setQueryData(QUERY_KEY, {
      ...setup,
      settings: { ...settings, resolved: { ...resolved, enabled_flg: value } },
    });

    setSavingToggle('themes');
    const result = await updateMyBookingSettings({ enabled_flg: value });
    setSavingToggle(null);

    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
    } else {
      queryClient.setQueryData(QUERY_KEY, previous);
      const failure = result as Extract<typeof result, { ok: false }>;
      notify('Enregistrement impossible', failure.message ?? 'Réessayez dans un instant.');
    }
  };

  const toggleConsultation = async (value: boolean) => {
    if (!consult) return;
    // Pas de consultation sans prix : on passe par ses réglages.
    if (value && consult.price == null) {
      confirmAction(
        'Prix manquant',
        'Indiquez d’abord votre prix pour 30 minutes dans les réglages de la consultation.',
        'Régler',
        () => navigation.navigate('expertise-consultation')
      );
      return;
    }

    const previous = setup;
    queryClient.setQueryData(QUERY_KEY, { ...setup, consultation: { ...consult, enabled: value } });

    setSavingToggle('consultation');
    const result = await updateMyConsultation({ enabled: value });
    setSavingToggle(null);

    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
    } else {
      queryClient.setQueryData(QUERY_KEY, previous);
      const failure = result as Extract<typeof result, { ok: false }>;
      notify('Enregistrement impossible', failure.message ?? 'Réessayez dans un instant.');
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

  const themesSummary = missingOffer
    ? 'Aucun thème actif'
    : plural(activeOffers.length, 'thème actif', 'thèmes actifs') +
      (setup.offers.length > activeOffers.length ? ` · ${setup.offers.length - activeOffers.length} inactif(s)` : '');

  const noticeDays = consult?.min_notice_resolved ?? resolved.min_notice_days;
  const consultSummary =
    consult?.price == null
      ? 'Prix pour 30 minutes à définir'
      : `${formatPrice(consult.price)} / 30 min · jusqu’à ${durationText(consult.max_minutes)} · délai ${noticeDays} j`;

  const themesWarning =
    themesOn && missingOffer
      ? 'Aucun thème actif : vos thèmes ne sont pas proposés.'
      : themesOn && missingRule
        ? 'Aucune demi-journée ouverte : ouvrez-en dans Disponibilités pour être réservé.'
        : null;
  const consultWarning = consultOn && consult?.price == null ? 'Indiquez votre prix pour 30 minutes.' : null;

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

        </View>

        {/* ---- Mes services : Thèmes et Consultation, même présentation ---- */}
        <View style={wide ? styles.webConfigColumn : styles.stack}>
        <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>Mes services</Text>

        <ExpertiseServiceCard
          icon="lightbulb-on-outline"
          color={Colors.lblue}
          soft={Colors.lblue3}
          title="Thèmes"
          description="Des thèmes préparés à l'avance, réservés par demi-journées, en visio ou sur place."
          enabled={themesOn}
          saving={savingToggle === 'themes'}
          onToggle={toggleThemes}
          stateLabel={themesKey === 'online' ? 'Reçoit des demandes' : themesKey === 'incomplete' ? 'Activé · incomplet' : 'Désactivé'}
          stateColor={STATUS[themesKey].text}
          warning={themesWarning}
          links={[
            {
              icon: 'school-outline',
              title: 'Mes thèmes',
              summary: themesSummary,
              warning: themesOn && missingOffer,
              onPress: () => navigation.navigate('expertise-offers'),
            },
          ]}
        />

        {consult ? (
          <ExpertiseServiceCard
            icon="chat-question-outline"
            color={CONSULT_COLOR}
            soft={CONSULT_SOFT}
            title="Consultation"
            description="Vos confrères vous posent leur propre question, en visio, par tranches de 30 minutes."
            enabled={consultOn}
            saving={savingToggle === 'consultation'}
            onToggle={toggleConsultation}
            stateLabel={consultKey === 'online' ? 'Reçoit des demandes' : consultKey === 'incomplete' ? 'Activé · incomplet' : 'Désactivé'}
            stateColor={STATUS[consultKey].text}
            warning={consultWarning}
            links={[
              {
                icon: 'cash-clock',
                title: 'Prix, durée et délai',
                summary: consultSummary,
                warning: consultOn && consult.price == null,
                onPress: () => navigation.navigate('expertise-consultation'),
              },
            ]}
          />
        ) : null}

        {/* ---- Commun aux deux services ---- */}
        <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>Mon agenda</Text>
        <View style={styles.sections}>
          <ExpertiseSectionCard
            last
            icon="calendar-clock"
            title="Disponibilités"
            summary={`${availabilitySummary} · thèmes et consultation`}
            warning={themesOn && missingRule}
            onPress={() => navigation.navigate('expertise-availability')}
          />
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