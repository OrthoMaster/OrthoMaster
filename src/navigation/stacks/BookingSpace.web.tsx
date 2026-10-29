import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getMyBookingSetup } from '../../services/v2/BookingService';
import BookingIntroModal, { BOOKING_INTRO_STORAGE_KEY } from '../../views/booking/components/BookingIntroModal';
import { BookingTabs } from './BookingTabs';

/**
 * Version WEB : espace rendez-vous ouvert depuis la barre latérale (« Rendez-vous »),
 * et non plus depuis une carte de la page Formations comme sur mobile.
 *
 * Même règle que la carte mobile : l'utilisateur (non expert) voit l'introduction
 * à sa première visite, sauf s'il a coché « ne plus afficher ».
 * Ici il est déjà dans l'espace : fermer ou continuer referme simplement l'introduction.
 */
export const BookingSpace = ({ navigation }) => {
  const { data: setup } = useQuery({
    queryKey: ['booking', 'me'],
    queryFn: () => getMyBookingSetup(),
    staleTime: 60 * 1000,
  });
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!setup || setup.is_expert) return;

    let cancelled = false;
    AsyncStorage.getItem(BOOKING_INTRO_STORAGE_KEY)
      .catch(() => null)
      .then((neverShow) => {
        if (!cancelled && neverShow !== 'true') setShowIntro(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setup?.is_expert]);

  return (
    <View style={styles.flex}>
      <BookingTabs navigation={navigation} />
      <BookingIntroModal
        visible={showIntro}
        onClose={() => setShowIntro(false)}
        onContinue={() => setShowIntro(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
