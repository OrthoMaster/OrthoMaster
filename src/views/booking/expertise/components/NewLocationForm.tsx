import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import {
  ExpertBookingSetup,
  PlaceDetails,
  PlaceSuggestion,
  createMyLocation,
  fieldError,
  getPlaceDetails,
  newPlacesSession,
  searchPlaces,
} from '../../../../services/v2/BookingService';

/** Attente après la dernière frappe avant d'interroger Google. */
const DEBOUNCE_MS = 300;

interface NewLocationFormProps {
  minInput: number;
  labelMax: number;
  accessMax: number;
  /** Lieu enregistré : état complet renvoyé par le serveur et id du nouveau lieu. */
  onCreated: (setup: ExpertBookingSetup, locationId: number) => void;
  onCancel: () => void;
}

/**
 * Nouvelle adresse en deux temps : recherche Google, puis nom court et informations d'accès.
 * L'adresse n'est jamais saisie à la main : elle vient de Google et le serveur la relit
 * lui-même à l'enregistrement, ce qui garde un itinéraire fiable pour le confrère.
 */
export const NewLocationForm: React.FC<NewLocationFormProps> = ({ minInput, labelMax, accessMax, onCreated, onCancel }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [label, setLabel] = useState('');
  const [access, setAccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Un jeton par recherche ; renouvelé une fois l'adresse choisie et enregistrée.
  const session = useRef(newPlacesSession());
  // Dernière requête envoyée : une réponse plus ancienne arrivée en retard est ignorée.
  const lastQuery = useRef('');

  /* ---- Recherche ---- */

  useEffect(() => {
    if (place) return;

    const text = query.trim();
    if (text.length < minInput) {
      // Une réponse encore en route pour l'ancienne saisie sera ignorée.
      lastQuery.current = '';
      setSearching(false);
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      lastQuery.current = text;
      setSearching(true);
      const result = await searchPlaces(text, session.current);
      if (lastQuery.current !== text) return;
      setSearching(false);

      if (result.ok) {
        setSuggestions(result.data.suggestions);
        setSearchError(null);
      } else {
        setSuggestions([]);
        setSearchError(result.message ?? 'Recherche indisponible pour le moment.');
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, place]);

  const choose = async (suggestion: PlaceSuggestion) => {
    setLoadingPlace(true);
    const result = await getPlaceDetails(suggestion.place_id, session.current);
    setLoadingPlace(false);

    if (!result.ok) {
      setSearchError(result.message ?? 'Adresse introuvable. Choisissez-en une autre.');
      return;
    }
    const details = result.data.place;
    setPlace(details);
    setSuggestions([]);
    // Un cabinet, un hôpital : son nom fait un bon nom court, l'expert peut le changer.
    if (!label && details.is_establishment && details.name) {
      setLabel(details.name.slice(0, labelMax));
    }
  };

  const changeAddress = () => {
    setPlace(null);
    session.current = newPlacesSession();
  };

  /* ---- Enregistrement ---- */

  const save = async () => {
    if (!place) return;
    if (!label.trim()) {
      setErrors({ label: ['Donnez un nom court à ce lieu.'] });
      return;
    }

    setSaving(true);
    const result = await createMyLocation({
      place_id: place.google_place_id,
      session: session.current,
      label: label.trim(),
      access_details: access.trim() || null,
    });
    setSaving(false);

    if (result.ok) {
      const created = (result.data.result as { location_id?: number } | undefined)?.location_id;
      if (created) onCreated(result.data, created);
      return;
    }
    setErrors(result.errors);
    setMessage(Object.keys(result.errors).length > 0 ? null : result.message ?? 'Enregistrement impossible.');
  };

  const labelError = fieldError(errors, 'label');
  const accessError = fieldError(errors, 'access_details');
  const placeError = fieldError(errors, 'place_id') ?? fieldError(errors, 'address_line');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {message && (
        <View style={styles.alert}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
          <Text style={styles.alertText}>{message}</Text>
        </View>
      )}

      {/* ---- 1. Adresse ---- */}
      {!place ? (
        <View style={styles.field}>
          <Text style={styles.label}>Adresse</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={Colors.subtext} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Adresse ou nom du cabinet"
              placeholderTextColor={Colors.subtext}
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
            />
            {searching || loadingPlace ? (
              <ActivityIndicator size="small" color={Colors.lblue} />
            ) : query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Effacer">
                <Ionicons name="close-circle" size={18} color={Colors.subtext} />
              </TouchableOpacity>
            ) : null}
          </View>

          {query.trim().length > 0 && query.trim().length < minInput && (
            <Text style={styles.hint}>Tapez au moins {minInput} caractères.</Text>
          )}
          {searchError && <Text style={styles.error}>{searchError}</Text>}
          {placeError && <Text style={styles.error}>{placeError}</Text>}

          {suggestions.map((s) => (
            <TouchableOpacity key={s.place_id} style={styles.suggestion} onPress={() => choose(s)} disabled={loadingPlace}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.lblueDark} />
              <View style={styles.flex}>
                <Text style={styles.suggestionMain} numberOfLines={1}>{s.main}</Text>
                {s.secondary ? <Text style={styles.hint} numberOfLines={1}>{s.secondary}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}

          {!searching && !searchError && query.trim().length >= minInput && suggestions.length === 0 && (
            <Text style={styles.hint}>Aucune adresse trouvée. Essayez avec le numéro et la ville.</Text>
          )}
        </View>
      ) : (
        <View style={styles.field}>
          <View style={styles.fieldHead}>
            <Text style={styles.label}>Adresse</Text>
            <TouchableOpacity onPress={changeAddress} hitSlop={8}>
              <Text style={styles.link}>Changer</Text>
            </TouchableOpacity>
          </View>
          {/* Lecture seule : l'adresse vient de Google, on ne la retouche pas. */}
          <View style={styles.placeCard}>
            <MaterialCommunityIcons name="map-marker" size={22} color={Colors.lblueDark} />
            <View style={styles.flex}>
              <Text style={styles.placeLine}>{place.address_line}</Text>
              <Text style={styles.placeCity}>{[place.postal_code, place.city].filter(Boolean).join(' ')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ---- 2. Nom court et accès ---- */}
      {place && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Nom court</Text>
            <TextInput
              style={[styles.input, labelError && styles.inputError]}
              value={label}
              onChangeText={setLabel}
              placeholder="Ex. Cabinet A, Hôpital ABC"
              placeholderTextColor={Colors.subtext}
              maxLength={labelMax}
            />
            <Text style={styles.hint}>Affiché à vos confrères quand ils choisissent une demi-journée.</Text>
            {labelError && <Text style={styles.error}>{labelError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Informations d'accès <Text style={styles.optional}>(facultatif)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea, accessError && styles.inputError]}
              value={access}
              onChangeText={setAccess}
              placeholder="Étage, digicode, stationnement…"
              placeholderTextColor={Colors.subtext}
              maxLength={accessMax}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.hint}>Communiquées seulement une fois le rendez-vous accepté.</Text>
            {accessError && <Text style={styles.error}>{accessError}</Text>}
          </View>
        </>
      )}

      {/* ---- Actions ---- */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (!place || saving) && styles.saveButtonDisabled]}
          onPress={save}
          disabled={!place || saving}
        >
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer l'adresse</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacings.md,
    paddingBottom: Spacings.md,
  },
  field: {
    gap: Spacings.xs,
  },
  fieldHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  link: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.lblueDark,
  },

  /* ---- Recherche ---- */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 48,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Roboto',
    fontSize: 15,
    color: Colors.text,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  suggestionMain: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Adresse choisie ---- */
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.lblue3,
  },
  placeLine: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  placeCity: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },

  /* ---- Champs ---- */
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
    minHeight: 88,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.xs,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.subtext2,
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
});