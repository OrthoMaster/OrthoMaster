import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookedLocation } from '../../../services/v2/BookingService';
import { withAlpha } from '../bookingPalette';

interface BlockPlaceProps {
  location: BookedLocation;
  /** Couleur du bouton Itinéraire. */
  color?: string;
}

/**
 * Lieu d'une demi-journée en présentiel, tel qu'il était à la réservation :
 * nom, adresse, informations d'accès (renvoyées seulement une fois le rendez-vous accepté)
 * et lien Itinéraire vers Google Maps.
 */
export const BlockPlace: React.FC<BlockPlaceProps> = ({ location, color = Colors.lblueDark }) => {
  const cityLine = [location.postal_code, location.city].filter(Boolean).join(' ');

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Ionicons name="location-outline" size={15} color={color} />
        <View style={styles.flex}>
          {location.label ? (
            <Text style={styles.label} numberOfLines={1}>
              {location.label}
            </Text>
          ) : null}
          {location.address_line ? <Text style={styles.address}>{location.address_line}</Text> : null}
          {cityLine ? <Text style={styles.address}>{cityLine}</Text> : null}
        </View>
        {location.maps_url ? (
          <TouchableOpacity
            style={[styles.route, { borderColor: withAlpha(color, 0.45) }]}
            onPress={() => Linking.openURL(location.maps_url).catch(() => {})}
            hitSlop={6}
            accessibilityRole="link"
            accessibilityLabel="Itinéraire"
          >
            <Ionicons name="navigate-outline" size={13} color={color} />
            <Text style={[styles.routeText, { color }]}>Itinéraire</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {location.access_details ? (
        <View style={styles.access}>
          <Ionicons name="key-outline" size={14} color={Colors.subtext} />
          <Text style={styles.accessText}>{location.access_details}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrap: {
    gap: Spacings.xxs,
    marginTop: Spacings.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  address: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
    paddingHorizontal: Spacings.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  routeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  access: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    paddingLeft: 1,
  },
  accessText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text,
  },
});
