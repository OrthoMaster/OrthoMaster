import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingOffer } from '../../../../services/v2/BookingService';
import { formatPrice } from '../../bookingFormat';
import { darken, withAlpha } from '../../bookingPalette';

const CARD_RADIUS = 18;
/** Épaisseur de la tranche 3D. */
const DEPTH = 6;
const GAP = Spacings.sm;
/** Part de la carte suivante visible : invite à faire défiler. */
const PEEK = 36;
/** Encoches du ticket, à la couleur du fond de la feuille. */
const NOTCH = 20;
const DASH = 6;
const DASH_GAP = 5;

interface OfferCarouselProps {
  offers: BookingOffer[];
  accent: string;
  /** Largeur disponible (celle de la feuille). */
  width: number;
  /** Marge latérale de la feuille : la première carte s'aligne sur le texte. */
  inset: number;
  /** Couleur du fond derrière les cartes : celle des encoches. */
  notchColor: string;
  /** Toucher une carte = ouvrir le thème (détails et calendrier). */
  onSelect: (offer: BookingOffer) => void;
}

/**
 * Thèmes en tickets d'échange à faire défiler : en-tête (format, titre, description),
 * ligne perforée, puis durée et prix. Toucher un ticket ouvre le thème.
 */
export const OfferCarousel: React.FC<OfferCarouselProps> = ({
  offers,
  accent,
  width,
  inset,
  notchColor,
  onSelect,
}) => {
  const [index, setIndex] = useState(0);

  const single = offers.length === 1;
  const cardWidth = width - inset * 2 - (single ? 0 : PEEK);
  const step = cardWidth + GAP;

  // Typographie proportionnelle à la carte : même équilibre sur petit et grand écran.
  const titleSize = Math.round(Math.min(21, Math.max(16, cardWidth * 0.056)));
  const bodySize = Math.round(Math.min(14, Math.max(12, cardWidth * 0.041)));
  const priceSize = Math.round(Math.min(24, Math.max(19, cardWidth * 0.066)));
  const pad = Math.round(cardWidth * 0.06);
  const titleLine = Math.round(titleSize * 1.3);
  const bodyLine = Math.round(bodySize * 1.4);
  const dashes = Math.floor((cardWidth - pad * 2) / (DASH + DASH_GAP));

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.max(0, Math.min(offers.length - 1, Math.round(e.nativeEvent.contentOffset.x / step))));
  };

  return (
    <View>
      <ScrollView
        horizontal
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        // Marge basse : la tranche n'est pas coupée par le défilement.
        contentContainerStyle={{ paddingHorizontal: inset, gap: GAP, paddingBottom: DEPTH }}
        onMomentumScrollEnd={settle}
      >
        {offers.map((offer, i) => (
          <Pressable
            key={offer.id}
            onPress={() => onSelect(offer)}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="button"
            accessibilityLabel={`${offer.title}, ${offer.duration_label}, ${formatPrice(offer.price, offer.currency)}`}
          >
            {/* Tranche 3D sous la carte, plus sombre que la couleur principale. */}
            <View style={[styles.edge, { backgroundColor: darken(accent, 0.45) }]}>
              <LinearGradient
                // Une nuance par carte : les thèmes se distinguent sans quitter la palette.
                colors={[darken(accent, (i % 3) * 0.08), darken(accent, 0.3 + (i % 3) * 0.08)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { width: cardWidth, paddingTop: pad, paddingBottom: Math.round(pad * 0.7) }]}
              >
                <View style={{ paddingHorizontal: pad }}>
                  <Text style={styles.kind}>Échange en visio</Text>
                  {/* Hauteurs réservées (2 lignes chacun) : toutes les cartes ont la même taille. */}
                  <Text
                    style={[styles.title, { fontSize: titleSize, lineHeight: titleLine, height: titleLine * 2 }]}
                    numberOfLines={2}
                  >
                    {offer.title}
                  </Text>
                  <Text
                    style={[styles.description, { fontSize: bodySize, lineHeight: bodyLine, height: bodyLine * 2 }]}
                    numberOfLines={2}
                  >
                    {offer.description ?? ''}
                  </Text>
                </View>

                {/* Ligne perforée et encoches : se lit comme un billet. */}
                <View style={styles.perforation}>
                  <View style={[styles.notch, styles.notchLeft, { backgroundColor: notchColor }]} />
                  <View style={[styles.dashes, { paddingHorizontal: pad }]}>
                    {Array.from({ length: dashes }).map((_, d) => (
                      <View key={d} style={styles.dash} />
                    ))}
                  </View>
                  <View style={[styles.notch, styles.notchRight, { backgroundColor: notchColor }]} />
                </View>

                {/* Durée et prix sur une ligne. */}
                <View style={[styles.bottom, { paddingHorizontal: pad }]}>
                  <View style={styles.duration}>
                    <Ionicons name="time-outline" size={bodySize + 2} color={Colors.white} />
                    <Text style={[styles.durationText, { fontSize: bodySize }]}>{offer.duration_label}</Text>
                  </View>
                  <Text style={[styles.price, { fontSize: priceSize }]}>{formatPrice(offer.price, offer.currency)}</Text>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {!single && (
        <View style={styles.dots}>
          {offers.map((offer, i) => (
            <View
              key={offer.id}
              style={[styles.dot, i === index ? { width: 18, backgroundColor: accent } : { backgroundColor: withAlpha(accent, 0.25) }]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pressed: {
    transform: [{ translateY: DEPTH / 2 }],
  },

  /* ---- Carte 3D, sans ombre ---- */
  edge: {
    borderRadius: CARD_RADIUS,
    paddingBottom: DEPTH,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },

  /* ---- En-tête du billet ---- */
  kind: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.72)',
    marginBottom: Spacings.xxs,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 2,
  },

  /* ---- Perforation ---- */
  perforation: {
    height: NOTCH,
    justifyContent: 'center',
    marginVertical: Spacings.xxs,
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
  },
  notchLeft: {
    left: -NOTCH / 2,
  },
  notchRight: {
    right: -NOTCH / 2,
  },
  // Tirets dessinés un à un : borderStyle 'dashed' sur un seul côté est peu fiable sur iOS.
  dashes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dash: {
    width: DASH,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  /* ---- Pied du billet ---- */
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  durationText: {
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  price: {
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },

  /* ---- Pagination ---- */
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.xxs,
    marginTop: Spacings.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});