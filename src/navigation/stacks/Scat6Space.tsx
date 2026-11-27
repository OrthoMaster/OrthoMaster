import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../constants/Colors';
import { FloatingTabBar } from '../../component/booking/FloatingTabBar';
import { useGetUser } from '../../hooks/auth.hook';
import { Scat6PatientsView } from '../../views/tools/scat6/Scat6PatientsView';
import { Scat6PatientView } from '../../views/tools/scat6/Scat6PatientView';
import { Scat6ExamsView } from '../../views/tools/scat6/Scat6ExamsView';
import { Scat6GuideView } from '../../views/tools/scat6/Scat6GuideView';
import { Scat6ReportView } from '../../views/tools/scat6/Scat6ReportView';
import { Scat6ExamView } from '../../views/tools/scat6/exam/Scat6ExamView';
import { Scat6RtsView } from '../../views/tools/scat6/rts/Scat6RtsView';
import { Scat6DialogHost } from '../../views/tools/scat6/components/Scat6Dialog';
import { Scat6Empty, Scat6Loading, Scat6Button } from '../../views/tools/scat6/components/Scat6UI';
import { SCAT } from '../../views/tools/scat6/scat6Theme';
import { getScat6Assessments } from '../../services/v2/Scat6Service';
import { SCAT6_EXAMS_KEY } from '../../views/tools/scat6/scat6Queries';

const Scat6Tab = createBottomTabNavigator();
const PatientsStackNav = createStackNavigator();
const ExamsStackNav = createStackNavigator();

/** Patients : liste, fiche, examen, rapport, retour au sport (examen et rapport s'ouvrent aussi depuis Examens). */
const PatientsStack = () => (
  <PatientsStackNav.Navigator id={'scat6-patients-stack' as undefined} screenOptions={{ headerShown: false }}>
    <PatientsStackNav.Screen name="scat6-patients" component={Scat6PatientsView} options={{ title: 'Patients' }} />
    {/* Un écran par patient : remonter à « sa » fiche ne réutilise pas celle d'un autre patient. */}
    <PatientsStackNav.Screen
      name="scat6-patient"
      component={Scat6PatientView}
      options={{ title: 'Patient' }}
      getId={({ params }: any) => (params?.patientId ? String(params.patientId) : undefined)}
    />
    <PatientsStackNav.Screen name="scat6-exam" component={Scat6ExamView} options={{ title: 'Examen SCAT6' }} />
    <PatientsStackNav.Screen name="scat6-report" component={Scat6ReportView} options={{ title: 'Rapport SCAT6' }} />
    <PatientsStackNav.Screen name="scat6-rts" component={Scat6RtsView} options={{ title: 'Retour au sport' }} />
  </PatientsStackNav.Navigator>
);

const ExamsStack = () => (
  <ExamsStackNav.Navigator id={'scat6-exams-stack' as undefined} screenOptions={{ headerShown: false }}>
    <ExamsStackNav.Screen name="scat6-exams" component={Scat6ExamsView} options={{ title: 'Examens' }} />
  </ExamsStackNav.Navigator>
);

/**
 * Espace SCAT6 (Outils › SCAT6) — version WEB, médecins seulement (compte non étudiant).
 *
 * Comme l'espace rendez-vous, il a sa propre barre flottante, dont le premier bouton ramène
 * aux Outils : Patients, Examens (brouillons et signés), Protocole (aide-mémoire).
 */
export const Scat6Space = ({ navigation }: { navigation: any }) => {
  const { data: user, isLoading } = useGetUser();
  const isDoctor = !!user && user.student_flg !== true;

  // Brouillons en cours : pastille de l'onglet Examens.
  const { data: exams } = useQuery({
    queryKey: SCAT6_EXAMS_KEY,
    queryFn: getScat6Assessments,
    enabled: isDoctor,
    refetchInterval: 60 * 1000,
  });
  const drafts = exams?.filter((e) => e.status === 'draft').length ?? 0;

  // Retour : toujours aux Outils (écran parent), même ouvert par un lien direct.
  const exit = useCallback(() => navigation.popTo('tools-home'), [navigation]);

  useEffect(() => {
    // Sans compte médecin, l'outil n'existe pas : retour aux Outils (lien direct d'un compte étudiant).
    if (!isLoading && user && !isDoctor) exit();
  }, [isLoading, user, isDoctor]);

  if (isLoading || !user) return <Scat6Loading />;
  if (!isDoctor) {
    return (
      <View style={styles.page}>
        <Scat6Empty
          icon="lock-closed-outline"
          title="Outil réservé aux médecins"
          message="Le SCAT6 n’est pas disponible pour les comptes étudiants."
          action={<Scat6Button title="Retour aux outils" variant="secondary" onPress={exit} />}
        />
      </View>
    );
  }

  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: string; size: number }) =>
      <Ionicons name={name} size={size} color={color} />;

  return (
    <View style={styles.page}>
      <Scat6Tab.Navigator
        id={'scat6-tabs' as undefined}
        initialRouteName="scat6-patients-tab"
        backBehavior="none"
        tabBar={(props) => <FloatingTabBar {...props} onExit={exit} exitLabel="Retour aux outils" />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: SCAT.page } } as any}
      >
        <Scat6Tab.Screen
          name="scat6-patients-tab"
          component={PatientsStack}
          options={{ title: 'Patients', tabBarIcon: icon('people-outline'), tabBarActiveTintColor: Colors.blue }}
        />
        <Scat6Tab.Screen
          name="scat6-exams-tab"
          component={ExamsStack}
          options={{
            title: 'Examens',
            tabBarIcon: icon('clipboard-outline'),
            tabBarActiveTintColor: SCAT.blueDark,
            tabBarBadge: drafts > 0 ? drafts : undefined,
          }}
        />
        <Scat6Tab.Screen
          name="scat6-guide-tab"
          component={Scat6GuideView}
          options={{ title: 'Protocole', tabBarIcon: icon('book-outline'), tabBarActiveTintColor: Colors.blueDark2 }}
        />
      </Scat6Tab.Navigator>
      <Scat6DialogHost />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
});
