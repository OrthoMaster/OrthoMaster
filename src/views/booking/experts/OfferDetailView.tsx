import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
  Animated,
  Linking,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  BookingLocation,
  BookingMode,
  BookingOffer,
  BookingOfferImage,
  getBookingExpert,
} from '../../../services/v2/BookingService';
import { takeBookingCompleted } from '../bookingFlow';
import { formatLongDate } from '../bookingDates';
import { initials, priceLabel } from '../bookingFormat';
import { tint, withAlpha } from '../bookingPalette';
import { useBookingDirty } from '../BookingExitGuard';
import { expertTheme } from '../expertTheme';
import { ThemeBackdrop } from '../components/ThemeBackdrop';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { PERIOD_ICONS, PERIOD_LABELS, SlotPicker, SlotSelection, placeLabel } from './components/SlotPicker';

const INSET = Spacings.lg;
const EXPERT_AVATAR = 36;
/** Abréviations usuelles des mois, pour la pastille de date. */
const MONTHS_SHORT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
/** Vignettes au format 4:3 ; la suivante dépasse pour inviter à faire défiler. */
const THUMB_RATIO = 4 / 3;
const THUMB_PEEK = 56;

type DetailTab = 'details' | 'calendar';

/** En ligne d'abord, puis en présentiel, quel que soit l'ordre reçu. */
const MODE_ORDER: BookingMode[] = ['online', 'onsite'];
const MODE_ICONS: Record<BookingMode, 'video-outline' | 'map-marker-outline'> = {
  online: 'video-outline',
  onsite: 'map-marker-outline',
};

/** Adresse sur deux lignes : rue, puis code postal et ville. */
const addressLines = (l: { address_line?: string | null; postal_code?: string | null; city?: string | null }) => [
  l.address_line,
  [l.postal_code, l.city].filter(Boolean).join(' '),
].filter(Boolean) as string[];

/**
 * Onglets en texte souligné, posés sur le fond : un trait de la couleur principale
 * glisse sous l'onglet actif, un filet fin court sous l'ensemble.
 */
const UnderlineTabs = ({
  tabs,
  value,
  onChange,
  theme,
}: {
  tabs: { key: DetailTab; label: string; badge?: number }[];
  value: DetailTab;
  onChange: (key: DetailTab) => void;
  theme: ReturnType<typeof expertTheme>;
}) => {
  const [width, setWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));
  const segment = width / tabs.length;

  useEffect(() => {
    if (!segment) return;
    Animated.spring(slide, { toValue: index * segment, friction: 10, tension: 90, useNativeDriver: true }).start();
  }, [index, segment]);

  return (
    <View style={[styles.tabs, { borderBottomColor: theme.line }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => onChange(t.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.tabLabel, { color: active ? theme.ink : theme.muted }, active && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {t.badge ? (
              <View style={[styles.tabBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.tabBadgeText, { color: theme.onPrimary }]}>{t.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
      {segment > 0 && (
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: segment * 0.5, left: segment * 0.25, backgroundColor: theme.primary, transform: [{ translateX: slide }] },
          ]}
        />
      )}
    </View>
  );
};

/**
 * Visionneuse plein écran : glisser d'une image à l'autre, légende et position en bas.
 */
const ImageViewer = ({
  images,
  startIndex,
  onClose,
}: {
  images: BookingOfferImage[];
  startIndex: number;
  onClose: () => void;
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex);
  const current = images[index];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: startIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {images.map((image) => (
            <Image key={image.id} source={{ uri: image.url }} style={{ width, height }} resizeMode="contain" />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.viewerClose, { top: insets.top + Spacings.sm }]}
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel="Fermer"
        >
          <Ionicons name="close" size={26} color={Colors.white} />
        </TouchableOpacity>

        <View style={[styles.viewerFoot, { paddingBottom: insets.bottom + Spacings.md }]}>
          {current?.caption ? <Text style={styles.viewerCaption}>{current.caption}</Text> : null}
          {images.length > 1 && (
            <Text style={styles.viewerCount}>
              {index + 1} / {images.length}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Thème d'échange : en-tête fixe (titre, expert, durée, prix), puis deux onglets.
 *  - Détails : description complète et illustrations
 *  - Réserver : choix des demi-journées, aux couleurs de l'expert
 * Les deux onglets restent montés : le calendrier se charge pendant la lecture des détails.
 */
export const OfferDetailView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const expertId: number = route.params?.expertId;
  const offer: BookingOffer = route.params?.offer;
  const expert = route.params?.expert ?? {};
  const theme = expertTheme(expert.palette, expert.palette_color);

  // Bornes de réservation : déjà en cache depuis le profil.
  const { data: detail } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });

  const [tab, setTab] = useState<DetailTab>(route.params?.initialTab ?? 'details');
  const [selection, setSelection] = useState<SlotSelection>({});

  // Modes actifs de l'offre, en ligne d'abord ; le premier est choisi d'office.
  const modes = MODE_ORDER.map((m) => offer?.modes?.find((om) => om.mode === m)).filter(Boolean) as BookingOffer['modes'];
  const [mode, setMode] = useState<BookingMode | null>(route.params?.mode ?? modes[0]?.mode ?? null);
  const offerMode = modes.find((m) => m.mode === mode) ?? modes[0] ?? null;
  const onsiteLocations: BookingLocation[] = modes.find((m) => m.mode === 'onsite')?.locations ?? [];
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const images = offer?.images ?? [];
  const required = offer?.blocks_count ?? 1;
  const selectedCount = Object.keys(selection).length;
  const complete = selectedCount === required;

  /* ---- Sortie avec une sélection en cours ---- */

  useBookingDirty(selectedCount > 0);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      // Demande envoyée depuis le récapitulatif : la sélection n'est pas perdue, elle est partie.
      if (takeBookingCompleted(route.key) || selectedCount === 0) return;

      e.preventDefault();
      Alert.alert('Abandonner votre sélection ?', 'Les demi-journées choisies ne seront pas conservées.', [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, route.key, selectedCount]);

  if (!offer) return null;

  const thumbWidth = images.length > 1 ? width - INSET * 2 - THUMB_PEEK : width - INSET * 2;
  const thumbHeight = Math.round(thumbWidth / THUMB_RATIO);
  const sortedSelection = Object.entries(selection).sort(([a], [b]) => a.localeCompare(b));

  // Changer de format change le calendrier : la sélection en cours ne vaut plus.
  const changeMode = (next: BookingMode) => {
    if (next === offerMode?.mode) return;
    if (selectedCount === 0) {
      setMode(next);
      return;
    }
    Alert.alert('Changer de format ?', 'Les demi-journées choisies seront retirées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Changer',
        onPress: () => {
          setSelection({});
          setMode(next);
        },
      },
    ]);
  };

  const removeSelected = (key: string) => {
    const next = { ...selection };
    delete next[key];
    setSelection(next);
  };

  // Récapitulatif et paiement en feuille basse, par-dessus le calendrier : on y revient tel quel.
  const submit = () => {
    if (!offerMode) return;
    navigation.navigate('expert-checkout', {
      expertId,
      offer,
      mode: offerMode.mode,
      expert,
      blocks: sortedSelection.map(([, block]) => block),
      offerRouteKey: route.key,
    });
  };

  // Hauteur du pied : une ligne de 52 dans les deux onglets.
  const footerBody = 52;
  const bottomSpace = footerBody + Spacings.md * 2 + Math.max(insets.bottom, Spacings.sm);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ThemeBackdrop theme={theme} />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        {/* ---- En-tête : expert, puis thème à gauche et repères pratiques à droite ---- */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {expert.name ? (
              <View style={styles.expertRow}>
                <View style={[styles.expertAvatar, { backgroundColor: theme.primary, borderColor: theme.card }]}>
                  {expert.avatar_url ? (
                    <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <Text style={[styles.expertInitials, { color: theme.onPrimary }]}>{initials(expert.name)}</Text>
                  )}
                </View>
                <View style={styles.flex}>
                  {expert.honorific ? (
                    <Text style={[styles.expertHonorific, { color: theme.primary }]} numberOfLines={1}>
                      {expert.honorific}
                    </Text>
                  ) : null}
                  <Text style={[styles.expertName, { color: theme.ink }]} numberOfLines={1}>
                    {expert.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.flex} />
            )}

            <TouchableOpacity
              style={[
                styles.round,
                { borderColor: withAlpha(theme.primary, 0.45), backgroundColor: withAlpha(theme.primary, 0.1) },
              ]}
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerMain}>
            <Text style={[styles.title, { color: theme.ink }]}>{offer.title}</Text>

            {/* Repères pratiques sur une ligne, sous le titre : icône et valeur, séparés par un point. */}
            <View style={styles.factsRow}>
              <View style={styles.factLine}>
                <Ionicons name="time-outline" size={16} color={theme.primary} />
                <Text style={[styles.factValue, { color: theme.ink }]}>{offer.duration_label}</Text>
              </View>
              {/* Un seul format : il s'affiche ici ; deux formats : choix juste dessous. */}
              {modes.length === 1 && offerMode ? (
                <>
                  <View style={[styles.factDot, { backgroundColor: theme.line }]} />
                  <View style={styles.factLine}>
                    <MaterialCommunityIcons name={MODE_ICONS[offerMode.mode]} size={16} color={theme.primary} />
                    <Text style={[styles.factValue, { color: theme.ink }]}>{offerMode.label}</Text>
                  </View>
                </>
              ) : null}
              <View style={[styles.factDot, { backgroundColor: theme.line }]} />
              <View style={styles.factLine}>
                <Text style={[styles.factValue, styles.factPrice, { color: theme.ink }]}>
                  {priceLabel(offerMode?.price ?? offer.price, offer.currency)}
                </Text>
              </View>
            </View>

            {modes.length > 1 && offerMode ? (
              <View style={styles.modeSwitch}>
                <SegmentedTabs
                  tabs={modes.map((m) => ({ key: m.mode, label: m.label }))}
                  value={offerMode.mode}
                  onChange={changeMode}
                  color={theme.primary}
                  surface={theme.card}
                  borderColor={theme.line}
                />
              </View>
            ) : null}
          </View>

          <UnderlineTabs
            tabs={[
              { key: 'details', label: 'Détails' },
              { key: 'calendar', label: 'Réserver', badge: selectedCount || undefined },
            ]}
            value={tab}
            onChange={setTab}
            theme={theme}
          />
        </View>

        {/* ---- Détails ---- */}
        <ScrollView
          style={[styles.flex, tab !== 'details' && styles.hidden]}
          contentContainerStyle={{ paddingTop: Spacings.lg, paddingBottom: bottomSpace }}
          showsVerticalScrollIndicator={false}
        >
          {offer.description ? (
            <Text style={[styles.description, { color: theme.ink }]}>{offer.description}</Text>
          ) : (
            <Text style={[styles.description, { color: theme.muted }]}>Pas de description pour ce thème.</Text>
          )}

          {/* ---- Lieux du présentiel (3b) : adresse visible avant de réserver ---- */}
          {onsiteLocations.length > 0 ? (
            <View style={styles.places}>
              <Text style={[styles.placesTitle, { color: theme.ink }]}>
                {onsiteLocations.length > 1 ? 'Lieux en présentiel' : 'Lieu en présentiel'}
              </Text>
              {onsiteLocations.map((location) => (
                <View key={location.id} style={[styles.placeRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
                  <View style={[styles.placeIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
                    <Ionicons name="location-outline" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.placeLabel, { color: theme.ink }]} numberOfLines={1}>
                      {location.label}
                    </Text>
                    {addressLines(location).map((line) => (
                      <Text key={line} style={[styles.placeAddress, { color: theme.muted }]} numberOfLines={2}>
                        {line}
                      </Text>
                    ))}
                  </View>
                  {location.maps_url ? (
                    <TouchableOpacity
                      style={[styles.placeRoute, { borderColor: withAlpha(theme.primary, 0.45) }]}
                      onPress={() => Linking.openURL(location.maps_url).catch(() => {})}
                      hitSlop={6}
                      accessibilityLabel={`Itinéraire vers ${location.label}`}
                    >
                      <Ionicons name="navigate-outline" size={14} color={theme.primary} />
                      <Text style={[styles.placeRouteText, { color: theme.primary }]}>Itinéraire</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {images.length > 0 && (
            <View style={styles.gallery}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={thumbWidth + Spacings.sm}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: INSET, gap: Spacings.sm }}
                // Image « courante » = celle qui occupe le début de la zone, d'après le pas d'aimantation.
                onScroll={(e) => {
                  const next = Math.round(e.nativeEvent.contentOffset.x / (thumbWidth + Spacings.sm));
                  if (next !== galleryIndex) setGalleryIndex(Math.max(0, Math.min(images.length - 1, next)));
                }}
                scrollEventThrottle={32}
              >
                {images.map((image, i) => (
                  <Pressable
                    key={image.id}
                    onPress={() => setViewerIndex(i)}
                    style={{ width: thumbWidth }}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={image.caption ?? `Illustration ${i + 1}`}
                  >
                    <View style={[styles.thumb, { height: thumbHeight, backgroundColor: theme.card, borderColor: theme.line }]}>
                      <Image source={{ uri: image.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      <View style={styles.zoom}>
                        <Ionicons name="expand-outline" size={16} color={Colors.white} />
                      </View>
                    </View>
                    {image.caption ? (
                      <Text style={[styles.caption, { color: theme.muted }]} numberOfLines={2}>
                        {image.caption}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>

              {/* Une pastille par image ; celle affichée s'allonge. */}
              {images.length > 1 ? (
                <View style={styles.galleryDots}>
                  {images.map((image, i) => (
                    <View
                      key={image.id}
                      style={[
                        styles.galleryDot,
                        i === galleryIndex
                          ? [styles.galleryDotActive, { backgroundColor: theme.primary }]
                          : { backgroundColor: withAlpha(theme.primary, 0.25) },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* ---- Réserver ---- */}
        <ScrollView
          style={[styles.flex, tab !== 'calendar' && styles.hidden]}
          contentContainerStyle={{ paddingTop: Spacings.lg, paddingHorizontal: INSET, paddingBottom: bottomSpace }}
          showsVerticalScrollIndicator={false}
        >
          {detail && offerMode ? (
            <SlotPicker
              // Nouveau format : calendrier rechargé depuis le premier mois, aucun jour ouvert.
              key={offerMode.mode}
              expertId={expertId}
              offerId={offer.id}
              mode={offerMode.mode}
              firstDate={detail.first_date}
              lastDate={detail.last_date}
              required={required}
              theme={theme}
              selection={selection}
              onChange={setSelection}
            />
          ) : null}

          {/* ---- Demi-journées retenues, dans l'ordre chronologique ---- */}
          <View style={styles.picked}>
            <Text style={[styles.pickedTitle, { color: theme.ink }]}>
              {required > 1 ? 'Vos demi-journées' : 'Votre demi-journée'}
            </Text>

            {sortedSelection.length === 0 ? (
              <Text style={[styles.pickedEmpty, { color: theme.muted }]}>
                Touchez une date, puis Matin ou Après-midi.
              </Text>
            ) : (
              sortedSelection.map(([key, block]) => {
                const [, month, day] = block.date.split('-').map(Number);
                const longDate = formatLongDate(block.date, new Date().getFullYear());
                return (
                  <View key={key} style={[styles.pickedRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
                    <View style={[styles.pickedDate, { backgroundColor: tint(theme.primary, 0.12) }]}>
                      <Text style={[styles.pickedDay, { color: theme.primary }]}>{day}</Text>
                      <Text style={[styles.pickedMonth, { color: theme.primary }]}>
                        {MONTHS_SHORT[month - 1]}
                      </Text>
                    </View>

                    <View style={styles.flex}>
                      <Text style={[styles.pickedLabel, { color: theme.ink }]} numberOfLines={1}>
                        {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
                      </Text>
                      <View style={styles.pickedMeta}>
                        <MaterialCommunityIcons
                          name={PERIOD_ICONS[block.period]}
                          size={14}
                          color={theme.primary}
                        />
                        <Text style={[styles.pickedHours, { color: theme.muted }]}>
                          {PERIOD_LABELS[block.period]} · {block.start_local} – {block.end_local}
                        </Text>
                      </View>
                      {block.location ? (
                        <View style={styles.pickedMeta}>
                          <Ionicons name="location-outline" size={14} color={theme.primary} />
                          <Text style={[styles.pickedHours, styles.flex, { color: theme.muted }]} numberOfLines={1}>
                            {placeLabel(block.location)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={[styles.pickedRemove, { backgroundColor: withAlpha(theme.primary, 0.08) }]}
                      onPress={() => removeSelected(key)}
                      hitSlop={8}
                      accessibilityLabel="Retirer cette demi-journée"
                    >
                      <Ionicons name="close" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ---- Pied : passer au calendrier, puis valider la sélection ---- */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacings.sm), backgroundColor: theme.panel, borderTopColor: theme.line },
        ]}
      >
        {tab === 'details' ? (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.primary }]}
            onPress={() => setTab('calendar')}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.onPrimary} />
            <Text style={[styles.ctaText, { color: theme.onPrimary }]}>Prendre rendez-vous</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: theme.muted }]} numberOfLines={2}>
              <Text style={[styles.progressCount, { color: theme.ink }]}>
                {selectedCount} / {required}
              </Text>
              {'\n'}
              {required > 1 ? 'demi-journées choisies' : 'demi-journée choisie'}
            </Text>

            <TouchableOpacity
              style={[styles.cta, styles.ctaCompact, { backgroundColor: complete ? theme.primary : Colors.disabledBackground }]}
              onPress={submit}
              disabled={!complete}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaText, { color: theme.onPrimary }]}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {viewerIndex !== null && (
        <ImageViewer images={images} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },

  /* ---- En-tête ---- */
  header: {
    paddingHorizontal: INSET,
    paddingTop: Spacings.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  expertAvatar: {
    width: EXPERT_AVATAR,
    height: EXPERT_AVATAR,
    borderRadius: EXPERT_AVATAR / 2,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },
  // Titre de civilité en petites capitales espacées, nom juste dessous : lecture en une ligne d'œil.
  expertHonorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  expertName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    lineHeight: 20,
  },
  headerMain: {
    gap: Spacings.xs,
    marginTop: Spacings.md,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.6,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  factDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  factLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  factValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  factPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  modeSwitch: {
    marginTop: Spacings.xs,
  },

  /* ---- Lieux ---- */
  places: {
    gap: Spacings.sm,
    paddingHorizontal: INSET,
    marginTop: Spacings.lg,
  },
  placesTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  placeAddress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  placeRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: Spacings.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  placeRouteText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },

  /* ---- Onglets ---- */
  tabs: {
    flexDirection: 'row',
    marginTop: Spacings.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.sm,
  },
  tabLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  tabLabelActive: {
    fontFamily: 'Poppins-Bold',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    borderRadius: 2,
  },

  /* ---- Détails ---- */
  description: {
    fontFamily: 'Roboto',
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: INSET,
  },
  gallery: {
    marginTop: Spacings.lg,
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacings.sm,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  galleryDotActive: {
    width: 18,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    paddingHorizontal: INSET,
    marginTop: Spacings.xl,
    marginBottom: Spacings.md,
  },
  thumb: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  zoom: {
    position: 'absolute',
    right: Spacings.xs,
    bottom: Spacings.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacings.xs,
  },

  /* ---- Pied ---- */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: Spacings.sm,
    paddingHorizontal: INSET,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    height: 52,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  ctaCompact: {
    paddingHorizontal: Spacings.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  progressText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  progressCount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },

  /* ---- Demi-journées retenues ---- */
  picked: {
    marginTop: Spacings.xl,
    gap: Spacings.sm,
  },
  pickedTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
  },
  pickedEmpty: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickedDate: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedDay: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 21,
  },
  pickedMonth: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pickedLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  pickedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    marginTop: 2,
  },
  pickedHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
  },
  pickedRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Visionneuse ---- */
  viewer: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  viewerClose: {
    position: 'absolute',
    right: INSET,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: INSET,
    paddingTop: Spacings.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  viewerCaption: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
  },
  viewerCount: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});