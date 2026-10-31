import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useBookingDirty } from '../BookingExitGuard';
import { useBookingSetup } from '../useBookingSetup';
import { confirmAction } from '../bookingActions';
import { WEB_MAX_WIDTH, WEB_SINGLE_MAX_WIDTH, useAvailabilityLayout } from './availability/availabilityLayout';
import { WeekTab } from './availability/WeekTab';
import { ExceptionsTab } from './availability/ExceptionsTab';

type AvailabilityTab = 'week' | 'exceptions';

/**
 * Disponibilités de l'expert : semaine type avec ses horaires et délais, puis exceptions datées.
 * Les deux onglets restent montés : passer de l'un à l'autre ne perd pas une saisie d'horaires.
 *
 * Web : en-tête large ; sur grand écran, chaque onglet passe sur deux colonnes
 * (Semaine : horaires et délais | semaine type ; Exceptions : calendrier | liste).
 */
export const ExpertiseAvailabilityView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { setup, apply } = useBookingSetup();
  const [tab, setTab] = useState<AvailabilityTab>('week');
  const [weekDirty, setWeekDirty] = useState(false);
  const layout = useAvailabilityLayout();

  // Sortie de l'espace rendez-vous (bouton Retour de la barre) avec des horaires non enregistrés.
  useBookingDirty(weekDirty);

  // Retour à l'écran Expertise avec des horaires non enregistrés.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!weekDirty) return;

      e.preventDefault();
      // confirm du navigateur sur le web (Alert.alert y est sans effet).
      confirmAction(
        'Horaires non enregistrés',
        'Vos modifications seront perdues.',
        'Quitter',
        () => navigation.dispatch(e.data.action),
        { destructive: true, cancelText: 'Rester' }
      );
    });
  }, [navigation, weekDirty]);

  if (!setup) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Disponibilités" onBack={() => navigation.goBack()} webLarge />

      <View style={styles.body}>
        <View
          style={[
            styles.tabs,
            layout !== 'mobile' && styles.tabsWeb,
            layout === 'webTwo' && styles.tabsWebTwo,
            layout === 'webOne' && styles.tabsWebOne,
          ]}
        >
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
          <WeekTab setup={setup} apply={apply} onDirtyChange={setWeekDirty} bottomInset={bottomInset} layout={layout} />
        </View>
        <View style={[styles.pane, tab !== 'exceptions' && styles.hidden]}>
          <ExceptionsTab setup={setup} apply={apply} bottomInset={bottomInset} layout={layout} />
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
  // Web : onglets alignés sur la largeur du contenu.
  tabsWeb: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  tabsWebTwo: {
    maxWidth: WEB_MAX_WIDTH + Spacings.lg * 2,
  },
  tabsWebOne: {
    maxWidth: WEB_SINGLE_MAX_WIDTH + Spacings.lg * 2,
  },
  pane: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});