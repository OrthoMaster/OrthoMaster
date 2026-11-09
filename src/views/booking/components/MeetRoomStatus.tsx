import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingMeetRoom } from '../../../services/v2/BookingService';

interface MeetRoomStatusProps {
  meet: BookingMeetRoom | null | undefined;
  /** Début de la demi-journée : avant, pas de liste de présences. */
  startAt: string | null;
  color?: string;
}

const hhmm = (iso: string | null) => {
  if (!iso) return '…';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const duration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

/**
 * Salle Meet d'une demi-journée (mobile et web), pour l'expert comme pour le demandeur :
 * son état (ouverte, fermée ; rien tant que le lien n'est pas créé) et les présences relevées chez Google
 * (qui est entré, quand, combien de temps), repliables.
 */
export const MeetRoomStatus: React.FC<MeetRoomStatusProps> = ({ meet, startAt, color = Colors.lblue }) => {
  const [open, setOpen] = useState(false);
  // Lien pas encore créé : le bouton « Rejoindre la visio » le dit déjà.
  if (!meet || meet.status === 'pending') return null;

  const started = !!startAt && new Date(startAt).getTime() <= Date.now();
  const state =
    meet.status === 'open'
        ? { dot: Colors.success, text: 'Salle ouverte' }
        : { dot: Colors.danger, text: `Salle fermée${meet.closed_at ? ` à ${hhmm(meet.closed_at)}` : ''}` };

  const presences = meet.presences ?? [];
  const inside = presences.filter((p) => p.active).length;
  const canShow = started || presences.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: state.dot }]} />
        <Text style={styles.state}>{state.text}</Text>
        {canShow ? (
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setOpen((v) => !v)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
          >
            <Text style={[styles.toggleText, { color }]}>
              Présences{presences.length ? ` (${presences.length})` : ''}
              {inside ? ` · ${inside} dans la salle` : ''}
            </Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={color} />
          </TouchableOpacity>
        ) : null}
      </View>

      {canShow && open ? (
        <View style={styles.list}>
          {!meet.synced_at ? (
            <Text style={styles.muted}>Présences pas encore relevées : elles le sont toutes les 10 minutes environ.</Text>
          ) : presences.length === 0 ? (
            <Text style={styles.muted}>Personne ne s'est connecté pour le moment.</Text>
          ) : (
            presences.map((p, i) => (
              <View key={`${p.name}-${i}`} style={styles.person}>
                <View style={styles.personHead}>
                  <Ionicons
                    name={p.kind === 'phone' ? 'call-outline' : 'person-circle-outline'}
                    size={16}
                    color={p.active ? Colors.success : Colors.subtext2}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.total}>{p.active ? 'dans la salle' : duration(p.seconds)}</Text>
                </View>
                <Text style={styles.sessions}>
                  {p.sessions.map((s) => `${hhmm(s.joined_at)} → ${s.left_at ? hhmm(s.left_at) : '…'}`).join('   ')}
                </Text>
              </View>
            ))
          )}
          {meet.synced_at ? <Text style={styles.synced}>Relevé à {hhmm(meet.synced_at)}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  state: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.subtext2,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  toggleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  list: {
    gap: 6,
    padding: Spacings.sm,
    borderRadius: 10,
    backgroundColor: '#F4F6F9',
  },
  person: {
    gap: 1,
  },
  personHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  total: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  sessions: {
    marginLeft: 20,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  muted: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  synced: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext,
    textAlign: 'right',
  },
});
