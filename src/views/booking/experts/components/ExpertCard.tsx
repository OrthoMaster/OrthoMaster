import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, LayoutAnimation, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { ModePill, sortModes } from '../../components/ModePill';

const CARD_RADIUS = 20;
const CARD_PADDING = Spacings.sm;
const PHOTO_RADIUS = 14;

/** Le portrait carré suit la hauteur du texte, dans ces bornes. */
const PHOTO_MIN = 92;
const PHOTO_MAX = 132;

/** Décalage d'entrée entre deux cartes d'une même page : la liste se déroule au lieu d'apparaître d'un bloc. */
const STAGGER_MS = 60;

interface ExpertCardProps {
  expert: BookingExpertListItem;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  onPress: () => void;
}

/**
 * Carte blanche aux couleurs de l'espace rendez-vous (la palette de l'expert est réservée
 * à son profil). Portrait carré à la hauteur du texte, identité à droite.
 * Expert disponible : ses thèmes se déplient sous la carte, une ligne chacun.
 */
export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, width, indexInPage, onPress }) => {
  const [photoSize, setPhotoSize] = useState(PHOTO_MIN);

  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: indexInPage * STAGGER_MS,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // Le carré prend la hauteur du bloc texte ; on ignore les écarts de quelques points
  // pour ne pas boucler (le texte se réagence quand le carré change de largeur).
  const fitPhoto = (e: LayoutChangeEvent) => {
    const next = Math.round(Math.min(PHOTO_MAX, Math.max(PHOTO_MIN, e.nativeEvent.layout.height)));
    if (Math.abs(next - photoSize) > 4) setPhotoSize(next);
  };

  const offers = expert.online ? expert.offers ?? [] : [];
  const [open, setOpen] = useState(false);

  const toggleOffers = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    } catch (e) { }
    setOpen((v) => !v);
  };

  const animatePress = (toValue: number) => {
    Animated.spring(press, { toValue, friction: 7, tension: 200, useNativeDriver: true }).start();
  };

  const animated = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
    ],
  };

  return (
    <Animated.View style={[{ width }, animated]}>
      <View style={styles.card}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        accessibilityRole="button"
        accessibilityLabel={[expert.honorific, expert.name, expert.online ? 'disponible' : 'indisponible']
          .filter(Boolean)
          .join(', ')}
      >
        <View style={[styles.photo, { width: photoSize, height: photoSize }]}>
          {expert.avatar_url ? (
            <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={[styles.initials, { fontSize: Math.round(photoSize * 0.3) }]}>
              {initials(expert.name)}
            </Text>
          )}
        </View>

        <View style={styles.info} onLayout={fitPhoto}>
          {expert.honorific ? (
            <Text style={styles.honorific} numberOfLines={1}>
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
        </View>

        {/* Badge d'état, accroché au coin supérieur droit de la carte ; même forme pour les deux états. */}
        <View
          style={[styles.badge, { backgroundColor: expert.online ? Colors.successBackground : Colors.grayLight }]}
          pointerEvents="none"
        >
          <View style={[styles.badgeDot, { backgroundColor: expert.online ? Colors.success : Colors.gray }]} />
          <Text style={[styles.badgeText, { color: expert.online ? Colors.success : Colors.gray }]}>
            {expert.online ? 'Disponible' : 'Indisponible'}
          </Text>
        </View>
      </Pressable>

      {/* ---- Thèmes de l'expert, repliés par défaut ---- */}
      {offers.length > 0 ? (
        <>
          <Pressable
            style={styles.toggle}
            onPress={toggleOffers}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`${offers.length} ${offers.length > 1 ? 'thèmes' : 'thème'}`}
          >
            <Text style={styles.toggleText}>
              {offers.length} {offers.length > 1 ? 'thèmes proposés' : 'thème proposé'}
            </Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.lblueDark} />
          </Pressable>

          {open ? (
            <View style={styles.offers}>
              {offers.map((offer) => (
                <Pressable
                  key={offer.id}
                  style={({ pressed }) => [styles.offer, pressed && styles.offerPressed]}
                  onPress={onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.offerBody}>
                    <Text style={styles.offerTitle} numberOfLines={1}>
                      {offer.title}
                    </Text>
                    <View style={styles.offerMeta}>
                      <Text style={styles.offerMetaText}>{offer.duration_label}</Text>
                      {sortModes(offer.modes).map((mode) => (
                        <ModePill key={mode} mode={mode} size="compact" />
                      ))}
                    </View>
                  </View>
                  {offer.price_from != null ? (
                    <Text style={styles.offerPrice}>
                      {offer.price_from > 0 && offer.modes.length > 1 ? 'dès ' : ''}
                      {priceLabel(offer.price_from, offer.currency)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte ---- */
  // Texte aligné en haut, sur le haut du portrait.
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    shadowColor: Colors.lblueDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
    padding: CARD_PADDING,
  },

  /* ---- Thèmes ---- */
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: CARD_PADDING,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.xxs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  toggleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  offers: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: CARD_PADDING,
    gap: Spacings.xxs,
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
  },
  offerPressed: {
    opacity: 0.7,
  },
  offerBody: {
    flex: 1,
  },
  offerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.xxs,
    marginTop: 3,
  },
  offerMetaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
    marginRight: 2,
  },
  offerPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Portrait ---- */
  // Sans photo : fond bleu de l'espace, initiales blanches.
  photo: {
    backgroundColor: Colors.lblue,
    borderRadius: PHOTO_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
    color: Colors.white,
  },

  /* ---- Identité ---- */
  // Marge haute : la première ligne passe sous le badge sans le toucher.
  info: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: Spacings.lg,
  },
  // Coin supérieur droit, épousant l'arrondi de la carte.
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderTopRightRadius: CARD_RADIUS,
    borderBottomLeftRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.lblueDark,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.subtext2,
  },
});