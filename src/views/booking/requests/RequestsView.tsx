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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ExpertRequest, getExpertRequests } from '../../../services/v2/BookingService';
import { accentOf, withAlpha } from '../bookingPalette';
import { useBookingSetup } from '../useBookingSetup';
import { REQUESTS_ACCENT } from './requestFormat';
import { RequestCard } from './components/RequestCard';

const LIST_PADDING = Spacings.lg;

/** Partagé avec la pastille de l'onglet (BookingTabs) : un seul appel, une seule source. */
export const EXPERT_REQUESTS_KEY = ['booking', 'expert-requests'];

/**
 * Demandes reçues par l'expert, sans réponse, la plus urgente d'abord.
 * Les demandes traitées sont dans l'historique (bouton en haut à droite) ; les
 * rendez-vous acceptés à venir relèvent de l'onglet Agenda.
 * Rechargé à chaque retour sur l'onglet : une demande a pu arriver ou être retirée.
 */
export const RequestsView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { setup } = useBookingSetup();
  const accent = accentOf(setup?.expert?.palette_color);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: EXPERT_REQUESTS_KEY,
    queryFn: async () => {
      const result = await getExpertRequests();
      if (!result) throw new Error('requests');
      return result;
    },
  });

  // Rechargement silencieux au retour sur l'écran.
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

  const sections = [{ key: 'pending', title: 'À traiter', data: data?.pending ?? [] }].filter(
    (section) => section.data.length > 0
  );

  const openRequest = (request: ExpertRequest) =>
    navigation.navigate('request-detail', { bookingId: request.id, preview: request });

  const header = (
    <View style={styles.head}>
      <Text style={styles.title}>Demandes</Text>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('requests-history')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Historique des demandes"
      >
        <MaterialCommunityIcons name="history" size={24} color={REQUESTS_ACCENT} />
      </TouchableOpacity>
    </View>
  );

  const empty = isLoading ? (
    <View style={styles.loading}>
      <BouncingDots color={REQUESTS_ACCENT} size={10} bounceHeight={5} />
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={styles.emptyMedallion}>
        <MaterialCommunityIcons
          name={isError ? 'wifi-off' : 'email-open-outline'}
          size={40}
          color={REQUESTS_ACCENT}
        />
      </View>
      <Text style={styles.emptyTitle}>{isError ? 'Chargement impossible' : 'Aucune demande à traiter'}</Text>
      <Text style={styles.emptyText}>
        {isError
          ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
          : 'Les nouvelles demandes de rendez-vous apparaîtront ici. Vous serez notifié à leur arrivée.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <RequestCard request={item} accent={accent} onPress={() => openRequest(item)} />}
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
            colors={[REQUESTS_ACCENT]}
            tintColor={REQUESTS_ACCENT}
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
    borderColor: withAlpha(REQUESTS_ACCENT, 0.45),
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.1),
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
    color: REQUESTS_ACCENT,
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
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.12),
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
});