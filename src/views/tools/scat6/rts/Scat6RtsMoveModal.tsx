import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import {
  RESOLUTION_CHECKLIST,
  RTS_COMPETITION_STEP,
  RTS_CONTACT_STEP,
  RTS_RESOLUTION_STEP,
  RtsContext,
  RtsState,
  RtsStepNumber,
  moveWarnings,
  stepInfo,
} from '../../../../scat6/core/rts';
import { Scat6DateInput, todayIso } from '../components/Scat6DateInput';
import { Scat6Button, Scat6Field, Scat6Notice } from '../components/Scat6UI';
import { SCAT, FONTS } from '../scat6Theme';

export type RtsAction = { kind: 'move'; target: RtsStepNumber } | { kind: 'setback' };

interface Props {
  action: RtsAction | null;
  state: RtsState;
  ctx: RtsContext;
  saving: boolean;
  onClose: () => void;
  onConfirm: (input: { date: string; note: string | null; forced: boolean }) => void;
}

/** Titre du passage : les étapes 5 et 6 sont des autorisations du médecin. */
export const moveTitle = (target: number) =>
  target === RTS_CONTACT_STEP
    ? 'Autoriser l’entraînement avec contact'
    : target === RTS_COMPETITION_STEP
      ? 'Autoriser le retour à la compétition'
      : `Passer à l’étape ${target}`;

/**
 * Validation d'une étape (ou de plusieurs) et « symptômes revenus ».
 * Les règles non respectées s'affichent en avertissements ; le médecin peut confirmer quand même.
 */
export const Scat6RtsMoveModal: React.FC<Props> = ({ action, state, ctx, saving, onClose, onConfirm }) => {
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [checked, setChecked] = useState<boolean[]>(RESOLUTION_CHECKLIST.map(() => false));

  useEffect(() => {
    if (!action) return;
    setDate(todayIso());
    setNote('');
    setChecked(RESOLUTION_CHECKLIST.map(() => false));
  }, [action]);

  const isMove = action?.kind === 'move';
  const target = isMove ? action.target : null;
  // Entrée dans les étapes 4–6 : le médecin coche ce qu'il a vérifié (sinon avertissement).
  const needsResolution = !!target && state.current_step < RTS_RESOLUTION_STEP && target >= RTS_RESOLUTION_STEP;

  const warnings = useMemo(() => {
    if (!target || !date) return [];
    const list = moveWarnings(state, target, date, ctx).map((w) => w.text);
    if (needsResolution) {
      RESOLUTION_CHECKLIST.forEach((item, i) => {
        if (!checked[i]) list.push(`Non confirmé : ${item.charAt(0).toLowerCase()}${item.slice(1)}.`);
      });
    }
    return list;
  }, [target, date, state, ctx, needsResolution, checked]);

  if (!action) return null;

  const from = state.current_step;
  const backTo = from >= RTS_RESOLUTION_STEP ? 3 : from;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.box}>
          <View style={styles.head}>
            <View style={[styles.headIcon, !isMove && { backgroundColor: SCAT.warning }]}>
              <Ionicons name={isMove ? 'arrow-up-circle-outline' : 'refresh'} size={22} color={SCAT.card} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>{isMove ? moveTitle(target!) : 'Symptômes revenus'}</Text>
              <Text style={styles.subtitle}>
                {isMove ? `Étape ${target} · ${stepInfo(target!).title}` : `Pendant l’étape ${from} · ${stepInfo(from).title}`}
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Fermer" hitSlop={8}>
              <Ionicons name="close" size={24} color={SCAT.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {!isMove && (
              <Scat6Notice tone="warning">
                {from >= RTS_RESOLUTION_STEP
                  ? `Retour à l’étape 3 : vérifier que les symptômes ont disparu à l’effort avant les activités à risque.`
                  : `Arrêt de l’activité ; nouvel essai de l’étape ${from} le lendemain. L’étape reste en cours.`}
              </Scat6Notice>
            )}

            <View style={styles.dateRow}>
              <Text style={styles.label}>{isMove ? 'Date du passage' : 'Date'}</Text>
              <Scat6DateInput value={date} onChange={setDate} min={state.injury_at.slice(0, 10)} max={todayIso()} />
            </View>

            {needsResolution && (
              <View style={styles.checklist}>
                <Text style={styles.label}>Avant l’étape 4 (consensus d’Amsterdam 2022)</Text>
                {RESOLUTION_CHECKLIST.map((item, i) => (
                  <Pressable
                    key={item}
                    style={[styles.check, checked[i] && styles.checkOn]}
                    onPress={() => setChecked(checked.map((c, j) => (j === i ? !c : c)))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: checked[i] }}
                  >
                    <Ionicons name={checked[i] ? 'checkbox' : 'square-outline'} size={22} color={checked[i] ? SCAT.blue : SCAT.faint} />
                    <Text style={styles.checkText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {isMove && warnings.length > 0 && (
              <View style={styles.warnings}>
                <View style={styles.warningsHead}>
                  <Ionicons name="warning" size={18} color={SCAT.warning} />
                  <Text style={styles.warningsTitle}>À vérifier</Text>
                </View>
                {warnings.map((w) => (
                  <Text key={w} style={styles.warningText}>
                    • {w}
                  </Text>
                ))}
                <Text style={styles.warningFoot}>Vous pouvez confirmer : la décision est enregistrée à votre nom.</Text>
              </View>
            )}

            <Scat6Field
              label="Note (facultatif)"
              placeholder={isMove ? 'Consultation, appel, éléments vérifiés…' : 'Symptômes décrits, activité en cause…'}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={500}
            />
          </ScrollView>

          <View style={styles.foot}>
            <Scat6Button title="Annuler" variant="secondary" onPress={onClose} />
            <Scat6Button
              title={!isMove ? (backTo !== from ? 'Revenir à l’étape 3' : 'Enregistrer') : warnings.length ? 'Confirmer malgré tout' : 'Confirmer'}
              icon="checkmark"
              variant={isMove && warnings.length ? 'danger' : 'primary'}
              disabled={!date}
              loading={saving}
              onPress={() => onConfirm({ date, note: note.trim() || null, forced: isMove && warnings.length > 0 })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 32, 58, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
  },
  box: {
    width: '100%',
    maxWidth: 580,
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
    fontFamily: FONTS.title,
    fontSize: 19,
    color: SCAT.blueInk,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },
  body: {
    padding: Spacings.lg,
    gap: Spacings.md,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
  },
  checklist: {
    gap: Spacings.xs,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    backgroundColor: SCAT.card,
  },
  checkOn: {
    borderColor: SCAT.blue,
    backgroundColor: SCAT.blueSoft,
  },
  checkText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
  },
  warnings: {
    backgroundColor: SCAT.warningSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SCAT.warningLine,
    padding: Spacings.md,
    gap: 4,
  },
  warningsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningsTitle: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: '#6B4300',
  },
  warningText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B4300',
  },
  warningFoot: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.warning,
    marginTop: 4,
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacings.xs,
    padding: Spacings.lg,
    paddingTop: Spacings.md,
    backgroundColor: SCAT.card,
    borderTopWidth: 1,
    borderTopColor: SCAT.line,
  },
});
