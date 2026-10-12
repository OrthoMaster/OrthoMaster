import { createContext, useContext, useEffect, useId } from 'react';
import { Alert, Platform } from 'react-native';

/**
 * Chaque écran de l'espace rendez-vous signale s'il a une saisie en cours.
 * BookingTabs ne demande confirmation avant de sortir que si au moins un écran
 * l'a signalé : sortir sans rien perdre ne doit pas coûter un clic de plus.
 */
export interface BookingExitGuard {
  setDirty: (key: string, dirty: boolean) => void;
}

export const BookingExitGuardContext = createContext<BookingExitGuard | null>(null);

/**
 * À appeler dans un écran avec un formulaire ou une sélection en cours.
 * Le signal est retiré automatiquement quand l'écran disparaît.
 */
export const useBookingDirty = (dirty: boolean) => {
  const guard = useContext(BookingExitGuardContext);
  const key = useId();

  useEffect(() => {
    guard?.setDirty(key, dirty);
    return () => guard?.setDirty(key, false);
  }, [guard, key, dirty]);
};

/** Alert.alert n'affiche pas de boutons sur le web : confirm natif du navigateur à la place. */
export const confirmLeaveBooking = (): Promise<boolean> => {
  const title = 'Quitter les rendez-vous ?';
  const message = 'Votre saisie en cours sera perdue.';

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Rester', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Quitter', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
};