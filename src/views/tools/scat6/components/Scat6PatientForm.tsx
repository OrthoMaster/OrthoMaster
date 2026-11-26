import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { SPORTS } from '../../../../scat6/core/content';
import { MIN_AGE, ageFromYear } from '../../../../scat6/core/rules';
import type { SportId } from '../../../../scat6/core/types';
import {
  Scat6Patient,
  createScat6Patient,
  deleteScat6Patient,
  updateScat6Patient,
} from '../../../../services/v2/Scat6Service';
import { SCAT, FONTS } from '../scat6Theme';
import { scat6Confirm } from './Scat6Dialog';
import { SPORT_ICON } from './scat6Icons';
import { Scat6Button, Scat6Choice, Scat6Field, Scat6Link, Scat6Notice } from './Scat6UI';

interface Props {
  visible: boolean;
  /** Absent : création. */
  patient?: Scat6Patient | null;
  onClose: () => void;
  onSaved: (patient: Scat6Patient) => void;
  onDeleted?: () => void;
}

/**
 * Création / modification d'un patient (fenêtre par-dessus la page).
 * Données anonymisées : un nom libre (initiales, code…) et l'année de naissance seulement.
 */
export const Scat6PatientForm: React.FC<Props> = ({ visible, patient, onClose, onSaved, onDeleted }) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [sport, setSport] = useState<SportId | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(patient?.name ?? '');
    setYear(patient ? String(patient.birth_year) : '');
    setSport(patient?.sport ?? null);
    setNotes(patient?.notes ?? '');
    setError(null);
    setTried(false);
  }, [visible, patient]);

  const thisYear = new Date().getFullYear();
  const yearNumber = /^\d{4}$/.test(year) ? Number(year) : null;
  const yearValid = yearNumber !== null && yearNumber >= thisYear - 100 && yearNumber <= thisYear;
  const age = yearValid ? ageFromYear(yearNumber) : null;

  const errors = {
    name: !name.trim() ? 'Indiquez un nom, des initiales ou un code.' : null,
    year: !yearValid ? 'Année sur 4 chiffres (ex. 2004).' : null,
    sport: !sport ? 'Choisissez le sport.' : null,
  };
  const invalid = Object.values(errors).some(Boolean);

  const save = async () => {
    setTried(true);
    if (invalid || !sport || yearNumber === null) return;
    setSaving(true);
    setError(null);
    try {
      const input = { name: name.trim(), birth_year: yearNumber, sport, notes: notes.trim() || null };
      const saved = patient ? await updateScat6Patient(patient.id, input) : await createScat6Patient(input);
      onSaved(saved);
    } catch (e: any) {
      setError(e?.message ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!patient) return;
    const ok = await scat6Confirm(
      'Supprimer ce patient ?',
      `${patient.name} et ses ${patient.assessments_count} examen(s) ne seront plus visibles. Cette action est définitive.`,
      'Supprimer',
      true
    );
    if (!ok) return;
    try {
      await deleteScat6Patient(patient.id);
      onDeleted?.();
    } catch (e: any) {
      setError(e?.message ?? 'Suppression impossible.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.box}>
          <View style={styles.head}>
            <View style={styles.headIcon}>
              <Ionicons name={patient ? 'create-outline' : 'person-add-outline'} size={22} color={SCAT.card} />
            </View>
            <Text style={styles.title}>{patient ? 'Modifier le patient' : 'Nouveau patient'}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Fermer" hitSlop={8}>
              <Ionicons name="close" size={24} color={SCAT.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Scat6Notice>
              Données anonymisées : un nom libre (initiales, surnom, code de dossier…) et l’année de naissance suffisent.
            </Scat6Notice>

            <Scat6Field
              label="Nom"
              placeholder="ex. J.D. ou Dossier 2026-014"
              value={name}
              onChangeText={setName}
              maxLength={100}
              error={tried ? errors.name : null}
              autoFocus
            />

            <Scat6Field
              label="Année de naissance"
              placeholder="ex. 2004"
              value={year}
              onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              error={tried ? errors.year : null}
              hint={age !== null ? `≈ ${age} ans` : undefined}
            />
            {age !== null && age < MIN_AGE && (
              <Scat6Notice tone="warning">
                Moins de 13 ans : le SCAT6 ne s’applique pas (Child SCAT6). Le patient peut être créé mais aucun examen ne
                pourra être commencé.
              </Scat6Notice>
            )}

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Sport</Text>
              <View style={styles.sports}>
                {SPORTS.map((s) => (
                  <Scat6Choice
                    key={s.id}
                    label={s.label}
                    icon={SPORT_ICON[s.id]}
                    selected={sport === s.id}
                    onPress={() => setSport(s.id)}
                  />
                ))}
              </View>
              {tried && errors.sport ? <Text style={styles.error}>{errors.sport}</Text> : null}
            </View>

            <Scat6Field
              label="Notes (facultatif)"
              placeholder="Club, poste, commotions antérieures…"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={2000}
            />

            {error ? <Scat6Notice tone="danger">{error}</Scat6Notice> : null}
          </ScrollView>

          <View style={styles.foot}>
            {patient ? <Scat6Link title="Supprimer le patient" icon="trash-outline" danger onPress={remove} /> : <View />}
            <View style={styles.footButtons}>
              <Scat6Button title="Annuler" variant="secondary" onPress={onClose} />
              <Scat6Button title={patient ? 'Enregistrer' : 'Créer le patient'} icon="checkmark" loading={saving} onPress={save} />
            </View>
          </View>
        </View>
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
    maxWidth: 560,
    maxHeight: '92%' as any,
    backgroundColor: SCAT.page,
    borderRadius: 20,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.lg,
    paddingBottom: Spacings.md,
    backgroundColor: SCAT.card,
    borderBottomWidth: 1,
    borderBottomColor: SCAT.line,
  },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SCAT.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: 20,
    color: SCAT.blueInk,
  },
  body: {
    padding: Spacings.lg,
    gap: Spacings.md,
  },
  group: {
    gap: 6,
  },
  groupLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  sports: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: SCAT.danger,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    padding: Spacings.lg,
    paddingTop: Spacings.md,
    backgroundColor: SCAT.card,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
  },
  footButtons: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
});
