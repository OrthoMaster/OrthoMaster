import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useBookingDirty } from '../BookingExitGuard';
import { useBookingSetup } from '../useBookingSetup';
import { WeekTab } from './availability/WeekTab';
import { ExceptionsTab } from './availability/ExceptionsTab';

type AvailabilityTab = 'week' | 'exceptions';

/**
 * Disponibilités de l'expert : semaine type avec ses horaires et délais, puis exceptions datées.
 * Les deux onglets restent montés : passer de l'un à l'autre ne perd pas une saisie d'horaires.
 */
export const ExpertiseAvailabilityView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { setup, apply } = useBookingSetup();
  const [tab, setTab] = useState<AvailabilityTab>('week');
  const [weekDirty, setWeekDirty] = useState(false);

  // Sortie de l'espace rendez-vous (bouton Retour de la barre) avec des horaires non enregistrés.
  useBookingDirty(weekDirty);

  // Retour à l'écran Expertise avec des horaires non enregistrés.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!weekDirty) return;

      e.preventDefault();
      Alert.alert('Horaires non enregistrés', 'Vos modifications seront perdues.', [
        { text: 'Rester', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, weekDirty]);

  if (!setup) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Disponibilités" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <View style={styles.tabs}>
          <SegmentedTabs
            tabs={[
              { key: 'week', label: 'Semaine' },
              { key: 'exceptions', label: 'Exceptions', badge: setup.exceptions.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        <View style={[styles.pane, tab !== 'week' && styles.hidden]}>
          <WeekTab setup={setup} apply={apply} onDirtyChange={setWeekDirty} bottomInset={bottomInset} />
        </View>
        <View style={[styles.pane, tab !== 'exceptions' && styles.hidden]}>
          <ExceptionsTab setup={setup} apply={apply} bottomInset={bottomInset} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  tabs: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
  },
  pane: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});