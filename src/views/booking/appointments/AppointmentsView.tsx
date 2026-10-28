import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { MyBooking, getMyBookings } from '../../../services/v2/BookingService';
import { withAlpha } from '../bookingPalette';
import { APPOINTMENTS_ACCENT } from './appointmentFormat';
import { AppointmentCard } from './components/AppointmentCard';

const LIST_PADDING = Spacings.lg;

export const MY_BOOKINGS_KEY = ['booking', 'requests'];

/**
 * Rendez-vous de l'utilisateur : demandes en attente de réponse, puis rendez-vous
 * confirmés à venir. Le passé et les demandes closes sont dans l'historique (bouton
 * en haut à droite). Rechargé à chaque retour sur l'onglet : l'expert a pu répondre.
 */
export const AppointmentsView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: MY_BOOKINGS_KEY,
    queryFn: async () => {
      const result = await getMyBookings();
      if (!result) throw new Error('bookings');
      return result;
    },
  });

  // Rechargement silencieux au retour sur l'écran (l'expert a pu répondre).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Indicateur réservé au tirage manuel : piloté par isRefetching, il s'affichait à chaque
  // retour sur l'écran et, sur iOS, décalait la liste vers le bas (saut, grand blanc en haut).
  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const sections = [
    { key: 'pending', title: 'En attente de réponse', data: data?.pending ?? [] },
    { key: 'upcoming', title: 'À venir', data: data?.upcoming ?? [] },
  ].filter((section) => section.data.length > 0);

  const openBooking = (booking: MyBooking) =>
    navigation.navigate('appointment-detail', { bookingId: booking.id, preview: booking });

  const header = (
    <View style={styles.head}>
      <Text style={styles.title}>Mes rendez-vous</Text>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('appointments-history')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Historique de mes rendez-vous"
      >
        <MaterialCommunityIcons name="history" size={24} color={APPOINTMENTS_ACCENT} />
      </TouchableOpacity>
    </View>
  );

  const empty = isLoading ? (
    <View style={styles.loading}>
      <BouncingDots color={APPOINTMENTS_ACCENT} size={10} bounceHeight={5} />
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={styles.emptyMedallion}>
        <MaterialCommunityIcons
          name={isError ? 'wifi-off' : 'calendar-blank-outline'}
          size={40}
          color={APPOINTMENTS_ACCENT}
        />
      </View>
      <Text style={styles.emptyTitle}>{isError ? 'Chargement impossible' : 'Aucun rendez-vous en cours'}</Text>
      <Text style={styles.emptyText}>
        {isError
          ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
          : 'Vos demandes et vos prochains rendez-vous apparaîtront ici.'}
      </Text>
      {!isError && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.getParent('booking-tabs')?.navigate('booking-experts')}
          activeOpacity={0.85}
        >
          <Ionicons name="people-outline" size={18} color={Colors.white} />
          <Text style={styles.emptyButtonText}>Trouver un expert</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <AppointmentCard booking={item} onPress={() => openBooking(item)} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>
            {section.title} <Text style={styles.sectionCount}>({section.data.length})</Text>
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + Spacings.md }]}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={pullToRefresh}
            colors={[APPOINTMENTS_ACCENT]}
            tintColor={APPOINTMENTS_ACCENT}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  list: {
    paddingHorizontal: LIST_PADDING,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
  },
  separator: {
    height: Spacings.md,
  },

  /* ---- En-tête ---- */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xs,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
  },
  historyButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: withAlpha(APPOINTMENTS_ACCENT, 0.45),
    backgroundColor: withAlpha(APPOINTMENTS_ACCENT, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm,
  },
  sectionCount: {
    color: APPOINTMENTS_ACCENT,
  },

  /* ---- État vide ---- */
  empty: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
  },
  emptyMedallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: withAlpha(APPOINTMENTS_ACCENT, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 48,
    paddingHorizontal: Spacings.lg,
    borderRadius: 999,
    backgroundColor: APPOINTMENTS_ACCENT,
    marginTop: Spacings.lg,
  },
  emptyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
});