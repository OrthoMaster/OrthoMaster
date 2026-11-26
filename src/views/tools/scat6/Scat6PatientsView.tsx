import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Spacings from '../../../../constants/Spacings';
import { DIAGNOSIS_LABEL, examLabel, sportLabel } from '../../../scat6/core/content';
import { getScat6Patients, Scat6Patient } from '../../../services/v2/Scat6Service';
import { Scat6PatientForm } from './components/Scat6PatientForm';
import { Scat6Badge, Scat6Button, Scat6Empty, Scat6Header, Scat6Loading, Scat6Notice } from './components/Scat6UI';
import { SPORT_ICON } from './components/scat6Icons';
import { SCAT6_PATIENTS_KEY, invalidateScat6 } from './scat6Queries';
import { initials, relativeDay } from './scat6Format';
import { SCAT, FONTS, PAGE_MAX_WIDTH, TAB_BAR_SPACE } from './scat6Theme';

/**
 * Accueil SCAT6 (web) : patients du médecin, activité la plus récente en tête.
 * Recherche instantanée sur le nom ; « Nouveau patient » ouvre le formulaire par-dessus la page.
 */
export const Scat6PatientsView = ({ navigation }: { navigation: any }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: patients, isLoading, isError, refetch } = useQuery({
    queryKey: SCAT6_PATIENTS_KEY,
    queryFn: () => getScat6Patients(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (patients ?? []).filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [patients, search]);

  const stats = useMemo(
    () => ({
      total: patients?.length ?? 0,
      drafts: (patients ?? []).reduce((s, p) => s + p.drafts_count, 0),
      withoutBaseline: (patients ?? []).filter((p) => !p.has_baseline).length,
    }),
    [patients]
  );

  const open = (p: Scat6Patient) => navigation.navigate('scat6-patient', { patientId: p.id });

  return (
    <View style={styles.page}>
      <Scat6Header
        title="SCAT6"
        subtitle="Évaluation de la commotion cérébrale du sportif · vos patients"
        right={<Scat6Button title="Nouveau patient" icon="person-add-outline" variant="light" small onPress={() => setCreating(true)} />}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {isLoading ? (
            <Scat6Loading />
          ) : isError ? (
            <Scat6Empty
              icon="cloud-offline-outline"
              title="Chargement impossible"
              message="Vérifiez votre connexion puis réessayez."
              action={<Scat6Button title="Réessayer" icon="refresh" onPress={() => refetch()} />}
            />
          ) : stats.total === 0 ? (
            <Scat6Empty
              icon="people-outline"
              title="Aucun patient pour l’instant"
              message="Créez un patient (nom libre et année de naissance), puis commencez une baseline ou un examen après un choc."
              action={<Scat6Button title="Créer le premier patient" icon="person-add-outline" onPress={() => setCreating(true)} />}
            />
          ) : (
            <>
              <View style={styles.stats}>
                <Stat icon="people" value={stats.total} label={stats.total > 1 ? 'patients' : 'patient'} />
                <Stat
                  icon="time"
                  value={stats.drafts}
                  label={stats.drafts > 1 ? 'examens en cours' : 'examen en cours'}
                  tone={stats.drafts ? 'draft' : undefined}
                />
                <Stat
                  icon="flag"
                  value={stats.withoutBaseline}
                  label="sans baseline"
                  tone={stats.withoutBaseline ? 'warning' : undefined}
                />
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={SCAT.faint} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un patient"
                  placeholderTextColor={SCAT.faint}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')} accessibilityLabel="Effacer la recherche">
                    <Ionicons name="close-circle" size={20} color={SCAT.faint} />
                  </Pressable>
                ) : null}
              </View>

              {filtered.length === 0 ? (
                <Scat6Notice>Aucun patient ne correspond à « {search} ».</Scat6Notice>
              ) : (
                <View style={styles.grid}>
                  {filtered.map((p) => (
                    <PatientCard key={p.id} patient={p} onPress={() => open(p)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Scat6PatientForm
        visible={creating}
        onClose={() => setCreating(false)}
        onSaved={(p) => {
          setCreating(false);
          invalidateScat6(queryClient);
          open(p);
        }}
      />
    </View>
  );
};

const Stat: React.FC<{ icon: keyof typeof Ionicons.glyphMap; value: number; label: string; tone?: 'draft' | 'warning' }> = ({
  icon,
  value,
  label,
  tone,
}) => {
  const color = tone === 'draft' ? SCAT.draft : tone === 'warning' ? SCAT.warning : SCAT.blue;
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const PatientCard: React.FC<{ patient: Scat6Patient; onPress: () => void }> = ({ patient: p, onPress }) => {
  const last = p.last_assessment;
  return (
    <Pressable style={({ hovered }: any) => [styles.card, hovered && styles.cardHover]} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(p.name)}</Text>
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.cardName} numberOfLines={1}>
            {p.name}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons name={SPORT_ICON[p.sport] ?? 'fitness-outline'} size={14} color={SCAT.muted} />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {sportLabel(p.sport)} · né·e en {p.birth_year}
              {p.age !== null ? ` (≈ ${p.age} ans)` : ''}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={SCAT.blueLine} />
      </View>

      <View style={styles.badges}>
        {p.has_baseline ? (
          <Scat6Badge label="Baseline" tone="success" icon="checkmark-circle" />
        ) : (
          <Scat6Badge label="Pas de baseline" tone="warning" icon="flag-outline" />
        )}
        {p.drafts_count > 0 && (
          <Scat6Badge label={p.drafts_count > 1 ? `${p.drafts_count} examens en cours` : 'Examen en cours'} tone="draft" icon="time-outline" />
        )}
        {p.age !== null && p.age < 13 && <Scat6Badge label="Moins de 13 ans" tone="danger" />}
      </View>

      <View style={styles.cardFoot}>
        <Text style={styles.cardFootText} numberOfLines={1}>
          {last
            ? `${relativeDay(last.updated_at)} · ${examLabel(last.exam_kind)}${
                last.status === 'completed' && last.diagnosis ? ` · commotion : ${DIAGNOSIS_LABEL[last.diagnosis]}` : ''
              }${last.status === 'draft' ? ' · en cours' : ''}`
            : 'Aucun examen'}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /* ---- Page ---- */
  page: {
    flex: 1,
    backgroundColor: SCAT.page,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacings.lg,
    paddingBottom: TAB_BAR_SPACE + Spacings.lg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    gap: Spacings.md,
  },

  /* ---- Chiffres ---- */
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: SCAT.blueInk,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: SCAT.muted,
  },

  /* ---- Recherche ---- */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    backgroundColor: SCAT.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    paddingHorizontal: Spacings.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.body,
    fontSize: 16,
    color: SCAT.text,
    outlineStyle: 'none',
  } as any,

  /* ---- Cartes ---- */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: 340,
    maxWidth: '100%',
    backgroundColor: SCAT.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    borderBottomWidth: 4,
    borderBottomColor: SCAT.blueLine,
    padding: Spacings.md,
    gap: Spacings.sm,
  },
  cardHover: {
    borderColor: SCAT.blue,
    borderBottomColor: SCAT.blueDark,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SCAT.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: 17,
    color: SCAT.card,
  },
  cardTitles: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: SCAT.blueInk,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMetaText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardFoot: {
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
    paddingTop: Spacings.xs,
  },
  cardFootText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
});
