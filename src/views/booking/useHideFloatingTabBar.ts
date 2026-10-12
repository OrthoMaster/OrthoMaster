import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Masque la barre flottante pendant qu'un écran de saisie a le focus : le clavier
 * et le bouton Enregistrer ont la place. Rétablie dès que l'écran perd le focus.
 * Par id : depuis une pile imbriquée, getParent() seul viserait la pile, pas les onglets.
 */
export const useHideFloatingTabBar = (navigation: any) => {
  useFocusEffect(
    useCallback(() => {
      const tabs = navigation.getParent('booking-tabs');
      tabs?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => tabs?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );
};