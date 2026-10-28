import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
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
  BookingDomain,
  ExpertBookingSetup,
  createDomain,
  fieldError,
  getDomains,
  getMyBookingSetup,
  updateMyProfile,
} from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { initials } from '../bookingFormat';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';

const QUERY_KEY = ['booking', 'me'];
const DOMAINS_KEY = ['booking', 'domains'];

interface ProfileForm {
  honorific: string;
  name: string;
  credentials: string;
  lede: string;
  palette: string | null;
  domains: BookingDomain[];
}

/** Comparaison sans casse ni accents, pour la recherche et le doublon d'ajout. */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Modification du profil public de l'expert : titre, nom, références, présentation,
 * domaines et palette. Domaines et couleur se choisissent dans une fenêtre : le formulaire
 * n'en montre que le résultat. La photo n'est pas modifiable ici (pas de sélecteur d'images).
 */
export const ExpertiseProfileFormView = ({ navigation }) => {
  useHideFloatingTabBar(navigation);

  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getMyBookingSetup() });
  const setup = data?.is_expert ? (data as ExpertBookingSetup) : null;
  const expert = setup?.expert;
  const limits = setup?.limits.profile;
  const palettes = setup?.palettes ?? [];

  const { data: allDomains, isLoading: domainsLoading } = useQuery({
    queryKey: DOMAINS_KEY,
    queryFn: () => getDomains(),
    staleTime: 5 * 60 * 1000,
  });

  // Valeurs de départ figées au montage : sert à détecter une saisie non enregistrée.
  const initial = useMemo<ProfileForm>(
    () => ({
      honorific: expert?.honorific ?? '',
      name: expert?.name ?? '',
      credentials: expert?.credentials ?? '',
      lede: expert?.lede ?? '',
      palette: expert?.palette ?? null,
      domains: expert?.domains ?? [],
    }),
    []
  );

  const [form, setForm] = useState<ProfileForm>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainsOpen, setDomainsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const leaving = useRef(false);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

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

  /* ---- Logique des domaines ---- */

  const selectedIds = new Set(form.domains.map((d) => d.id));
  const query = normalize(search);

  // Dans la fenêtre : les domaines choisis en tête, puis les autres, filtrés par la recherche.
  const visibleDomains = useMemo(() => {
    if (!allDomains) return [];
    const matches = query ? allDomains.filter((d) => normalize(d.name).includes(query)) : allDomains;
    return [...matches.filter((d) => selectedIds.has(d.id)), ...matches.filter((d) => !selectedIds.has(d.id))];
  }, [allDomains, query, form.domains]);

  // « Ajouter » seulement si aucun domaine ne porte déjà exactement ce nom.
  const exactMatch = !!allDomains?.some((d) => normalize(d.name) === query);
  const canAdd = query.length > 0 && !exactMatch;

  const toggleDomain = (domain: BookingDomain) =>
    selectedIds.has(domain.id)
      ? update('domains', form.domains.filter((d) => d.id !== domain.id))
      : update('domains', [...form.domains, domain]);

  const confirmNewDomain = () => {
    const label = search.trim().replace(/\s+/g, ' ');
    Alert.alert('Ajouter ce domaine ?', `« ${label} » sera ajouté à la liste et proposé à tous les experts.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: async () => {
          setAddingDomain(true);
          const result = await createDomain(label);
          setAddingDomain(false);

          if (result.ok === false) {
            Alert.alert('Ajout impossible', fieldError(result.errors, 'label') ?? result.message ?? 'Réessayez dans un instant.');
            return;
          }
          const domain = result.data.domain;
          queryClient.setQueryData<BookingDomain[]>(DOMAINS_KEY, (current) =>
            current && !current.some((d) => d.id === domain.id) ? [...current, domain] : current
          );
          if (!selectedIds.has(domain.id)) update('domains', [...form.domains, domain]);
          setSearch('');
        },
      },
    ]);
  };

  /* ---- Enregistrement ---- */

  const save = async () => {
    if (!form.name.trim()) {
      setErrors({ name: ['Le nom est obligatoire.'] });
      setMessage(null);
      return;
    }

    setSaving(true);
    const result = await updateMyProfile({
      honorific: form.honorific.trim() || null,
      name: form.name.trim(),
      credentials: form.credentials.trim() || null,
      lede: form.lede.trim() || null,
      palette: form.palette,
      domain_ids: form.domains.map((d) => d.id),
    });
    setSaving(false);

    if (result.ok) {
      queryClient.setQueryData(QUERY_KEY, result.data);
      // La fiche publique de l'expert (liste, profil) reprend ses nouvelles infos.
      queryClient.invalidateQueries({ queryKey: ['booking', 'experts'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'expert'] });
      leaving.current = true;
      navigation.goBack();
      return;
    }

    setErrors(result.errors);
    setMessage(
      Object.keys(result.errors).length > 0 ? null : result.message ?? 'Enregistrement impossible. Réessayez dans un instant.'
    );
  };

  if (!expert) return null;

  const nameError = fieldError(errors, 'name');
  const honorificError = fieldError(errors, 'honorific');
  const credentialsError = fieldError(errors, 'credentials');
  const ledeError = fieldError(errors, 'lede');
  const domainsError = fieldError(errors, 'domain_ids');
  const ledeMax = limits?.lede_max ?? 5000;

  // « Par défaut » (bleu de l'application) puis les palettes ; aucun libellé à l'écran.
  const colorOptions = [{ key: null as string | null, name: 'Par défaut', color: Colors.lblue }, ...palettes];
  const currentColor = colorOptions.find((o) => o.key === form.palette)?.color ?? Colors.lblue;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Modifier le profil" onBack={() => navigation.goBack()} />

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

          {/* ---- Photo (lecture seule) ---- */}
          <View style={styles.photoRow}>
            <View style={styles.photo}>
              {expert.avatar_url ? (
                <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
              ) : (
                <Text style={styles.photoInitials}>{initials(form.name || expert.name)}</Text>
              )}
            </View>
            <Text style={[styles.hint, styles.flex]}>Pour changer votre photo, envoyez-la à l'équipe OrthoMaster.</Text>
          </View>

          {/* ---- Identité ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Titre <Text style={styles.optional}>(facultatif)</Text>
            </Text>
            <TextInput
              style={[styles.input, honorificError && styles.inputError]}
              value={form.honorific}
              onChangeText={(value) => update('honorific', value)}
              placeholder="Ex. Dr, Pr"
              placeholderTextColor={Colors.subtext}
              maxLength={limits?.honorific_max ?? 40}
            />
            {honorificError && <Text style={styles.error}>{honorificError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={form.name}
              onChangeText={(value) => update('name', value)}
              placeholder="Prénom et nom"
              placeholderTextColor={Colors.subtext}
              maxLength={limits?.name_max ?? 255}
            />
            {nameError && <Text style={styles.error}>{nameError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Références <Text style={styles.optional}>(facultatif)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textareaSmall, credentialsError && styles.inputError]}
              value={form.credentials}
              onChangeText={(value) => update('credentials', value)}
              placeholder="Ex. Orthodontiste exclusif · Ancien interne des hôpitaux"
              placeholderTextColor={Colors.subtext}
              maxLength={limits?.credentials_max ?? 200}
              multiline
              textAlignVertical="top"
            />
            {credentialsError && <Text style={styles.error}>{credentialsError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Présentation <Text style={styles.optional}>(facultatif)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea, ledeError && styles.inputError]}
              value={form.lede}
              onChangeText={(value) => update('lede', value)}
              placeholder="Votre parcours, votre approche, ce que vous partagez avec vos confrères…"
              placeholderTextColor={Colors.subtext}
              maxLength={ledeMax}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {form.lede.length} / {ledeMax}
            </Text>
            {ledeError && <Text style={styles.error}>{ledeError}</Text>}
          </View>

          {/* ---- Domaines : résumé, le choix se fait dans une fenêtre ---- */}
          <View style={styles.field}>
            <View style={styles.fieldHead}>
              <Text style={styles.label}>Domaines</Text>
              <TouchableOpacity onPress={() => setDomainsOpen(true)} hitSlop={10}>
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>

            {form.domains.length > 0 ? (
              <View style={styles.chips}>
                {form.domains.map((domain) => (
                  <View key={domain.id} style={styles.chip}>
                    <Text style={styles.chipText}>{domain.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <TouchableOpacity style={styles.emptyBox} onPress={() => setDomainsOpen(true)}>
                <Ionicons name="add" size={18} color={Colors.lblueDark} />
                <Text style={styles.emptyBoxText}>Choisir vos domaines</Text>
              </TouchableOpacity>
            )}
            {domainsError && <Text style={styles.error}>{domainsError}</Text>}
          </View>

          {/* ---- Couleur : titre et explication à gauche, carré de la couleur choisie à droite ---- */}
          <View style={styles.colorRow}>
            <View style={styles.flex}>
              <Text style={styles.label}>Couleur du profil</Text>
              <Text style={styles.hint}>Couleur principale utilisée pour afficher votre profil.</Text>
            </View>
            <TouchableOpacity
              style={[styles.colorCurrent, { backgroundColor: currentColor }]}
              onPress={() => setPaletteOpen(true)}
              accessibilityLabel="Changer la couleur du profil"
            >
              <Ionicons name="color-palette-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ---- Barre d'action ---- */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ---- Fenêtre : domaines ---- */}
      <Modal visible={domainsOpen} transparent animationType="slide" onRequestClose={() => setDomainsOpen(false)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDomainsOpen(false)} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Domaines</Text>
              <Text style={styles.sheetCount}>
                {form.domains.length} sélectionné{form.domains.length > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={Colors.subtext} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un domaine"
                placeholderTextColor={Colors.subtext}
                maxLength={limits?.domain_max ?? 120}
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Effacer la recherche">
                  <Ionicons name="close-circle" size={18} color={Colors.subtext} />
                </TouchableOpacity>
              )}
            </View>

            {domainsLoading ? (
              <ActivityIndicator color={Colors.lblue} style={styles.loader} />
            ) : (
              <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
                {canAdd && (
                  <TouchableOpacity style={styles.addDomain} onPress={confirmNewDomain} disabled={addingDomain}>
                    {addingDomain ? (
                      <ActivityIndicator size="small" color={Colors.lblueDark} />
                    ) : (
                      <Ionicons name="add-circle" size={22} color={Colors.lblueDark} />
                    )}
                    <Text style={styles.addDomainText} numberOfLines={2}>
                      Ajouter « {search.trim()} »
                    </Text>
                  </TouchableOpacity>
                )}

                {visibleDomains.map((domain) => {
                  const on = selectedIds.has(domain.id);
                  return (
                    <TouchableOpacity
                      key={domain.id}
                      style={styles.option}
                      onPress={() => toggleDomain(domain)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <View style={[styles.checkbox, on && styles.checkboxOn]}>
                        {on && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                      </View>
                      <Text style={[styles.optionText, on && styles.optionTextOn]}>{domain.name}</Text>
                    </TouchableOpacity>
                  );
                })}

                {visibleDomains.length === 0 && !canAdd ? (
                  <Text style={[styles.hint, styles.sheetEmpty]}>Aucun domaine.</Text>
                ) : null}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.sheetDone} onPress={() => setDomainsOpen(false)}>
              <Text style={styles.saveText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---- Fenêtre : couleur ---- */}
      <Modal visible={paletteOpen} transparent animationType="slide" onRequestClose={() => setPaletteOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPaletteOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Couleur du profil</Text>
            <View style={styles.swatches}>
              {colorOptions.map((option) => {
                const selected = form.palette === option.key;
                return (
                  <TouchableOpacity
                    key={option.key ?? 'default'}
                    style={[styles.swatch, selected && { borderColor: option.color }]}
                    onPress={() => {
                      update('palette', option.key);
                      setPaletteOpen(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.name}
                  >
                    <View style={[styles.swatchColor, { backgroundColor: option.color }]}>
                      {selected && <Ionicons name="checkmark" size={22} color={Colors.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  loader: {
    paddingVertical: Spacings.md,
  },

  /* ---- Photo ---- */
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.lblueDark,
  },

  /* ---- Champs ---- */
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
    fontSize: 16,
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
    fontSize: 16,
    color: Colors.text,
  },
  textareaSmall: {
    minHeight: 72,
  },
  textarea: {
    minHeight: 140,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.danger,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.dangerBackground,
  },
  alertText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.danger,
  },

  /* ---- Domaines (résumé) ---- */
  // Simple lien : texte en gras, couleur foncée, sans fond.
  editButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.lblueDark,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  chip: {
    maxWidth: '100%',
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  chipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.lblueDark,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  emptyBoxText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.lblueDark,
  },

  /* ---- Couleur (résumé) ---- */
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  // Carré de la hauteur du titre et de l'explication réunis.
  colorCurrent: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  /* ---- Fenêtres ---- */
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
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
    gap: Spacings.md,
  },
  sheetTall: {
    height: '80%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
  },
  sheetCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext2,
  },
  sheetList: {
    flex: 1,
  },
  sheetEmpty: {
    textAlign: 'center',
    paddingVertical: Spacings.lg,
  },
  sheetDone: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 46,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.lblueDark,
    borderColor: Colors.lblueDark,
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
  addDomain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    marginBottom: Spacings.xs,
    borderRadius: 12,
    backgroundColor: Colors.lblue3,
  },
  addDomainText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.lblueDark,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacings.md,
    paddingVertical: Spacings.sm,
  },
  swatch: {
    padding: 4,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  swatchColor: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Barre d'action ---- */
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.sm,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});