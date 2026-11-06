import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, ActivityIndicator, StyleSheet, Platform } from 'react-native';
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
 * repliée, l'identité, tous ses domaines et « n thèmes · dès … » ; dépliée, ses thèmes, chacun avec
 * ses formats (prix) qui mènent directement à l'écran Réserver.
 * Toucher l'identité ouvre le profil ; toucher le bandeau (chevron) déplie ou replie les thèmes, qui
 * s'ouvrent sous le bandeau.
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

  /*
   * Dépli animé (mobile et web) : la hauteur des thèmes passe de 0 à leur hauteur mesurée, le
   * contenu apparaît en fondu en glissant un peu, le chevron tourne et prend la couleur de l'expert.
   * Les thèmes restent montés jusqu'à la fin de la fermeture.
   */
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [mounted, setMounted] = useState(open);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 300 : 240,
      easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open]);

  const toggle = () => {
    if (offers.length) onToggle();
  };

  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const animated: any = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  return (
    <Animated.View style={[{ width }, animated]}>
      <View style={[styles.card, { shadowColor: accent }]}>
        {/* ---- Identité : toucher ouvre le profil ---- */}
        <Pressable
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          onPress={onProfile}
          accessibilityRole="link"
          accessibilityLabel={`Profil de ${[expert.honorific, expert.name].filter(Boolean).join(' ')}`}
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
                {domains.map((d) => (
                  <View key={d.id} style={[styles.domain, { backgroundColor: soft }]}>
                    <Text style={[styles.domainText, { color: accent }]} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {expert.reason ? <SearchReason text={expert.reason} /> : null}
          </View>
        </Pressable>

        {/* ---- Bandeau aux couleurs de l'expert, entre l'identité et les thèmes : le toucher les déplie / replie ---- */}
        {offers.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.foot, mounted && styles.footOpen, { backgroundColor: tint(accent, pressed ? 0.14 : 0.08) }]}
            onPress={toggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`${offers.length} thème${offers.length > 1 ? 's' : ''}, ${open ? 'replier' : 'déplier'}`}
          >
            <Text style={styles.summary} numberOfLines={1}>
              <Text style={styles.summaryStrong}>
                {offers.length} thème{offers.length > 1 ? 's' : ''}
              </Text>
              {from != null ? ` · ${prices.length > 1 || formatsOf(offers[0]).length > 1 ? 'dès ' : ''}${priceLabel(from, currency)}` : ''}
            </Text>
            {/* Chevron : tourne d'un demi-tour ; fond et flèche passent en fondu aux couleurs de l'expert. */}
            <View style={[styles.chevron, { borderColor: withAlpha(accent, 0.45) }]}>
              <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: accent, opacity: progress }]} />
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Animated.View style={{ opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                  <Ionicons name="chevron-down" size={18} color={accent} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
                  <Ionicons name="chevron-down" size={18} color={Colors.white} />
                </Animated.View>
              </Animated.View>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.foot, { backgroundColor: tint(accent, 0.08) }]}>
            <Text style={styles.summary}>Pas de rendez-vous pour le moment</Text>
          </View>
        )}
        {/* ---- Thèmes dépliés : un bloc par thème, un bouton par format ---- */}
        {mounted && offers.length > 0 ? (
          <Animated.View
            style={[
              styles.reveal,
              { height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }) },
            ]}
          >
          <Animated.View
            style={[
              styles.offers,
              {
                opacity: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.4, 1] }),
                transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
              },
            ]}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              if (Math.abs(h - contentHeight) > 1) setContentHeight(h);
            }}
          >
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
          </Animated.View>
          </Animated.View>
        ) : null}

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

  /* ---- Thèmes dépliés ---- */
  // Cadre du dépli : sa hauteur s'anime, le contenu (mesuré à part) est posé dedans.
  reveal: {
    overflow: 'hidden',
  },
  offers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: CARD_PADDING,
    paddingTop: Spacings.xxs,
    paddingBottom: Spacings.xs,
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
  // Thèmes dépliés sous le bandeau : il n'est plus le bas de la carte.
  footOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  summary: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStrong: {
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
});
