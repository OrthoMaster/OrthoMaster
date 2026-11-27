import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { DISCLAIMER, INSTRUCTIONS, STEP_INFO } from '../../../../scat6/core/content';
import { compareWithBaseline, summarize, unfavorableSignals } from '../../../../scat6/core/scoring';
import { scat6Confirm } from '../components/Scat6Dialog';
import type { Diagnosis, ListId, Neuro, Scat6Summary } from '../../../../scat6/core/types';
import { Scat6Button, Scat6Card, Scat6Choice, Scat6Field, Scat6Notice, Scat6SectionTitle } from '../components/Scat6UI';
import { Scat6CompareTable } from '../components/Scat6Results';
import { formatDate } from '../scat6Format';
import { SCAT, FONTS } from '../scat6Theme';
import type { StepProps } from './stepTypes';

interface DecisionProps extends StepProps {
  baseline: { summary: Scat6Summary | null; word_list: ListId; completed_at: string | null } | null;
  doctorName: string;
  signing: boolean;
  onSign: (input: { diagnosis: Diagnosis | null; neuro: Neuro | null; notes: string }) => void;
}

/**
 * Étape 6 : résumé à côté de la baseline (aucun seuil, aucun verdict), examen neurologique,
 * diagnostic Oui / Non / Différé, notes, attestation du médecin. La signature fige l'examen.
 */
export const DecisionStep: React.FC<DecisionProps> = ({ record, data, baseline, doctorName, signing, onSign }) => {
  const isBaseline = record.exam_kind === 'baseline';
  const [neuro, setNeuro] = useState<Neuro | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [notes, setNotes] = useState('');
  const [attested, setAttested] = useState(false);
  const [tried, setTried] = useState(false);

  const summary = summarize(data);
  const rows = compareWithBaseline(summary, isBaseline ? null : baseline?.summary ?? null);

  // Parties sans score (non réalisées ou incomplètes) : rappelées avant de signer.
  const notDone = [
    summary.symptom_count === null && STEP_INFO.symptomes.title,
    summary.orientation === null && STEP_INFO.orientation.title,
    summary.immediate === null && STEP_INFO.memoire.title,
    summary.concentration === null && STEP_INFO.concentration.title,
    summary.mbess === null && STEP_INFO.equilibre.title,
    summary.delayed === null && STEP_INFO['memoire-differee'].title,
  ].filter(Boolean) as string[];

  const missingDiagnosis = !isBaseline && !diagnosis;

  /**
   * « Non » n'est jamais retenu sans confirmation : c'est l'état favorable (aucune restriction).
   * Les éléments défavorables de l'examen sont rappelés dans la confirmation.
   */
  const chooseNo = async () => {
    const signals = unfavorableSignals(summary, baseline?.summary ?? null, neuro);
    const message = signals.length
      ? `Éléments défavorables dans cet examen :\n• ${signals.join('\n• ')}\n\nAucune restriction sportive ne sera enregistrée pour ce patient.`
      : 'Aucune restriction sportive ne sera enregistrée pour ce patient.';
    if (await scat6Confirm('Pas de commotion retenue ?', message, 'Confirmer « Non »', signals.length > 0)) setDiagnosis('non');
  };

  const sign = () => {
    setTried(true);
    if (missingDiagnosis || !attested) return;
    onSign({ diagnosis: isBaseline ? null : diagnosis, neuro: isBaseline ? null : neuro, notes: notes.trim() });
  };

  return (
    <>
      <Scat6Card>
        <Scat6SectionTitle
          title={isBaseline ? 'Résultats de la baseline' : 'Comparaison avec la baseline'}
          hint={
            !isBaseline && baseline
              ? `Baseline du ${formatDate(baseline.completed_at)} · liste ${baseline.word_list}`
              : null
          }
        />
        <Scat6CompareTable rows={rows} withBaseline={!isBaseline} />
        {!isBaseline && !baseline && (
          <Scat6Notice tone="warning">Aucune baseline signée pour ce patient : interprétation clinique sans comparaison.</Scat6Notice>
        )}
        {!isBaseline && baseline && baseline.word_list !== data.tests.memory.list && (
          <Scat6Notice>
            Liste de mots différente de la baseline ({baseline.word_list}) : les listes SCAT6 sont équivalentes.
          </Scat6Notice>
        )}
        {notDone.length > 0 && <Scat6Notice tone="warning">Sans score (non réalisé ou incomplet) : {notDone.join(', ')}.</Scat6Notice>}
        <Scat6Notice>{DISCLAIMER}</Scat6Notice>
      </Scat6Card>

      {!isBaseline && (
        <Scat6Card>
          {record.exam_kind === 'post_choc' && (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Examen neurologique</Text>
              <View style={styles.row}>
                <Scat6Choice label="Normal" selected={neuro === 'normal'} onPress={() => setNeuro('normal')} />
                <Scat6Choice label="Anormal" tone="warning" selected={neuro === 'anormal'} onPress={() => setNeuro('anormal')} />
                <Scat6Choice label="Non réalisé" selected={neuro === 'non_realise'} onPress={() => setNeuro('non_realise')} />
              </View>
            </View>
          )}
          <View style={[styles.group, tried && missingDiagnosis && styles.groupMissing]}>
            <Text style={styles.groupTitle}>Commotion cérébrale diagnostiquée ?</Text>
            <View style={styles.row}>
              <Scat6Choice label="Oui" tone="danger" selected={diagnosis === 'oui'} onPress={() => setDiagnosis('oui')} style={styles.diag} />
              <Scat6Choice label="Non" selected={diagnosis === 'non'} onPress={chooseNo} style={styles.diag} />
              <Scat6Choice label="Différé" tone="warning" selected={diagnosis === 'differe'} onPress={() => setDiagnosis('differe')} style={styles.diag} />
            </View>
            {diagnosis === 'differe' && <Text style={styles.help}>En cas de doute : re-tester le lendemain ou avant 72 h.</Text>}
            {diagnosis === 'oui' && (
              <Text style={styles.help}>À la signature, le suivi « retour au sport » (6 étapes) s’ouvre pour ce patient.</Text>
            )}
            {tried && missingDiagnosis && <Text style={styles.error}>Choisissez Oui, Non ou Différé.</Text>}
          </View>
        </Scat6Card>
      )}

      <Scat6Card>
        <Scat6Field label="Notes cliniques" value={notes} onChangeText={setNotes} multiline maxLength={5000} />

        <Pressable
          style={[styles.attest, attested && styles.attestOn, tried && !attested && styles.groupMissing]}
          onPress={() => setAttested(!attested)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: attested }}
        >
          <Ionicons name={attested ? 'checkbox' : 'square-outline'} size={24} color={attested ? SCAT.blue : SCAT.faint} />
          <Text style={styles.attestText}>{INSTRUCTIONS.attestation}</Text>
        </Pressable>
        {tried && !attested && <Text style={styles.error}>Cochez l’attestation pour signer.</Text>}

        <View style={styles.signRow}>
          <Text style={styles.help}>
            Signé par : <Text style={styles.signName}>Dr {doctorName}</Text> · l’examen ne pourra plus être modifié.
          </Text>
          <Scat6Button
            title={isBaseline ? 'Enregistrer la baseline' : 'Signer et enregistrer'}
            icon="create-outline"
            loading={signing}
            onPress={sign}
          />
        </View>
      </Scat6Card>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  group: {
    gap: Spacings.xs,
    padding: Spacings.xs,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupMissing: {
    borderColor: SCAT.draft,
    backgroundColor: SCAT.draftSoft,
  },
  groupTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: SCAT.text,
  },
  diag: {
    minWidth: 120,
  },
  help: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: SCAT.danger,
  },
  attest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: SCAT.line,
  },
  attestOn: {
    borderColor: SCAT.blue,
    backgroundColor: SCAT.blueSoft,
  },
  attestText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  signRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
    paddingTop: Spacings.md,
  },
  signName: {
    fontFamily: FONTS.medium,
    color: SCAT.text,
  },
});
