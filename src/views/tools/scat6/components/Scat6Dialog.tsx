import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

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
}

let hostShow: ((options: DialogOptions) => void) | null = null;

export const showScat6Dialog = (options: DialogOptions) => {
  if (hostShow) hostShow(options);
  else if (typeof window !== 'undefined') window.alert(`${options.title}\n\n${options.message ?? ''}`);
};

export const scat6Notify = (title: string, message?: string | null) => showScat6Dialog({ title, message });

/** Confirmation : résout true si l'action est choisie. */
export const scat6Confirm = (
  title: string,
  message: string,
  confirmText: string,
  destructive = false
): Promise<boolean> =>
  new Promise((resolve) => {
    showScat6Dialog({
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

  useEffect(() => {
    hostShow = (options) => {
      setCount((c) => c + 1);
      setDialog(options);
    };
    return () => {
      hostShow = null;
    };
  }, []);

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
            <View style={[styles.buttons, buttons.length > 2 && styles.buttonsColumn]}>
              {buttons.map((b, i) => {
                const main = b.style !== 'cancel';
                const color = b.style === 'destructive' ? SCAT.danger : SCAT.blue;
                return (
                  <Pressable
                    key={`${b.text}-${i}`}
                    style={({ pressed }) => [
                      styles.button,
                      buttons.length <= 2 && styles.buttonFlex,
                      main ? { backgroundColor: color, borderColor: color } : styles.buttonCancel,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => press(b)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.buttonText, main && styles.buttonTextMain]}>{b.text}</Text>
                  </Pressable>
                );
              })}
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
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacings.md,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: SCAT.card,
    borderColor: SCAT.line,
  },
  buttonText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: SCAT.text,
  },
  buttonTextMain: {
    color: SCAT.card,
  },
});
