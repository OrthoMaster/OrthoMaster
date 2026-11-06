import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { ExpertRequest } from '../../../../services/v2/BookingService';
import { initials } from '../../bookingFormat';
import { withAlpha } from '../../bookingPalette';
import { PERIOD_ICONS, PERIOD_LABELS } from '../../experts/components/SlotPicker';
import { featuredBlock, formatDeadline } from '../../appointments/appointmentFormat';
import { formatCardDay } from '../../bookingDates';
import { REQUEST_STATUS_META, REQUESTS_ACCENT, timeLeft } from '../requestFormat';
import { ModeLine } from '../../components/ModePill';
import { KindTags, blockHours, kindColor } from '../../components/KindTags';

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

  // État en pastille ; le délai (date limite et temps restant) est réuni en bas de la carte.
  const pill = meta;
  const consultation = request.kind === 'consultation';
  const offCalendar = !request.blocks.length && !!request.windows?.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pill.label}, ${request.offer_title}, ${request.requester.name}`}
    >
      <View style={styles.card}>
        {/* Filet à gauche : violet (Consultation) ou bleu (Thème). */}
        <View style={[styles.kindBar, { backgroundColor: kindColor(request.kind) }]} />
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

        {/* Pastilles sur une ligne (retour à la ligne si besoin) : Consultation · durée, ou Thème et son format. */}
        <KindTags kind={request.kind} durationMinutes={request.duration_minutes} themeOnly style={styles.tags}>
          {!consultation ? <ModeLine mode={request.mode ?? 'online'} location={block?.location} /> : null}
        </KindTags>
        {consultation ? (
          <>
            <Text style={styles.title}>Son sujet</Text>
            {request.subject ? (
              <Text style={styles.subject} numberOfLines={2}>
                {request.subject}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.title} numberOfLines={2}>
            {request.offer_title}
          </Text>
        )}

        {/* ---- Demi-journée mise en avant ---- */}
        {block ? (
          <View style={styles.session}>
            <Text style={styles.sessionLabel}>{request.kind === 'consultation' ? 'Créneau' : upcoming ? 'Prochaine demi-journée' : 'Première demi-journée'}</Text>
            <View style={styles.block}>
              <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={16} color={Colors.lblueDark} />
              <Text style={styles.blockDate}>{formatCardDay(block.date)}</Text>
              <Text style={styles.blockHours}>{blockHours(block, request.kind)}</Text>
            </View>
          </View>
        ) : offCalendar ? (
          // Hors calendrier : les créneaux proposés se voient sur la fiche.
          <View style={styles.offCal}>
            <View style={styles.offCalHead}>
              <Ionicons name="calendar-clear-outline" size={15} color={Colors.warning} />
              <Text style={styles.offCalTitle}>Hors calendrier</Text>
            </View>
            <Text style={styles.offCalText}>Choisissez l'horaire parmi les créneaux proposés.</Text>
          </View>
        ) : null}

        {/* ---- Délai de réponse : date limite et temps restant, au même endroit ---- */}
        {pending && request.respond_by ? (
          <View style={[styles.deadline, left?.urgent && styles.deadlineUrgent]}>
            <Ionicons name="hourglass-outline" size={14} color={left?.urgent ? Colors.danger : Colors.subtext2} />
            <Text style={[styles.deadlineText, { color: left?.urgent ? Colors.danger : Colors.text }]} numberOfLines={2}>
              Répondre avant <Text style={styles.deadlineDate}>{formatDeadline(request.respond_by)}</Text>
              {left ? <Text style={styles.deadlineLeft}> · encore {left.label}</Text> : null}
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
    paddingLeft: Spacings.md + 4,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  kindBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  tags: {
    marginTop: Spacings.sm,
  },
  // Sujet de la consultation, en noir : c'est ce que l'expert lit en premier.
  subject: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginTop: 2,
  },
  offCal: {
    marginTop: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.warningBackground,
    gap: 2,
  },
  offCalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offCalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#B26A00',
  },
  offCalText: {
    fontFamily: 'Roboto',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
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
    marginTop: Spacings.xs,
  },

  /* ---- Délai ---- */
  // Bas de carte : date limite et temps restant sur une ligne, sous un filet.
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacings.md,
    paddingTop: Spacings.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  deadlineUrgent: {
    borderTopColor: Colors.danger,
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
  deadlineLeft: {
    fontFamily: 'Poppins-Regular',
  },

  /* ---- Demi-journée ---- */
  modeLine: {
    marginTop: Spacings.xs,
  },
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