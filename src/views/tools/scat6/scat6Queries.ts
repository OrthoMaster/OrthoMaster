import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';

/** Clés react-query de l'espace SCAT6. */
export const SCAT6_PATIENTS_KEY = ['scat6', 'patients'];
export const SCAT6_EXAMS_KEY = ['scat6', 'exams'];
export const scat6PatientKey = (id: number) => ['scat6', 'patient', id];
export const scat6ExamKey = (uuid: string) => ['scat6', 'exam', uuid];

/** Après une création, une sauvegarde ou une signature : listes et fiches relues. */
export const invalidateScat6 = (client: QueryClient) => client.invalidateQueries({ queryKey: ['scat6'] });

/**
 * Masque la barre d'onglets flottante pendant qu'un écran a le focus (examen en cours).
 * Compteur plutôt que bascule : le « rétablir » de l'écran quitté peut passer après le « masquer » du suivant.
 */
let hiders = 0;
export const useHideScat6TabBar = (navigation: any) => {
  useFocusEffect(
    useCallback(() => {
      const tabs = navigation.getParent('scat6-tabs');
      hiders += 1;
      tabs?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        hiders = Math.max(0, hiders - 1);
        if (hiders === 0) tabs?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );
};

/** Ouvre un écran de la pile Patients depuis n'importe quel onglet de l'espace. */
export const openInPatients = (navigation: any, screen: 'scat6-patient' | 'scat6-exam' | 'scat6-report', params: object) => {
  navigation.navigate('scat6-patients-tab', { screen, params, initial: false });
};
