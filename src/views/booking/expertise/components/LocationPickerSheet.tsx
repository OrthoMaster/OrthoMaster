import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { ExpertBookingSetup, ExpertLocation } from '../../../../services/v2/BookingService';
import { NewLocationForm } from './NewLocationForm';

/** Action posée au-dessus de la liste d'adresses (ex. fermer la demi-journée). */
export interface LocationSheetAction {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: 'danger';
  onPress: () => void;
}

interface LocationPickerSheetProps {
  visible: boolean;
  /** Demi-journée concernée : « Lundi matin ». */
  title: string;
  subtitle?: string;
  locations: ExpertLocation[];
  selectedId?: number | null;
  /**
   * Toucher l'adresse déjà choisie la retire (onSelect(null)) : la demi-journée
   * repasse en ligne seulement.
   */
  deselectable?: boolean;
  /** Actions en tête de feuille, au-dessus des adresses. */
  actions?: LocationSheetAction[];
  placesEnabled: boolean;
  minInput: number;
  labelMax: number;
  accessMax: number;
  onSelect: (locationId: number | null) => void;
  /** Nouveau lieu créé : l'appelant écrit l'état dans le cache, puis le lieu est choisi. */
  onCreated: (setup: ExpertBookingSetup, locationId: number) => void;
  onClose: () => void;
}

/**
 * Feuille basse de choix d'un lieu : adresses déjà enregistrées, puis « Nouvelle adresse »
 * qui bascule sur la recherche Google dans la même fenêtre (deux Modal superposées
 * se comportent mal sur iOS).
 */
export const LocationPickerSheet: React.FC<LocationPickerSheetProps> = ({
  visible,
  title,
  subtitle,
  locations,
  selectedId,
  deselectable,
  actions,
  placesEnabled,
  minInput,
  labelMax,
  accessMax,
  onSelect,
  onCreated,
  onClose,
}) => {
  const [step, setStep] = useState<'list' | 'new'>('list');
  const active = locations.filter((l) => !l.archived);

  // Chaque ouverture repart de la liste ; sans adresse enregistrée ni action en tête,
  // directement sur la recherche.
  const hasActions = !!actions?.length;
  useEffect(() => {
    if (visible) setStep(active.length === 0 && placesEnabled && !hasActions ? 'new' : 'list');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, step === 'new' && styles.sheetTall]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{step === 'new' ? 'Nouvelle adresse' : title}</Text>
          {step === 'list' && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* ---- Actions de la demi-journée, au-dessus des adresses ---- */}
          {step === 'list' && actions?.length ? (
            <View style={styles.actions}>
              {actions.map((action) => {
                const color = action.tone === 'danger' ? Colors.danger : Colors.text;
                return (
                  <TouchableOpacity key={action.key} style={styles.actionRow} onPress={action.onPress}>
                    <MaterialCommunityIcons name={action.icon} size={22} color={color} />
                    <Text style={[styles.actionText, { color }]}>{action.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {step === 'list' && actions?.length ? (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Adresse</Text>
              {deselectable && selectedId != null && (
                <Text style={styles.sectionHint}>Touchez l'adresse choisie pour la retirer.</Text>
              )}
            </View>
          ) : null}

          {step === 'new' ? (
            <NewLocationForm
              minInput={minInput}
              labelMax={labelMax}
              accessMax={accessMax}
              onCreated={(setup, id) => {
                onCreated(setup, id);
                setStep('list');
              }}
              onCancel={() => (active.length === 0 && !hasActions ? onClose() : setStep('list'))}
            />
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {active.map((location) => {
                const on = selectedId === location.id;
                return (
                  <TouchableOpacity
                    key={location.id}
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => onSelect(on && deselectable ? null : location.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <MaterialCommunityIcons
                      name={on ? 'map-marker-check' : 'map-marker-outline'}
                      size={22}
                      color={on ? Colors.lblueDark : Colors.subtext}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.optionLabel, on && styles.optionLabelOn]} numberOfLines={1}>
                        {location.label}
                      </Text>
                      <Text style={styles.optionAddress} numberOfLines={1}>
                        {location.address_line}, {[location.postal_code, location.city].filter(Boolean).join(' ')}
                      </Text>
                    </View>
                    {on && <Ionicons name="checkmark" size={20} color={Colors.lblueDark} />}
                  </TouchableOpacity>
                );
              })}

              {placesEnabled ? (
                <TouchableOpacity style={styles.addRow} onPress={() => setStep('new')}>
                  <Ionicons name="add-circle" size={22} color={Colors.lblueDark} />
                  <Text style={styles.addText}>Nouvelle adresse</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.subtitle}>
                  L'ajout d'adresse est momentanément indisponible. Contactez l'équipe OrthoMaster.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  /* ---- Fenêtre ---- */
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    maxHeight: '85%',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    // Large marge basse : la dernière ligne (« Nouvelle adresse ») reste loin du bord et de la barre système.
    paddingBottom: Spacings.xl * 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.white,
    gap: Spacings.sm,
  },
  sheetTall: {
    height: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacings.xs,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  flex: {
    flex: 1,
  },

  /* ---- Actions ---- */
  actions: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  sectionHead: {
    marginTop: Spacings.xs,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
  },
  sectionHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },

  /* ---- Liste ---- */
  // Peut rétrécir dans la feuille plafonnée à 85 % : la liste défile au lieu de déborder.
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    marginBottom: Spacings.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionOn: {
    borderColor: Colors.lblueDark,
    backgroundColor: Colors.lblue3,
  },
  optionLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  optionLabelOn: {
    color: Colors.lblueDark,
  },
  optionAddress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.lblue2,
  },
  addText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.lblueDark,
  },
});