import React from 'react';
import { View, StyleSheet } from 'react-native';

import { BookingTabs } from './BookingTabs';
import { ChatDock } from '../../views/booking/messages/ChatDock.web';

/**
 * Version WEB : espace rendez-vous, ouvert depuis Formations › Tutorat.
 *
 * Porte aussi la messagerie web (ChatDock) : elle flotte au-dessus des écrans de l'espace.
 */
export const BookingSpace = ({ navigation }) => (
  <View style={styles.flex}>
    <BookingTabs navigation={navigation} />
    {/* Messagerie à la Facebook : panneau à droite et fenêtres en bas à droite, par-dessus la page. */}
    <ChatDock />
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
