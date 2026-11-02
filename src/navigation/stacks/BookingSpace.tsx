import React from 'react';

import { BookingTabs } from './BookingTabs';

/**
 * Version MOBILE : espace rendez-vous (Formations › Tutorat).
 * La version web (BookingSpace.web.tsx) y ajoute la messagerie flottante.
 */
export const BookingSpace = ({ navigation }) => <BookingTabs navigation={navigation} />;
