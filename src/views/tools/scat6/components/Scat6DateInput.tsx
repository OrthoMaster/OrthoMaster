import React from 'react';
import { Platform, TextInput } from 'react-native';

import { SCAT } from '../scat6Theme';

/** Champ date (AAAA-MM-JJ). Web : sélecteur natif du navigateur ; ailleurs : saisie texte. */
export const Scat6DateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}> = ({ value, onChange, min, max }) => {
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      min,
      max,
      onChange: (e: any) => onChange(e.target.value),
      style: {
        fontFamily: 'Roboto',
        fontSize: 15,
        padding: '9px 12px',
        borderRadius: 12,
        border: `1.5px solid ${value ? SCAT.blue : SCAT.line}`,
        color: SCAT.text,
        background: SCAT.card,
      },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="AAAA-MM-JJ" />;
};

/** Date du jour au format AAAA-MM-JJ (heure locale). */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
