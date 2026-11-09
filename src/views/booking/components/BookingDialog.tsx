import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/**
 * Boîte de dialogue de l'espace rendez-vous (mobile et web), à la place de Alert.alert
 * (sans boutons sur le web) et des alert / confirm du navigateur : même rendu partout.
 *
 * L'hôte (<BookingDialogHost />) est monté une fois dans l'espace rendez-vous ; les écrans
 * appellent showBookingDialog() (ou notify / confirmAction de bookingActions).
 */
export interface BookingDialogButton {
  text: string;
  /** cancel : bouton discret ; destructive : rouge ; default : bouton principal. */
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
}

export interface BookingDialogOptions {
  title: string;
  message?: string | null;
  buttons?: BookingDialogButton[];
  /** Toucher en dehors : comme le bouton « cancel » s'il y en a un (sinon : fermer). */
  onDismiss?: () => void;
}

type Show = (options: BookingDialogOptions) => void;
let hostShow: Show | null = null;

/** true si l'hôte est monté (sinon, les appelants retombent sur l'alerte du système). */
export const showBookingDialog = (options: BookingDialogOptions): boolean => {
  if (!hostShow) return false;
  hostShow(options);
  return true;
};

export const BookingDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<BookingDialogOptions | null>(null);

  useEffect(() => {
    hostShow = (options) => setDialog(options);
    return () => {
      hostShow = null;
    };
  }, []);

  const buttons = dialog?.buttons?.length ? dialog.buttons : [{ text: 'OK' }];
  const cancel = buttons.find((b) => b.style === 'cancel');

  const press = (button?: BookingDialogButton) => {
    setDialog(null);
    // Après la fermeture : l'action peut elle-même ouvrir une autre boîte.
    setTimeout(() => button?.onPress?.(), 0);
  };

  const dismiss = () => {
    const onDismiss = dialog?.onDismiss;
    press(cancel);
    if (!cancel && onDismiss) setTimeout(onDismiss, 0);
  };

  return (
    <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Fermer" />
        {dialog ? (
          <View style={styles.box} accessibilityRole="alert">
            <Text style={styles.title}>{dialog.title}</Text>
            {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
            <View style={[styles.buttons, buttons.length > 2 && styles.buttonsColumn]}>
              {buttons.map((b, i) => {
                const main = b.style !== 'cancel';
                const color = b.style === 'destructive' ? Colors.danger : Colors.lblue;
                return (
                  <Pressable
                    key={`${b.text}-${i}`}
                    style={({ pressed }) => [
                      styles.button,
                      main ? { backgroundColor: color } : styles.buttonCancel,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => press(b)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.buttonText, { color: main ? Colors.white : Colors.text }]} numberOfLines={2}>
                      {b.text}
                    </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  box: {
    width: '100%',
    maxWidth: 400,
    padding: Spacings.lg,
    borderRadius: 20,
    backgroundColor: Colors.white,
    gap: Spacings.sm,
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)' } : { elevation: 12 }),
  } as any,
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.text,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.xs,
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
