import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, LayoutAnimation, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem, BookingMode, BookingOfferFormat, BookingOfferSummary } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { accentOf, tint, withAlpha } from '../../bookingPalette';
import { MODE_META, sortModes } from '../../components/ModePill';
import { SearchReason } from './SearchReason';

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 20;
const CARD_PADDING = Spacings.md;
const AVATAR = 56;
/** Domaines affichés sur la carte ; les autres se résument en « +n ». */
const MAX_DOMAINS = 2;
const STAGGER_MS = 60;

/** Formats d'un thème : ceux du serveur, ou à défaut (ancienne réponse) les modes seuls au prix « dès ». */
const formatsOf = (offer: BookingOfferSummary): BookingOfferFormat[] =>
  offer.formats ?? sortModes(offer.modes).map((mode) => ({ mode, price: offer.price_from ?? 0, places: [] }));

/** Libellé d'un format : « Visio », ou les villes du présentiel (« Lyon, Paris »). */
const formatText = (format: BookingOfferFormat) => {
  if (format.mode === 'online') return 'Visio';
  const cities = [...new Set(format.places.map((p) => p.city).filter(Boolean))];
  return cities.length ? cities.join(', ') : 'Présentiel';
};

interface ExpertCardProps {
  expert: BookingExpertListItem;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Thèmes dépliés ; une seule carte ouverte à la fois (la liste décide). */
  open: boolean;
  onToggle: () => void;
  /** Thème choisi : l'écran Réserver s'ouvre, sur ce format s'il est donné (calendrier direct). */
  onOfferPress: (offerId: number, mode?: BookingMode) => void;
  /** Thème en cours d'ouverture (fiche de l'expert chargée d'abord). */
  openingOfferId?: number | null;
  onProfile: () => void;
}

/**
 * Carte d'un expert, liste « Thèmes » (mobile et web), aux couleurs de l'expert :
 * repliée, l'identité, deux domaines et « n thèmes · dès … » ; dépliée, ses thèmes, chacun avec
 * ses formats (prix) qui mènent directement à l'écran Réserver.
 */
export const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  width,
  indexInPage,
  open,
  onToggle,
  onOfferPress,
  openingOfferId,
  onProfile,
}) => {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: indexInPage * STAGGER_MS,
      friction: 8,
      tension: 60,
      useNativeDriver: !IS_WEB,
    }).start();
  }, []);

  const accent = accentOf(expert.palette_color);
  const soft = tint(accent, 0.12);
  const offers = expert.online ? expert.offers ?? [] : [];
  const domains = expert.domains ?? [];
  const prices = offers.map((o) => o.price_from).filter((p): p is number => p != null);
  const from = prices.length ? Math.min(...prices) : null;
  const currency = offers[0]?.currency;

  const toggle = () => {
    if (!offers.length) return;
    try {
      LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    } catch (e) {}
    onToggle();
  };

  const animated: any = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  return (
    <Animated.View style={[{ width }, animated]}>
      <View style={[styles.card, { shadowColor: accent }]}>
        {/* ---- Identité : toucher la carte déplie les thèmes ---- */}
        <Pressable
          style={styles.main}
          onPress={toggle}
          disabled={!offers.length}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={[expert.honorific, expert.name].filter(Boolean).join(' ')}
        >
          <View style={[styles.avatar, { backgroundColor: accent }]}>
            {expert.avatar_url ? (
              <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={styles.initials}>{initials(expert.name)}</Text>
            )}
          </View>
          <View style={styles.info}>
            {expert.honorific ? (
              <Text style={[styles.honorific, { color: accent }]} numberOfLines={1}>
                {expert.honorific}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>
              {expert.name}
            </Text>
            {expert.credentials ? (
              <Text style={styles.credentials} numberOfLines={2}>
                {expert.credentials}
              </Text>
            ) : null}
            {domains.length > 0 ? (
              <View style={styles.domains}>
                {domains.slice(0, MAX_DOMAINS).map((d) => (
                  <View key={d.id} style={[styles.domain, { backgroundColor: soft }]}>
                    <Text style={[styles.domainText, { color: accent }]} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </View>
                ))}
                {domains.length > MAX_DOMAINS ? (
                  <Text style={styles.domainMore}>+{domains.length - MAX_DOMAINS}</Text>
                ) : null}
              </View>
            ) : null}
            {expert.reason ? <SearchReason text={expert.reason} /> : null}
          </View>
        </Pressable>

        {/* ---- Thèmes dépliés : un bloc par thème, un bouton par format ---- */}
        {open && offers.length > 0 ? (
          <View style={styles.offers}>
            {offers.map((offer, i) => {
              const opening = openingOfferId === offer.id;
              return (
                <View key={offer.id} style={[styles.offer, i > 0 && styles.offerRule]}>
                  <Pressable
                    style={({ pressed }) => [styles.offerHead, pressed && styles.pressed]}
                    onPress={() => onOfferPress(offer.id)}
                    disabled={!!openingOfferId}
                    accessibilityRole="button"
                    accessibilityLabel={`Réserver ${offer.title}`}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.offerTitle} numberOfLines={2}>
                        {offer.title}
                      </Text>
                      <Text style={styles.offerMeta}>{offer.duration_label}</Text>
                    </View>
                    {opening ? (
                      <ActivityIndicator size="small" color={accent} />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color={accent} />
                    )}
                  </Pressable>
                  <View style={styles.formats}>
                    {formatsOf(offer).map((format) => (
                      <Pressable
                        key={format.mode}
                        style={({ pressed }) => [styles.format, { borderColor: withAlpha(accent, 0.4) }, pressed && { backgroundColor: soft }]}
                        onPress={() => onOfferPress(offer.id, format.mode)}
                        disabled={!!openingOfferId}
                        accessibilityRole="button"
                        accessibilityLabel={`Réserver ${offer.title}, ${MODE_META[format.mode].label}`}
                      >
                        <MaterialCommunityIcons
                          name={format.mode === 'online' ? 'video-outline' : 'map-marker-outline'}
                          size={14}
                          color={accent}
                        />
                        <Text style={styles.formatText} numberOfLines={1}>
                          {formatText(format)}
                        </Text>
                        <Text style={styles.formatPrice}>{priceLabel(format.price, offer.currency)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
            <Pressable style={styles.profileLink} onPress={onProfile} accessibilityRole="link" hitSlop={6}>
              <Text style={[styles.profileText, { color: accent }]}>Voir le profil</Text>
              <Ionicons name="chevron-forward" size={14} color={accent} />
            </Pressable>
          </View>
        ) : null}

        {/* ---- Pied de carte aux couleurs de l'expert ---- */}
        <View style={[styles.foot, { backgroundColor: tint(accent, 0.08) }]}>
          {offers.length > 0 ? (
            <>
              <Text style={styles.summary} numberOfLines={1}>
                <Text style={styles.summaryStrong}>
                  {offers.length} thème{offers.length > 1 ? 's' : ''}
                </Text>
                {from != null ? ` · ${prices.length > 1 || formatsOf(offers[0]).length > 1 ? 'dès ' : ''}${priceLabel(from, currency)}` : ''}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.toggle, { backgroundColor: open ? Colors.white : accent, borderColor: accent }, pressed && styles.pressed]}
                onPress={toggle}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Text style={[styles.toggleText, { color: open ? accent : Colors.white }]}>Thèmes</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={open ? accent : Colors.white} />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.summary, styles.flex]}>Pas de rendez-vous pour le moment</Text>
              <Pressable style={styles.profileLink} onPress={onProfile} accessibilityRole="link" hitSlop={6}>
                <Text style={[styles.profileText, { color: accent }]}>Profil</Text>
                <Ionicons name="chevron-forward" size={14} color={accent} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
    padding: CARD_PADDING,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    letterSpacing: 0.5,
    color: Colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.subtext2,
  },
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacings.xs,
  },
  domain: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    lineHeight: 16,
  },
  domainMore: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },

  /* ---- Thèmes dépliés ---- */
  offers: {
    marginHorizontal: CARD_PADDING,
    paddingTop: Spacings.xs,
    paddingBottom: Spacings.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  offer: {
    paddingVertical: Spacings.sm,
    gap: Spacings.xs,
  },
  offerRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  offerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  offerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
  },
  offerMeta: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  formats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  format: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  formatText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  formatPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.text,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingTop: Spacings.xs,
  },
  profileText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },

  /* ---- Pied ---- */
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: Spacings.sm,
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  },
  summary: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  summaryStrong: {
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  toggleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
});
