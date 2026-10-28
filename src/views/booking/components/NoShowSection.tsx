import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert, LayoutAnimation, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingResult, MyBookingBlock, NoShowInfo, NoShowInput, fieldError } from '../../../services/v2/BookingService';
import { PERIOD_ICONS, PERIOD_LABELS } from '../experts/components/SlotPicker';
import { formatDeadline, formatShortDay } from '../appointments/appointmentFormat';

const REPORT_STATUS: Record<NonNullable<NoShowInfo['report']>['status'], string> = {
  open: "en cours d'examen par l'équipe OrthoMaster",
  resolved: "traité par l'équipe OrthoMaster",
  dismissed: "classé par l'équipe OrthoMaster",
};

interface NoShowSectionProps {
  noshow: NoShowInfo;
  blocks: MyBookingBlock[];
  /** « l'expert » ou « le confrère » : la personne absente. */
  counterpart: string;
  onSubmit: (input: NoShowInput) => Promise<BookingResult<any>>;
  /** Appelé avec la fiche à jour après un envoi réussi. */
  onDone: (detail: any) => void;
}

/**
 * Signalement d'absence d'un rendez-vous accepté : bouton, puis formulaire déplié
 * (demi-journées manquées, message), puis état du signalement une fois envoyé.
 * Ouvert du début du rendez-vous à 24 h après sa dernière demi-journée.
 */
export const NoShowSection: React.FC<NoShowSectionProps> = ({ noshow, blocks, counterpart, onSubmit, onDone }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const reportable = blocks.filter((b) => noshow.reportable_block_ids.includes(b.id));

  // Signalement déjà envoyé : son état, sans action.
  if (noshow.report) {
    return (
      <View style={styles.sent}>
        <Ionicons name="flag" size={18} color={Colors.warning} />
        <Text style={styles.sentText}>
          Absence signalée{noshow.report.created_at ? ` le ${formatDeadline(noshow.report.created_at)}` : ''} ·{' '}
          {REPORT_STATUS[noshow.report.status]}.
        </Text>
      </View>
    );
  }

  if (!noshow.can_report || reportable.length === 0) return null;

  const toggle = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));

  const submit = async () => {
    setSubmitted(true);
    if (selected.length === 0) return;

    setBusy(true);
    const result = await onSubmit({ block_ids: selected, note: note.trim() || null });
    setBusy(false);

    if (result.ok === false) {
      Alert.alert(
        'Signalement impossible',
        fieldError(result.errors, 'block_ids') ?? fieldError(result.errors, 'note') ?? result.message ?? 'Vérifiez votre connexion puis réessayez.'
      );
      return;
    }
    animate();
    onDone(result.data);
  };

  if (!open) {
    return (
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => {
          animate();
          setOpen(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.triggerText}>Signaler une absence</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Signaler l'absence de {counterpart}</Text>
      <Text style={styles.hint}>Possible jusqu'à 24 h après la dernière demi-journée. L'équipe OrthoMaster vous recontactera.</Text>

      <Text style={styles.label}>Demi-journée(s) concernée(s)</Text>
      {reportable.map((block) => {
        const on = selected.includes(block.id);
        return (
          <Pressable
            key={block.id}
            style={styles.option}
            onPress={() => toggle(block.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
          >
            <View style={[styles.checkbox, on && styles.checkboxOn]}>
              {on && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={16} color={Colors.lblueDark} />
            <Text style={styles.optionText}>
              {formatShortDay(block.date)} · {PERIOD_LABELS[block.period]} {block.start_local} – {block.end_local}
            </Text>
          </Pressable>
        );
      })}
      {submitted && selected.length === 0 ? <Text style={styles.error}>Choisissez au moins une demi-journée.</Text> : null}

      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Que s'est-il passé ? (facultatif)"
        placeholderTextColor={Colors.subtext}
        multiline
        textAlignVertical="top"
        maxLength={noshow.note_max}
        editable={!busy}
      />

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.confirm} onPress={submit} disabled={busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.confirmText}>Envoyer le signalement</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.back}
          onPress={() => {
            animate();
            setOpen(false);
            setSubmitted(false);
          }}
          disabled={busy}
        >
          <Text style={styles.backText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Bouton ---- */
  trigger: {
    alignSelf: 'flex-start',
    height: 40,
    minWidth: 160,
    paddingHorizontal: Spacings.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
    backgroundColor: Colors.warningBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.warning,
  },

  /* ---- Formulaire ---- */
  card: {
    padding: Spacings.md,
    borderRadius: 18,
    backgroundColor: Colors.white,
    gap: Spacings.xs,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext,
    marginTop: Spacings.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
  input: {
    minHeight: 72,
    marginTop: Spacings.xs,
    padding: Spacings.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginTop: Spacings.xs,
  },
  confirm: {
    height: 40,
    paddingHorizontal: Spacings.md,
    borderRadius: 10,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  back: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacings.sm,
  },
  backText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.subtext,
  },

  /* ---- Envoyé ---- */
  sent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warning,
    backgroundColor: Colors.warningBackground,
  },
  sentText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
});