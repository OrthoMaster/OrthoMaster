import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { ExpertRequest } from '../../../../services/v2/BookingService';
import { initials } from '../../bookingFormat';
import { withAlpha } from '../../bookingPalette';
import { PERIOD_ICONS, PERIOD_LABELS } from '../../experts/components/SlotPicker';
import { featuredBlock, formatDeadline, formatShortDay } from '../../appointments/appointmentFormat';
import { REQUEST_STATUS_META, REQUESTS_ACCENT, timeLeft } from '../requestFormat';

const CARD_RADIUS = 20;


interface RequestCardProps {
  request: ExpertRequest;
  /** Couleur de la palette de l'expert (réservée, plus utilisée sur la carte). */
  accent?: string;
  onPress: () => void;
}

/**
 * Carte d'une demande reçue : demandeur et état, thème, première demi-journée,
 * puis le délai de réponse en bas (en rouge sous 24 h).
 * Même construction que la carte côté demandeur (AppointmentCard).
 */
export const RequestCard: React.FC<RequestCardProps> = ({ request, onPress }) => {
  const meta = REQUEST_STATUS_META[request.status];
  const { block, upcoming } = featuredBlock(request);
  const pending = request.status === 'pending';
  const left = pending ? timeLeft(request.respond_by) : null;

  // En attente : la pastille affiche le temps restant (rouge sous 24 h) à la place de « À traiter ».
  const pill = left
    ? {
        label: `Encore ${left.label}`,
        icon: 'hourglass-outline' as const,
        color: left.urgent ? Colors.danger : meta.color,
        background: left.urgent ? Colors.dangerBackground : meta.background,
      }
    : meta;

  return (
    <Pressable
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pill.label}, ${request.offer_title}, ${request.requester.name}`}
    >
      <View style={styles.card}>
        {/* ---- Demandeur et état ---- */}
        <View style={styles.top}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials(request.requester.name)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.kicker}>Demande de</Text>
            <Text style={styles.name} numberOfLines={1}>
              {request.requester.name}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: pill.background }]}>
            <Ionicons name={pill.icon} size={13} color={pill.color} />
            <Text style={[styles.badgeText, { color: pill.color }]} numberOfLines={1}>
              {pill.label}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {request.offer_title}
        </Text>

        {/* ---- Demi-journée mise en avant ---- */}
        {block ? (
          <View style={styles.session}>
            <Text style={styles.sessionLabel}>{upcoming ? 'Prochaine demi-journée' : 'Première demi-journée'}</Text>
            <View style={styles.block}>
              <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={16} color={Colors.lblueDark} />
              <Text style={styles.blockDate}>{formatShortDay(block.date)}</Text>
              <Text style={styles.blockHours}>
                {PERIOD_LABELS[block.period]} · {block.start_local} – {block.end_local}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ---- Délai de réponse ---- */}
        {pending && request.respond_by ? (
          <View style={[styles.deadline, left?.urgent && styles.deadlineUrgent]}>
            <Text style={[styles.deadlineText, { color: left?.urgent ? Colors.danger : Colors.text }]} numberOfLines={2}>
              Répondre avant <Text style={styles.deadlineDate}>{formatDeadline(request.respond_by)}</Text>
            </Text>
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
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: REQUESTS_ACCENT,
  },
  kicker: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.subtext,
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

  /* ---- Délai ---- */
  deadline: {
    alignSelf: 'flex-start',
    marginTop: Spacings.md,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 10,
    backgroundColor: Colors.warningBackground,
  },
  deadlineUrgent: {
    backgroundColor: Colors.dangerBackground,
  },
  deadlineText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  // Seule l'échéance est en gras : c'est elle qu'on lit.
  deadlineDate: {
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Demi-journée ---- */
  session: {
    marginTop: Spacings.sm,
    gap: Spacings.xxs,
  },
  sessionLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.subtext,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
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