import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { ExpertBookingSetup, updateMyConsultation } from '../../../../services/v2/BookingService';
import { notify } from '../../bookingActions';
import { CONSULT_COLOR, CONSULT_SOFT, durationText } from '../../bookingKinds';

const QUERY_KEY = ['booking', 'me'];

/** « 45,5 » ou « 45.5 » → 45.5 ; null si vide ou invalide. */
const parsePrice = (text: string): number | null => {
  const value = Number(text.replace(',', '.').trim());
  return text.trim() === '' || Number.isNaN(value) ? null : value;
};

/**
 * Expertise › Consultation sur mesure (mobile et web) : activation, prix TTC de 30 minutes,
 * durée maximale qu'un confrère peut demander. Toujours en visio.
 */
export const ConsultationSettingsCard: React.FC<{ setup: ExpertBookingSetup }> = ({ setup }) => {
  const queryClient = useQueryClient();
  const consult = setup.consultation;

  const [enabled, setEnabled] = useState(!!consult?.enabled);
  const [price, setPrice] = useState(consult?.price != null ? String(consult.price).replace('.', ',') : '');
  const [maxMinutes, setMaxMinutes] = useState(consult?.max_minutes ?? 180);
  const [saving, setSaving] = useState(false);

  // Données rechargées (autre écran, tirage) : le formulaire suit, tant qu'on ne modifie pas.
  useEffect(() => {
    setEnabled(!!consult?.enabled);
    setPrice(consult?.price != null ? String(consult.price).replace('.', ',') : '');
    setMaxMinutes(consult?.max_minutes ?? 180);
  }, [consult?.enabled, consult?.price, consult?.max_minutes]);

  if (!consult) return null;

  const step = consult.step_minutes || 30;
  const options: number[] = [];
  for (let m = step * 2; m <= consult.max_minutes_limit; m += step) options.push(m);

  const parsed = parsePrice(price);
  const dirty =
    enabled !== consult.enabled || parsed !== consult.price || maxMinutes !== consult.max_minutes;

  const save = async (next?: { enabled?: boolean }) => {
    const wantEnabled = next?.enabled ?? enabled;
    if (wantEnabled && parsed === null) {
      notify('Prix manquant', 'Indiquez votre prix pour 30 minutes avant d\'activer les consultations.');
      setEnabled(false);
      return;
    }
    setSaving(true);
    const result = await updateMyConsultation({ enabled: wantEnabled, price: parsed, max_minutes: maxMinutes });
    setSaving(false);
    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
      return;
    }
    setEnabled(consult.enabled);
    const failure = result as Extract<typeof result, { ok: false }>;
    notify('Enregistrement impossible', failure.message ?? 'Réessayez dans un instant.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="chatbubbles-outline" size={20} color={CONSULT_COLOR} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Consultation sur mesure</Text>
          <Text style={styles.hint}>
            {enabled
              ? 'Vos confrères vous posent leur question, en visio, par tranches de 30 minutes.'
              : 'Désactivée : seuls vos thèmes sont proposés.'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(value) => {
            setEnabled(value);
            save({ enabled: value });
          }}
          disabled={saving}
          trackColor={{ false: Colors.disabledBackground, true: CONSULT_COLOR }}
          thumbColor={Colors.white}
          ios_backgroundColor={enabled ? CONSULT_COLOR : Colors.disabledBackground}
        />
      </View>

      <Text style={styles.label}>Prix pour 30 minutes (TTC)</Text>
      <View style={styles.priceRow}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
          value={price}
          onChangeText={(text) => setPrice(text.replace(/[^0-9.,]/g, ''))}
          placeholder="Ex. 60"
          placeholderTextColor={Colors.subtext}
          keyboardType="decimal-pad"
          maxLength={8}
          editable={!saving}
        />
        <Text style={styles.euro}>€</Text>
      </View>

      <Text style={styles.label}>Durée maximale d'une consultation</Text>
      <View style={styles.chips}>
        {options.map((m) => {
          const on = m === maxMinutes;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => setMaxMinutes(m)}
              disabled={saving}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{durationText(m)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {dirty ? (
        <TouchableOpacity style={styles.save} onPress={() => save()} disabled={saving} accessibilityRole="button">
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    backgroundColor: Colors.white,
    gap: Spacings.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONSULT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.subtext2,
  },
  label: {
    marginTop: Spacings.sm,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  input: {
    width: 120,
    height: 44,
    paddingHorizontal: Spacings.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: Colors.text,
  },
  euro: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipOn: {
    backgroundColor: CONSULT_COLOR,
    borderColor: CONSULT_COLOR,
  },
  chipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  chipTextOn: {
    color: Colors.white,
  },
  save: {
    marginTop: Spacings.sm,
    height: 44,
    borderRadius: 22,
    backgroundColor: CONSULT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.white,
  },
});
