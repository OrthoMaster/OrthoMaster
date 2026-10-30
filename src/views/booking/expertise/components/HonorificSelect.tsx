import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';
import { HonorificOption } from '../../../../services/v2/BookingService';

const NONE_LABEL = 'Aucun';

/** Sans casse, accents ni points : « dr. » et « Dr » désignent le même titre. */
const simplify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\./g, '')
    .toLowerCase()
    .trim();

/** Titre enregistré (« Docteur », ou ancien « Dr ») → valeur de la liste ; null si vide ou inconnu. */
export const matchHonorific = (raw: string | null | undefined, options: HonorificOption[]): string | null => {
  if (!raw) return null;
  const key = simplify(raw);
  return options.find((o) => simplify(o.value) === key || simplify(o.short) === key)?.value ?? null;
};

interface Props {
  value: string | null;
  options: HonorificOption[];
  onChange: (value: string | null) => void;
  invalid?: boolean;
}

/**
 * Titre de l'expert : liste fermée (Aucun, Madame, Monsieur, Docteur, Professeur).
 *  - Web : vraie liste déroulante du navigateur (<select>), sans bibliothèque ;
 *  - Mobile : champ qui ouvre une fenêtre de choix.
 */
export const HonorificSelect: React.FC<Props> = ({ value, options, onChange, invalid }) => {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.field, invalid && styles.fieldInvalid]}>
        {React.createElement(
          'select',
          {
            value: value ?? '',
            onChange: (e: any) => onChange(e.target.value || null),
            'aria-label': 'Titre',
            style: webSelectStyle,
          },
          React.createElement('option', { value: '' }, NONE_LABEL),
          ...options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.value))
        )}
        <Ionicons name="chevron-down" size={18} color={Colors.subtext} style={styles.chevron} pointerEvents="none" />
      </View>
    );
  }

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  const rows: { value: string | null; label: string; short?: string }[] = [
    { value: null, label: NONE_LABEL },
    ...options.map((o) => ({ value: o.value, label: o.value, short: o.short })),
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.field, invalid && styles.fieldInvalid]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Titre : ${value ?? NONE_LABEL}`}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? NONE_LABEL}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.subtext} style={styles.chevron} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Titre</Text>
            {rows.map((row) => {
              const selected = row.value === value;
              return (
                <TouchableOpacity
                  key={row.value ?? 'none'}
                  style={styles.option}
                  onPress={() => choose(row.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radio, selected && styles.radioOn]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextOn]}>{row.label}</Text>
                  {row.short ? <Text style={styles.optionShort}>{row.short}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
};

/** Style DOM du <select> web : transparent, il remplit le champ dessiné autour. */
const webSelectStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  width: '100%',
  height: '100%',
  minHeight: 46,
  padding: `0 ${Spacings.xl}px 0 ${Spacings.md}px`,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'Roboto',
  fontSize: 16,
  color: Colors.text,
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  // Même aspect que les champs texte du formulaire.
  field: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  fieldInvalid: {
    borderColor: Colors.danger,
  },
  value: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: Colors.text,
    paddingRight: Spacings.lg,
  },
  placeholder: {
    color: Colors.subtext,
  },
  chevron: {
    position: 'absolute',
    right: Spacings.md,
  },

  /* ---- Fenêtre (mobile) ---- */
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.white,
  },
  sheetTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: Spacings.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.lblueDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.lblueDark,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: Colors.text,
  },
  optionTextOn: {
    fontFamily: 'Poppins-Medium',
    color: Colors.lblueDark,
  },
  optionShort: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
  },
});
