import { Alert, Platform, Share } from 'react-native';

import { showBookingDialog } from './components/BookingDialog';

/**
 * Message à l'utilisateur : boîte de dialogue de l'espace rendez-vous (mobile et web) ;
 * hors de l'espace, alerte du système (navigateur sur le web).
 */
export const notify = (title: string, message?: string | null) => {
  if (showBookingDialog({ title, message })) return;
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message ?? undefined);
};

/**
 * Confirmation avant une action : boîte de dialogue de l'espace rendez-vous (mobile et web),
 * à défaut confirm du navigateur / Alert.alert.
 * `destructive` : bouton rouge et « Annuler » libellé selon le contexte (cancelText).
 */
export const confirmAction = (
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  options: { destructive?: boolean; cancelText?: string } = {}
) => {
  const shown = showBookingDialog({
    title,
    message,
    buttons: [
      { text: options.cancelText ?? 'Annuler', style: 'cancel' },
      { text: confirmText, style: options.destructive ? 'destructive' : 'default', onPress: onConfirm },
    ],
  });
  if (shown) return;
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: options.cancelText ?? 'Annuler', style: 'cancel' },
    { text: confirmText, style: options.destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
};

/**
 * Partage d'un lien.
 * Web : feuille de partage du navigateur si elle existe (mobile), sinon copie dans le presse-papiers (bureau).
 * iOS lit `url`, Android ne lit que `message` : chacun reçoit le champ qu'il affiche.
 */
export const shareLink = async (url: string, title?: string) => {
  if (Platform.OS === 'web') {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;

    if (nav?.share) {
      try {
        await nav.share({ title, url });
      } catch (e) { }
      return;
    }

    try {
      await nav?.clipboard?.writeText(url);
      notify('Lien copié', url);
    } catch (e) {
      notify('Lien de la page', url);
    }
    return;
  }

  try {
    await Share.share(Platform.OS === 'ios' ? { url, message: title } : { message: url, title });
  } catch (e) { }
};