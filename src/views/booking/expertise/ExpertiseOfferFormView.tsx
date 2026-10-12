import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  ExpertBookingSetup,
  createMyOffer,
  deleteMyOffer,
  fieldError,
  getMyBookingSetup,
  updateMyOffer,
} from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { blocksLabel, durationLabel, parseAmount } from '../bookingFormat';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';

const QUERY_KEY = ['booking', 'me'];
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;

interface OfferForm {
  title: string;
  description: string;
  blocks: number;
  price: string;
  active: boolean;
}

/**
 * Création (sans offerId) ou modification d'une offre.
 * Le serveur renvoie l'état complet : on l'écrit dans le cache puis on revient à la liste.
 */
export const ExpertiseOfferFormView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const queryClient = useQueryClient();
  const offerId: number | undefined = route.params?.offerId;

  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getMyBookingSetup() });
  const setup = data?.is_expert ? (data as ExpertBookingSetup) : null;
  const offer = offerId ? setup?.offers.find((o) => o.id === offerId) : undefined;
  const maxBlocks = setup?.limits.max_blocks_per_offer ?? 20;

  // Valeurs de départ figées au montage : sert à détecter une saisie non enregistrée.
  const initial = useMemo<OfferForm>(
    () => ({
      title: offer?.title ?? '',
      description: offer?.description ?? '',
      blocks: offer?.blocks_count ?? 1,
      price: offer ? String(offer.price).replace('.', ',') : '',
      active: offer?.active_flg ?? true,
    }),
    []
  );

  const [form, setForm] = useState<OfferForm>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const leaving = useRef(false);

  const update = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  /* ---- Sortie avec saisie en cours ---- */

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirty || leaving.current) return;

      e.preventDefault();
      Alert.alert('Abandonner les modifications ?', 'Vos changements ne seront pas enregistrés.', [
        { text: 'Continuer la saisie', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  const closeAfterSave = (next: ExpertBookingSetup) => {
    queryClient.setQueryData(QUERY_KEY, next);
    leaving.current = true;
    navigation.goBack();
  };

  /* ---- Enregistrement ---- */

  const save = async () => {
    // Contrôles évidents avant l'envoi ; le serveur reste la référence (messages 422).
    const localErrors: Record<string, string[]> = {};
    const price = parseAmount(form.price);
    if (!form.title.trim()) localErrors.title = ['Le titre est obligatoire.'];
    if (form.price.trim() === '' || Number.isNaN(price) || price < 0) {
      localErrors.price = ['Indiquez un prix valide.'];
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setMessage(null);
      return;
    }

    const input = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      blocks_count: form.blocks,
      price,
      active_flg: form.active,
    };

    setSaving(true);
    const result = offer ? await updateMyOffer(offer.id, input) : await createMyOffer(input);
    setSaving(false);

    if (result.ok) {
      closeAfterSave(result.data);
      return;
    }

    setErrors(result.errors);
    setMessage(
      Object.keys(result.errors).length > 0
        ? null
        : result.message ?? 'Enregistrement impossible. Réessayez dans un instant.'
    );
  };

  const confirmDelete = () => {
    if (!offer) return;

    Alert.alert(
      "Supprimer l'offre ?",
      'Les rendez-vous déjà pris avec cette offre ne sont pas affectés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const result = await deleteMyOffer(offer.id);
            setSaving(false);

            if (result.ok) {
              closeAfterSave(result.data);
            } else {
              setMessage(result.message ?? 'Suppression impossible. Réessayez dans un instant.');
            }
          },
        },
      ]
    );
  };

  const titleError = fieldError(errors, 'title');
  const descriptionError = fieldError(errors, 'description');
  const blocksError = fieldError(errors, 'blocks_count');
  const priceError = fieldError(errors, 'price');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title={offer ? "Modifier l'offre" : 'Nouvelle offre'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {message && (
            <View style={styles.alert}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
              <Text style={styles.alertText}>{message}</Text>
            </View>
          )}

          {/* ---- Titre ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={[styles.input, titleError && styles.inputError]}
              value={form.title}
              onChangeText={(value) => update('title', value)}
              placeholder="Ex. Chirurgie du ligament croisé"
              placeholderTextColor={Colors.subtext}
              maxLength={TITLE_MAX}
              returnKeyType="next"
            />
            {titleError && <Text style={styles.error}>{titleError}</Text>}
          </View>

          {/* ---- Description ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Description <Text style={styles.optional}>(facultatif)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea, descriptionError && styles.inputError]}
              value={form.description}
              onChangeText={(value) => update('description', value)}
              placeholder="Ce que vous aborderez pendant l'échange, à qui il s'adresse…"
              placeholderTextColor={Colors.subtext}
              maxLength={DESCRIPTION_MAX}
              multiline
              textAlignVertical="top"
            />
            {descriptionError && <Text style={styles.error}>{descriptionError}</Text>}
          </View>

          {/* ---- Durée ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>Durée</Text>
            <View style={[styles.stepper, blocksError && styles.inputError]}>
              <TouchableOpacity
                style={[styles.stepperButton, form.blocks <= 1 && styles.stepperButtonDisabled]}
                onPress={() => update('blocks', Math.max(1, form.blocks - 1))}
                disabled={form.blocks <= 1}
                accessibilityLabel="Réduire la durée"
              >
                <Ionicons name="remove" size={22} color={Colors.white} />
              </TouchableOpacity>

              <View style={styles.stepperValue}>
                <Text style={styles.stepperMain}>{durationLabel(form.blocks)}</Text>
                <Text style={styles.stepperSub}>{blocksLabel(form.blocks)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperButton, form.blocks >= maxBlocks && styles.stepperButtonDisabled]}
                onPress={() => update('blocks', Math.min(maxBlocks, form.blocks + 1))}
                disabled={form.blocks >= maxBlocks}
                accessibilityLabel="Augmenter la durée"
              >
                <Ionicons name="add" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Vos confrères choisiront {blocksLabel(form.blocks)}, consécutives ou non.
            </Text>
            {blocksError && <Text style={styles.error}>{blocksError}</Text>}
          </View>

          {/* ---- Prix ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>Prix</Text>
            <View style={[styles.priceRow, priceError && styles.inputError]}>
              <TextInput
                style={styles.priceInput}
                value={form.price}
                onChangeText={(value) => update('price', value.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.subtext}
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceCurrency}>€</Text>
            </View>
            <Text style={styles.hint}>Montant total pour l'offre, quelle que soit sa durée.</Text>
            {priceError && <Text style={styles.error}>{priceError}</Text>}
          </View>

          {/* ---- Visibilité ---- */}
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Proposée à vos confrères</Text>
              <Text style={styles.hint}>
                {form.active ? 'Visible et réservable.' : 'Masquée : conservée mais non réservable.'}
              </Text>
            </View>
            <Switch
              value={form.active}
              onValueChange={(value) => update('active', value)}
              trackColor={{ false: Colors.disabledBackground, true: Colors.lblue }}
              thumbColor={Colors.white}
              ios_backgroundColor={form.active ? Colors.lblue : Colors.disabledBackground}
            />
          </View>

          {offer && (
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={saving}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteText}>Supprimer l'offre</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ---- Barre d'action ---- */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveText}>{offer ? 'Enregistrer' : "Créer l'offre"}</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    paddingBottom: Spacings.xl,
    gap: Spacings.lg,
  },

  /* ---- Champs ---- */
  field: {
    gap: Spacings.xs,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  optional: {
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontFamily: 'Roboto',
    fontSize: 15,
    color: Colors.text,
  },
  textarea: {
    minHeight: 120,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
  },

  /* ---- Durée ---- */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperMain: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  stepperSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },

  /* ---- Prix ---- */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  priceInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  priceCurrency: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.subtext2,
  },

  /* ---- Visibilité ---- */
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    padding: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  switchTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Messages ---- */
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 10,
    backgroundColor: Colors.dangerBackground,
  },
  alertText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.danger,
  },

  /* ---- Actions ---- */
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.sm,
  },
  deleteText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.danger,
  },
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});