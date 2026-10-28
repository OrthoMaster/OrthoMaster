import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Nombre d'écrans qui demandent à masquer la barre flottante.
 * Compteur plutôt que bascule : en passant d'un écran masquant à un autre (profil → détail
 * d'un thème → calendrier), le « rétablir » de l'écran quitté peut s'exécuter APRÈS le
 * « masquer » du nouvel écran ; avec une simple bascule, la barre réapparaissait.
 */
let hiders = 0;

/**
 * Masque la barre flottante pendant qu'un écran a le focus ; elle ne revient que lorsque
 * plus aucun écran ne le demande.
 * Par id : depuis une pile imbriquée, getParent() seul viserait la pile, pas les onglets.
 */
export const useHideFloatingTabBar = (navigation: any) => {
  useFocusEffect(
    useCallback(() => {
      const tabs = navigation.getParent('booking-tabs');
      hiders += 1;
      tabs?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        hiders = Math.max(0, hiders - 1);
        if (hiders === 0) {
          tabs?.setOptions({ tabBarStyle: undefined });
        }
      };
    }, [navigation])
  );
};