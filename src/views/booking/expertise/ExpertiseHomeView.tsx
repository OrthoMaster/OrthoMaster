import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
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
import { BookingHeaderButton, BookingScreenHeader } from '../components/BookingScreenHeader';
import { ExpertiseSectionCard } from '../components/ExpertiseSectionCard';
import { ShowcaseWebViewModal } from '../components/ShowcaseWebViewModal';
import { notify, shareLink } from '../bookingActions';

const QUERY_KEY = ['booking', 'me'];

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count > 1 ? pluralForm : singular}`;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

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
  const [showShowcase, setShowShowcase] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const { data, isFetching, refetch } = useQuery({
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

  const showcaseUrl = expertShowcaseUrl(expert.slug);
  // inapp=true : la page vitrine adapte son affichage quand elle est ouverte dans l'application.
  // Le lien partagé reste l'adresse publique, sans paramètre.
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
      icon: 'tag-multiple-outline' as const,
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader
        title="Mon expertise"
        right={
          <>
            {showcaseUrl && (
              <BookingHeaderButton
                icon="share-social-outline"
                label="Partager la page vitrine"
                onPress={() => shareLink(showcaseUrl, expert.name)}
              />
            )}
            {/* Réservé à la future édition du profil. */}
            <BookingHeaderButton
              icon="create-outline"
              label="Modifier le profil"
              onPress={() => notify('Bientôt disponible', 'La modification du profil arrive prochainement.')}
            />
          </>
        }
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + Spacings.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[Colors.lblue]} tintColor={Colors.lblue} />
        }
      >
        {/* ---- Profil ---- */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {expert.avatar_url ? (
                <Image source={{ uri: expert.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials(expert.name)}</Text>
                </View>
              )}
              <StatusDot color={status.dot} pulse={statusKey === 'online'} />
            </View>

            <View style={styles.profileTexts}>
              <Text style={styles.name} numberOfLines={2}>
                {expert.name}
              </Text>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          {expert.domains.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Domaines</Text>
              <View style={styles.domains}>
                {expert.domains.map((domain) => (
                  <View key={domain.id} style={styles.domainPill}>
                    <Text style={styles.domainText}>{domain.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {showcaseUrl && (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Page vitrine web</Text>
              {/* Soulignement et fond teinté signalent le lien ; ellipse au milieu pour garder le slug lisible. */}
              <TouchableOpacity
                style={styles.showcaseLink}
                onPress={openShowcase}
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Ouvrir la page vitrine web"
              >
                <Text style={styles.showcaseUrl} numberOfLines={1} ellipsizeMode="middle">
                  {showcaseUrl.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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

        {/* ---- Configuration ---- */}
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.sections}>
          {sections.map((section) => (
            <ExpertiseSectionCard
              key={section.key}
              icon={section.icon}
              title={section.title}
              summary={section.summary}
              warning={section.warning}
              onPress={() => navigation.navigate(section.route)}
            />
          ))}
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
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    gap: Spacings.md,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  /* ---- Profil ---- */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  // Liseré : la pastille de statut vient chevaucher le bord sans mordre sur la photo.
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.lblue3,
    backgroundColor: Colors.lblue3,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.lblueDark,
  },
  profileTexts: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    marginTop: Spacings.xxxs,
  },

  /* ---- Pastille de statut ---- */
  statusDotWrap: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  statusDotRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  /* ---- Blocs (domaines, page vitrine) ---- */
  block: {
    marginTop: Spacings.md,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  blockLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginBottom: Spacings.xs,
  },
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  // Les libellés longs passent à la ligne dans la pastille au lieu de déborder.
  domainPill: {
    maxWidth: '100%',
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },
  showcaseLink: {
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.lblue3,
  },
  showcaseUrl: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.lblueDark,
    textDecorationLine: 'underline',
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
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.xs,
    marginLeft: Spacings.xxs,
  },
  sections: {
    gap: Spacings.sm,
  },
});