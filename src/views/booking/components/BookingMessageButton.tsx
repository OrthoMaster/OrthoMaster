import React, { useState } from 'react';
import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';

import { getConversationByBooking } from '../../../services/v2/BookingService';
import { notify } from '../bookingActions';
import { withAlpha } from '../bookingPalette';
// Mobile : écran de conversation ; web : fenêtre flottante (openConversation.web.ts).
import { openConversation } from '../messages/openConversation';

interface BookingMessageButtonProps {
  bookingId: number;
  navigation: any;
  color: string;
  /** Pour l'accessibilité : « Écrire à … ». */
  name: string;
}

/**
 * Bouton rond « écrire » d'une demande / d'un rendez-vous (mobile et web) : ouvre le fil avec
 * l'autre partie (le même pour tous les rendez-vous du couple).
 */
export const BookingMessageButton: React.FC<BookingMessageButtonProps> = ({ bookingId, navigation, color, name }) => {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (loading) return;
    setLoading(true);
    const result = await getConversationByBooking(bookingId);
    setLoading(false);
    if (result.ok === false) {
      notify('Conversation indisponible', result.message ?? 'Vérifiez votre connexion puis réessayez.');
      return;
    }
    openConversation(navigation, result.data);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, { borderColor: withAlpha(color, 0.45) }, pressed && styles.pressed]}
      onPress={open}
      disabled={loading}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`Écrire à ${name}`}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : <Ionicons name="chatbubble-ellipses-outline" size={20} color={color} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
