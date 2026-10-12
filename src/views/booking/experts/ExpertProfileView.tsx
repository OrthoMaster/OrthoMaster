import React, { useEffect, useRef, useState } from 'react';
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

import { BouncingDots } from '../../../component/LoadingDots';
import { getBookingExpert } from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { ExpertAvatar } from '../components/ExpertAvatar';
import { formatPrice } from '../bookingFormat';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';

/**
 * Profil natif d'un expert (la page vitrine web est réservée au navigateur) et choix du thème.
 * Une seule offre : elle est présélectionnée, le bouton mène directement au calendrier.
 */
export const ExpertProfileView = ({ navigation, route }) => {
  // Le bouton d'action est fixé en bas : la barre flottante lui laisse la place.
  useHideFloatingTabBar(navigation);

  const expertId: number = route.params?.expertId;
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });

  const offers = data?.offers ?? [];
  // Expert visible dans la liste mais sans réservation ouverte : profil consultable, pas de thème.
  const online = data?.expert.online !== false && offers.length > 0;

  useEffect(() => {
    if (offers.length === 1) setSelectedOfferId(offers[0].id);
  }, [offers.length]);

  // Bouton « Réserver » de la liste : une seule offre → calendrier directement, le profil
  // reste dessous pour le retour ; plusieurs offres → on s'arrête ici pour choisir le thème.
  const autoBookDone = useRef(false);
  useEffect(() => {
    if (!route.params?.autoBook || autoBookDone.current || !online || offers.length !== 1) return;
    autoBookDone.current = true;
    navigation.navigate('expert-calendar', { expertId, offerId: offers[0].id });
  }, [online, offers.length]);

  const goToCalendar = () => {
    if (!selectedOfferId) return;
    navigation.navigate('expert-calendar', { expertId, offerId: selectedOfferId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Expert" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.center}>
            <BouncingDots color={Colors.lblue} size={10} bounceHeight={5} />
          </View>
        ) : !data ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color={Colors.lblue} />
            <Text style={styles.unavailableTitle}>Expert indisponible</Text>
            <Text style={styles.unavailableText}>Cet expert n'accepte pas de rendez-vous pour le moment.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[Colors.lblue]} tintColor={Colors.lblue} />
              }
            >
              {/* ---- Profil ---- */}
              <View style={styles.hero}>
                <ExpertAvatar uri={data.expert.avatar_url} name={data.expert.name} size={104} ringWidth={4} />
                <Text style={styles.name}>{data.expert.name}</Text>
              </View>

              {data.expert.domains.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.blockLabel}>Domaines</Text>
                  <View style={styles.domains}>
                    {data.expert.domains.map((domain) => (
                      <View key={domain.id} style={styles.domainPill}>
                        <Text style={styles.domainText}>{domain.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!online && (
                <View style={styles.offline}>
                  <Ionicons name="moon-outline" size={20} color={Colors.subtext2} />
                  <Text style={styles.offlineText}>
                    Cet expert ne prend pas de rendez-vous pour le moment.
                  </Text>
                </View>
              )}

              {/* ---- Thèmes ---- */}
              {online && <Text style={styles.sectionTitle}>
                {offers.length > 1 ? 'Choisissez un thème' : "Thème de l'échange"}
              </Text>}

              {offers.map((offer) => {
                const selected = selectedOfferId === offer.id;
                const isExpanded = !!expanded[offer.id];

                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={[styles.offer, selected && styles.offerSelected]}
                    onPress={() => setSelectedOfferId(offer.id)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.offerTop}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                      </View>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                    </View>

                    {offer.description ? (
                      <>
                        <Text style={styles.offerDescription} numberOfLines={isExpanded ? undefined : 3}>
                          {offer.description}
                        </Text>
                        {offer.description.length > 140 && (
                          <TouchableOpacity
                            onPress={() => setExpanded((e) => ({ ...e, [offer.id]: !isExpanded }))}
                            hitSlop={8}
                          >
                            <Text style={styles.more}>{isExpanded ? 'Voir moins' : 'Voir plus'}</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : null}

                    <View style={styles.offerBottom}>
                      <View style={styles.duration}>
                        <Ionicons name="time-outline" size={16} color={Colors.lblueDark} />
                        <Text style={styles.durationText}>{offer.duration_label}</Text>
                      </View>
                      <Text style={styles.price}>{formatPrice(offer.price, offer.currency)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ---- Action ---- */}
            {online && <SafeAreaView edges={['bottom']} style={styles.footer}>
              <TouchableOpacity
                style={[styles.cta, !selectedOfferId && styles.ctaDisabled]}
                onPress={goToCalendar}
                disabled={!selectedOfferId}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.white} />
                <Text style={styles.ctaText}>
                  {selectedOfferId ? 'Choisir les demi-journées' : 'Choisissez un thème'}
                </Text>
              </TouchableOpacity>
            </SafeAreaView>}
          </>
        )}
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.xl,
  },
  content: {
    padding: Spacings.md,
    paddingBottom: Spacings.xl,
    gap: Spacings.sm,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  /* ---- Indisponible ---- */
  unavailableTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacings.sm,
  },
  unavailableText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },

  /* ---- Profil ---- */
  hero: {
    alignItems: 'center',
    paddingVertical: Spacings.md,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacings.sm,
  },
  blockLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginBottom: Spacings.xs,
  },
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  domainPill: {
    maxWidth: '100%',
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },

  /* ---- Indisponible (expert hors ligne) ---- */
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  offlineText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },

  /* ---- Thèmes ---- */
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.sm,
    marginLeft: Spacings.xxs,
  },
  offer: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  offerSelected: {
    borderColor: Colors.lblueDark,
  },
  offerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  radio: {
    width: 22,
    height: 22,
    marginTop: 2,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.disabledBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.lblueDark,
    backgroundColor: Colors.lblueDark,
  },
  offerTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  offerDescription: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
    marginTop: Spacings.xs,
  },
  more: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
    marginTop: Spacings.xxs,
  },
  offerBottom: {
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

  /* ---- Action ---- */
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
  },
  ctaDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  ctaText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});