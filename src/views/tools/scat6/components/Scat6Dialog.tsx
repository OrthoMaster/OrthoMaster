import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Scat6Button } from './Scat6UI';

import Spacings from '../../../../../constants/Spacings';
import { SCAT, FONTS } from '../scat6Theme';

/**
 * Boîte de dialogue de l'espace SCAT6, à la place de alert / confirm du navigateur.
 * L'hôte est monté une fois dans l'espace (Scat6Space) ; les écrans appellent scat6Confirm / scat6Notify.
 */
export interface Scat6DialogButton {
  text: string;
  /** cancel : discret ; destructive : rouge ; default : bouton principal bleu. */
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
}

interface DialogOptions {
  title: string;
  message?: string | null;
  buttons?: Scat6DialogButton[];
  /** Pour fermer la boîte depuis l'écran (dismissScat6Dialog), ex. quand elle n'a plus d'objet. */
  id?: string;
}

let hostShow: ((options: DialogOptions) => void) | null = null;
let hostDismiss: ((id: string) => void) | null = null;

/** Ferme la boîte `id` si elle est ouverte, comme « Annuler ». */
export const dismissScat6Dialog = (id: string) => hostDismiss?.(id);

export const showScat6Dialog = (options: DialogOptions) => {
  if (hostShow) hostShow(options);
  else if (typeof window !== 'undefined') window.alert(`${options.title}\n\n${options.message ?? ''}`);
};

export const scat6Notify = (title: string, message?: string | null) => showScat6Dialog({ title, message });

/** Confirmation : résout true si l'action est choisie (false si annulée ou fermée par dismissScat6Dialog). */
export const scat6Confirm = (
  title: string,
  message: string,
  confirmText: string,
  destructive = false,
  id?: string
): Promise<boolean> =>
  new Promise((resolve) => {
    showScat6Dialog({
      id,
      title,
      message,
      buttons: [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
    });
  });

export const Scat6DialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  // Chaque boîte est un nouveau Modal : sur le web, le portail d'un Modal est ajouté à la page à son
  // montage. Monté à l'ouverture, il passe au-dessus des fenêtres déjà ouvertes (ex. « Modifier le patient »).
  const [count, setCount] = useState(0);
  // Écran étroit : boutons l'un sous l'autre, pleine largeur (jamais de libellé coupé).
  const { width } = useWindowDimensions();
  const stacked = width < 480;

  useEffect(() => {
    hostShow = (options) => {
      setCount((c) => c + 1);
      setDialog(options);
    };
    return () => {
      hostShow = null;
    };
  }, []);

  // Fermeture demandée par l'écran : seulement si c'est bien cette boîte qui est ouverte.
  useEffect(() => {
    hostDismiss = (id) => {
      if (!dialog || dialog.id !== id) return;
      press(dialog.buttons?.find((b) => b.style === 'cancel'));
    };
    return () => {
      hostDismiss = null;
    };
  }, [dialog]);

  const buttons = dialog?.buttons?.length ? dialog.buttons : [{ text: 'OK' }];
  const cancel = buttons.find((b) => b.style === 'cancel');

  const press = (button?: Scat6DialogButton) => {
    setDialog(null);
    // Après la fermeture : l'action peut ouvrir une autre boîte.
    setTimeout(() => button?.onPress?.(), 0);
  };

  if (!dialog) return null;

  return (
    <Modal key={count} visible transparent animationType="fade" onRequestClose={() => press(cancel)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => press(cancel)} accessibilityLabel="Fermer" />
        {dialog ? (
          <View style={styles.box} accessibilityRole="alert">
            <Text style={styles.title}>{dialog.title}</Text>
            {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
            {/* Boutons 3D de l'espace (Scat6Button) : Annuler en secondaire, l'action en principal / rouge. */}
            <View style={[styles.buttons, (buttons.length > 2 || stacked) && styles.buttonsColumn]}>
              {buttons.map((b, i) => (
                <Scat6Button
                  key={`${b.text}-${i}`}
                  title={b.text}
                  variant={b.style === 'cancel' ? 'secondary' : b.style === 'destructive' ? 'danger' : 'primary'}
                  style={buttons.length <= 2 && !stacked ? styles.buttonFlex : undefined}
                  onPress={() => press(b)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 32, 58, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
  },
  box: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: SCAT.card,
    borderRadius: 18,
    padding: Spacings.lg,
    gap: Spacings.sm,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: SCAT.blueInk,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: SCAT.text,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  buttonsColumn: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },
  buttonFlex: {
    flex: 1,
  },
});
