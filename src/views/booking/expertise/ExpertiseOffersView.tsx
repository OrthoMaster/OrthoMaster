import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ExpertBookingSetup, ExpertOwnOffer, getMyBookingSetup } from '../../../services/v2/BookingService';
import { BookingHeaderButton, BookingScreenHeader } from '../components/BookingScreenHeader';
import { formatPrice } from '../bookingFormat';

const QUERY_KEY = ['booking', 'me'];

/**
 * Offres de l'expert. Les données viennent du cache ['booking', 'me'] :
 * le formulaire y écrit l'état renvoyé par le serveur, cette liste se met à jour seule.
 */
export const ExpertiseOffersView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();

  const { data, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMyBookingSetup(),
  });

  const offers: ExpertOwnOffer[] = data?.is_expert ? (data as ExpertBookingSetup).offers : [];

  const openForm = (offerId?: number) => navigation.navigate('expertise-offer-form', { offerId });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader
        title="Offres"
        onBack={() => navigation.goBack()}
        right={<BookingHeaderButton icon="add" label="Créer une offre" onPress={() => openForm()} />}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + Spacings.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[Colors.lblue]} tintColor={Colors.lblue} />
        }
      >
        {offers.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMedallion}>
              <MaterialCommunityIcons name="tag-plus-outline" size={40} color={Colors.lblueDark} />
            </View>
            <Text style={styles.emptyTitle}>Aucune offre</Text>
            <Text style={styles.emptyText}>
              Une offre décrit un thème d'échange, sa durée et son prix. Vos confrères choisissent
              une offre avant de réserver.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => openForm()} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Créer une offre</Text>
            </TouchableOpacity>
          </View>
        ) : (
          offers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={[styles.card, !offer.active_flg && styles.cardInactive]}
              onPress={() => openForm(offer.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {offer.title}
                </Text>
                <View style={[styles.statusPill, offer.active_flg ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusText, offer.active_flg ? styles.statusTextOn : styles.statusTextOff]}>
                    {offer.active_flg ? 'Active' : 'Masquée'}
                  </Text>
                </View>
              </View>

              {offer.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {offer.description}
                </Text>
              ) : null}

              <View style={styles.cardBottom}>
                <View style={styles.duration}>
                  <Ionicons name="time-outline" size={16} color={Colors.lblueDark} />
                  <Text style={styles.durationText}>{offer.duration_label}</Text>
                </View>
                <Text style={styles.price}>{formatPrice(offer.price, offer.currency)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    gap: Spacings.sm,
  },

  /* ---- Carte d'offre ---- */
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  // Masquée : toujours modifiable, mais visiblement en retrait.
  cardInactive: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  cardDescription: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
    marginTop: Spacings.xxs,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacings.sm,
    paddingTop: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  durationText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  price: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },

  /* ---- Statut ---- */
  statusPill: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxxs,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusOn: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBackground,
  },
  statusOff: {
    borderColor: Colors.disabledBackground,
    backgroundColor: Colors.grayLight,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  statusTextOn: {
    color: Colors.success,
  },
  statusTextOff: {
    color: Colors.gray,
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
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
  },
  primaryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
});