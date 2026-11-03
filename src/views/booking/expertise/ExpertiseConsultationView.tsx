import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { ExpertBookingSetup, getMyBookingSetup, updateMyConsultation } from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { notify } from '../bookingActions';
import { CONSULT_COLOR, durationText } from '../bookingKinds';

const IS_WEB = Platform.OS === 'web';
const QUERY_KEY = ['booking', 'me'];
const WEB_MAX_WIDTH = 640;

/** « 45,5 » ou « 45.5 » → 45.5 ; null si vide ou invalide. */
const parseNumber = (text: string): number | null => {
  const value = Number(text.replace(',', '.').trim());
  return text.trim() === '' || Number.isNaN(value) ? null : value;
};

/**
 * Expertise › Consultation › Réglages (mobile et web) : prix de 30 minutes, durée maximale,
 * délai minimum avant une consultation (vide = même délai que les thèmes).
 * L'activation reste sur l'écran Expertise, comme pour les thèmes.
 */
export const ExpertiseConsultationView = ({ navigation }) => {
  useHideFloatingTabBar(navigation);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getMyBookingSetup() });
  const setup = data && data.is_expert ? (data as ExpertBookingSetup) : null;
  const consult = setup?.consultation;

  const [price, setPrice] = useState('');
  const [maxMinutes, setMaxMinutes] = useState(180);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!consult || loaded) return;
    setPrice(consult.price != null ? String(consult.price).replace('.', ',') : '');
    setMaxMinutes(consult.max_minutes);
    setNotice(consult.min_notice_days != null ? String(consult.min_notice_days) : '');
    setLoaded(true);
  }, [consult]);

  if (!consult) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <BookingScreenHeader title="Consultation" onBack={() => navigation.goBack()} webLarge />
        <View style={styles.loading}>
          <ActivityIndicator color={CONSULT_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  const step = consult.step_minutes || 30;
  const options: number[] = [];
  for (let m = step * 2; m <= consult.max_minutes_limit; m += step) options.push(m);

  const themesNotice = consult.themes_min_notice ?? 1;
  const parsedPrice = parseNumber(price);
  const parsedNotice = parseNumber(notice);

  const save = async () => {
    if (price.trim() !== '' && (parsedPrice === null || parsedPrice < 0)) {
      notify('Prix invalide', 'Indiquez un montant en euros, par exemple 60.');
      return;
    }
    if (notice.trim() !== '' && (parsedNotice === null || parsedNotice < 1 || !Number.isInteger(parsedNotice))) {
      notify('Délai invalide', 'Indiquez un nombre de jours entier, au moins 1, ou laissez vide.');
      return;
    }
    if (consult.enabled && parsedPrice === null) {
      notify('Prix manquant', 'La consultation est activée : gardez un prix pour 30 minutes, ou désactivez-la d’abord.');
      return;
    }

    setSaving(true);
    const result = await updateMyConsultation({
      price: parsedPrice,
      max_minutes: maxMinutes,
      min_notice_days: parsedNotice,
    });
    setSaving(false);

    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
      navigation.goBack();
      return;
    }
    const failure = result as Extract<typeof result, { ok: false }>;
    notify('Enregistrement impossible', failure.message ?? 'Réessayez dans un instant.');
  };

  const total = (minutes: number) =>
    parsedPrice !== null ? `${(parsedPrice * (minutes / 30)).toFixed(parsedPrice % 1 ? 2 : 0).replace('.', ',')} €` : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Réglages de la consultation" onBack={() => navigation.goBack()} webLarge />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Vos confrères vous posent leur propre question, toujours en visio, et réservent 30 minutes, 1 h, 1 h 30…
            Le prix est celui de 30 minutes multiplié par le nombre de tranches.
          </Text>

          {/* ---- Prix ---- */}
          <View style={styles.card}>
            <Text style={styles.label}>Prix pour 30 minutes (TTC)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.input, IS_WEB && ({ outlineStyle: 'none' } as any)]}
                value={price}
                onChangeText={(text) => setPrice(text.replace(/[^0-9.,]/g, ''))}
                placeholder="Ex. 60"
                placeholderTextColor={Colors.subtext}
                keyboardType="decimal-pad"
                maxLength={8}
                editable={!saving}
              />
              <Text style={styles.unit}>€</Text>
            </View>
            <Text style={styles.help}>Obligatoire pour activer la consultation. 0 € = consultation offerte.</Text>
          </View>

          {/* ---- Durée maximale ---- */}
          <View style={styles.card}>
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
            <Text style={styles.help}>
              Vos confrères choisissent entre 30 minutes et {durationText(maxMinutes)}
              {total(maxMinutes) ? ` (soit ${total(maxMinutes)} au plus)` : ''}.
            </Text>
          </View>

          {/* ---- Délai minimum ---- */}
          <View style={styles.card}>
            <Text style={styles.label}>Délai minimum avant une consultation (jours)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.input, IS_WEB && ({ outlineStyle: 'none' } as any)]}
                value={notice}
                onChangeText={(text) => setNotice(text.replace(/[^0-9]/g, ''))}
                placeholder={String(themesNotice)}
                placeholderTextColor={Colors.subtext}
                keyboardType="number-pad"
                maxLength={2}
                editable={!saving}
              />
              <Text style={styles.unit}>jour(s)</Text>
            </View>
            <Text style={styles.help}>
              Vide = même délai que vos thèmes ({themesNotice} {themesNotice > 1 ? 'jours' : 'jour'}).
              1 = réservable dès le lendemain matin.
            </Text>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={[styles.footer, IS_WEB && styles.footerWeb]}>
          <TouchableOpacity
            style={[styles.save, IS_WEB && styles.saveWeb, saving && styles.saveDisabled]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grayLight,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    gap: Spacings.md,
  },
  contentWeb: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
    paddingVertical: Spacings.lg,
  },
  intro: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    backgroundColor: Colors.white,
    gap: Spacings.xs,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  input: {
    width: 120,
    height: 46,
    paddingHorizontal: Spacings.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: Colors.text,
  },
  unit: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  help: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext2,
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
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerWeb: {
    alignItems: 'center',
    paddingBottom: Spacings.sm,
  },
  save: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.xs,
  },
  saveWeb: {
    width: '100%',
    maxWidth: 320,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});
