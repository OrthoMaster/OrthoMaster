import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { BouncingDots } from '../../component/LoadingDots';
import { FloatingTabBar } from '../../component/booking/FloatingTabBar';
import { ExpertAvatarIcon } from '../../component/booking/ExpertAvatarIcon';
import { getMyBookingSetup } from '../../services/v2/BookingService';
import { BookingExitGuardContext, confirmLeaveBooking } from '../../views/booking/BookingExitGuard';
import { BookingComingSoonView } from '../../views/booking/BookingComingSoonView';
import { ExpertiseStack } from './ExpertiseStack';
import { ExpertsStack } from './ExpertsStack';

const BookingTab = createBottomTabNavigator();

/**
 * Espace rendez-vous : écran « booking » de TrainingStack.
 *
 * Il remplace la barre de l'application par sa propre barre flottante, dont le premier
 * bouton ramène aux formations. Les onglets dépendent du rôle : un expert gère ses
 * demandes et ses disponibilités, un utilisateur cherche un expert et suit ses rendez-vous.
 */
export const BookingTabs = ({ navigation }) => {
  const { data: setup, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['booking', 'me'],
    queryFn: () => getMyBookingSetup(),
    retry: 1,
  });

  // Par id : depuis les onglets imbriqués, getParent() sans id renverrait notre propre navigateur.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent('main-tabs')?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }, [navigation])
  );

  /* ---- Garde de sortie ---- */
  const dirtyKeys = useRef(new Set<string>());

  const guard = useMemo(
    () => ({
      setDirty: (key: string, dirty: boolean) => {
        if (dirty) {
          dirtyKeys.current.add(key);
        } else {
          dirtyKeys.current.delete(key);
        }
      },
    }),
    []
  );

  // beforeRemove couvre le bouton « Formations », le retour Android et le geste iOS :
  // un seul endroit pour décider s'il faut confirmer.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (dirtyKeys.current.size === 0) return;

      e.preventDefault();
      confirmLeaveBooking().then((leave) => {
        if (leave) {
          dirtyKeys.current.clear();
          navigation.dispatch(e.data.action);
        }
      });
    });
  }, [navigation]);

  const exit = useCallback(() => navigation.goBack(), [navigation]);

  /* ---- Chargement / erreur ---- */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.state} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
        <BouncingDots color={Colors.white} size={10} bounceHeight={5} />
      </SafeAreaView>
    );
  }

  if (!setup) {
    return (
      <SafeAreaView style={styles.state} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.white} />
        <Text style={styles.stateTitle}>Erreur de chargement</Text>
        <Text style={styles.stateMessage}>Impossible de charger l'espace rendez-vous.</Text>

        <View style={styles.stateActions}>
          <TouchableOpacity style={styles.stateButton} onPress={() => refetch()} disabled={isFetching}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.stateButtonText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stateButton, styles.stateButtonGhost]} onPress={exit}>
            <Text style={styles.stateButtonText}>Retour aux formations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ---- Onglets ---- */
  const tabIcon = (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

  return (
    <BookingExitGuardContext.Provider value={guard}>
      <BookingTab.Navigator
        id={'booking-tabs' as undefined}
        // Le retour ne passe pas d'onglet en onglet : il remonte à beforeRemove pour sortir.
        backBehavior="none"
        tabBar={(props) => <FloatingTabBar {...props} onExit={exit} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: Platform.OS === 'web' ? 'top' : 'bottom',
        }}
      >
        {setup.is_expert ? (
          <>
            <BookingTab.Screen
              name="booking-requests"
              component={BookingComingSoonView}
              initialParams={{
                title: 'Demandes',
                icon: 'email-outline',
                description: 'Les demandes de rendez-vous à accepter ou refuser apparaîtront ici.',
              }}
              options={{
                title: 'Demandes',
                tabBarIcon: tabIcon('mail-outline'),
                tabBarActiveTintColor: Colors.primary,
                // Phase 3 : nombre de demandes en attente ; la barre affiche une pastille dès qu'il dépasse 0.
                tabBarBadge: undefined,
              }}
            />
            <BookingTab.Screen
              name="booking-agenda"
              component={BookingComingSoonView}
              initialParams={{
                title: 'Agenda',
                icon: 'calendar-month-outline',
                description: 'Vos rendez-vous acceptés et le lien de la visio apparaîtront ici.',
              }}
              options={{ title: 'Agenda', tabBarIcon: tabIcon('calendar-outline'), tabBarActiveTintColor: Colors.purple }}
            />
            <BookingTab.Screen
              name="booking-expertise"
              component={ExpertiseStack}
              options={{
                title: 'Expertise',
                tabBarActiveTintColor: Colors.lblueDark,
                tabBarIcon: ({ focused, size }) => (
                  <ExpertAvatarIcon
                    uri={setup.expert.avatar_url}
                    name={setup.expert.name}
                    size={size}
                    focused={focused}
                  />
                ),
              }}
            />
          </>
        ) : (
          <>
            <BookingTab.Screen
              name="booking-experts"
              component={ExpertsStack}
              options={{ title: 'Experts', tabBarIcon: tabIcon('people-outline'), tabBarActiveTintColor: Colors.lblueDark }}
            />
            <BookingTab.Screen
              name="booking-appointments"
              component={BookingComingSoonView}
              initialParams={{
                title: 'Mes rendez-vous',
                icon: 'calendar-check-outline',
                description: 'Le suivi de vos demandes et vos prochains rendez-vous apparaîtront ici.',
              }}
              options={{ title: 'Rendez-vous', tabBarIcon: tabIcon('calendar-outline'), tabBarActiveTintColor: Colors.purple }}
            />
          </>
        )}
      </BookingTab.Navigator>
    </BookingExitGuardContext.Provider>
  );
};

const styles = StyleSheet.create({
  /* ---- Chargement / erreur ---- */
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.lblue,
  },
  stateTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: Colors.white,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  stateMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.xl,
  },
  stateActions: {
    gap: Spacings.sm,
    alignItems: 'stretch',
  },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    backgroundColor: Colors.lblueDark,
  },
  stateButtonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  stateButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.white,
  },
});