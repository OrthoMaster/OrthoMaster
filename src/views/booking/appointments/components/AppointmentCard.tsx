import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { MyBooking, MyBookingStatus } from '../../../../services/v2/BookingService';
import { initials } from '../../bookingFormat';
import { accentOf, withAlpha } from '../../bookingPalette';
import { PERIOD_ICONS, PERIOD_LABELS } from '../../experts/components/SlotPicker';
import { JoinVisioButton } from '../../components/JoinVisioButton';
import { STATUS_META, featuredBlock, formatShortDay, relativeDay } from '../appointmentFormat';

const CARD_RADIUS = 20;
const MOTIF_SIZE = 112;

/** Motif de fond, dans le coin bas droit : il dit l'état d'un coup d'œil. */
const MOTIF: Record<MyBookingStatus, keyof typeof MaterialCommunityIcons.glyphMap> = {
  pending: 'timer-sand',
  accepted: 'calendar-check',
  completed: 'check-decagram-outline',
  declined: 'calendar-remove-outline',
  expired: 'calendar-remove-outline',
  cancelled: 'calendar-remove-outline',
};

interface AppointmentCardProps {
  booking: MyBooking;
  onPress: () => void;
}

/**
 * Carte d'un rendez-vous : expert et état en tête, thème, puis la demi-journée la plus
 * proche, sous un intitulé qui la présente comme la prochaine (et non la seule).
 * Un motif aux couleurs de l'expert respire lentement dans le coin pour les rendez-vous en cours.
 */
export const AppointmentCard: React.FC<AppointmentCardProps> = ({ booking, onPress }) => {
  const meta = STATUS_META[booking.status];
  const expert = booking.expert;
  const accent = accentOf(expert?.palette_color);
  const { block, upcoming } = featuredBlock(booking);
  const active = booking.status === 'pending' || booking.status === 'accepted';

  /* ---- Motif animé ---- */
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  const motifStyle = {
    transform: [
      { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '-4deg'] }) },
      { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  };

  const blockLabel = upcoming ? 'Prochaine demi-journée' : 'Première demi-journée';

  return (
    <Pressable
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}, ${booking.offer_title}, ${expert?.name ?? ''}`}
    >
      {/* Ombre à l'extérieur, rognage à l'intérieur : sinon iOS perd l'ombre. */}
      <View style={styles.card}>
        <Animated.View style={[styles.motif, motifStyle]} pointerEvents="none">
          <MaterialCommunityIcons name={MOTIF[booking.status]} size={MOTIF_SIZE} color={withAlpha(accent, 0.12)} />
        </Animated.View>

        {/* ---- Expert et état ---- */}
        <View style={styles.top}>
          <View style={styles.avatar}>
            {expert?.avatar_url ? (
              <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
            ) : (
              <Text style={styles.initials}>{initials(expert?.name ?? '')}</Text>
            )}
          </View>
          <View style={styles.flex}>
            {expert?.honorific ? (
              <Text style={styles.honorific} numberOfLines={1}>
                {expert.honorific}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={1}>
              {expert?.name ?? 'Expert'}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: meta.background }]}>
            <Ionicons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]} numberOfLines={1}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {booking.offer_title}
        </Text>

        {/* ---- Demi-journée mise en avant ---- */}
        {block ? (
          <View style={styles.session}>
            <View style={styles.sessionHead}>
              <Text style={styles.sessionLabel}>{blockLabel}</Text>
              {booking.status === 'accepted' && upcoming ? (
                <Text style={[styles.sessionWhen, { color: accent }]}>{relativeDay(block.date)}</Text>
              ) : null}
            </View>

            <View style={styles.block}>
              <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={16} color={Colors.lblueDark} />
              <Text style={styles.blockDate}>{formatShortDay(block.date)}</Text>
              <Text style={styles.blockHours}>
                {PERIOD_LABELS[block.period]} · {block.start_local} – {block.end_local}
              </Text>
            </View>

            {booking.status === 'accepted' && upcoming ? (
              <View style={styles.join}>
                <JoinVisioButton startAt={block.start_at} endAt={block.end_at} url={block.meet_url} color={accent} />
              </View>
            ) : null}

          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  /* ---- Carte ---- */
  shadow: {
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    shadowColor: Colors.lblueDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    padding: Spacings.md,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  motif: {
    position: 'absolute',
    right: -18,
    bottom: -22,
  },

  /* ---- En-tête ---- */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.lblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.white,
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.lblueDark,
  },
  name: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: Colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    maxWidth: '50%',
    paddingHorizontal: Spacings.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.text,
    marginTop: Spacings.md,
  },

  /* ---- Demi-journée ---- */
  session: {
    marginTop: Spacings.sm,
    gap: Spacings.xxs,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  sessionLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.subtext,
  },
  sessionWhen: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  join: {
    marginTop: Spacings.sm,
  },
  blockDate: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  blockHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
});