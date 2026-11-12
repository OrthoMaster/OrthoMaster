import React from 'react';
import { Modal, View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import {
  DailyActionGroup,
  DailyActionItem,
  ACTION_THEMES,
  groupSummary,
  itemStatusLabel,
} from './dailyActions';

/** Liste centrée des éléments d'un groupe, ouverte quand le groupe en contient plusieurs. */
export const DailyActionPicker = ({
  group,
  onClose,
  onSelect,
}: {
  group: DailyActionGroup | null;
  onClose: () => void;
  onSelect: (item: DailyActionItem) => void;
}) => {
  // Le contenu reste affiché pendant le fondu de fermeture, sinon la boîte se vide avant de disparaître.
  const [shown, setShown] = React.useState<DailyActionGroup | null>(group);
  React.useEffect(() => {
    if (group) setShown(group);
  }, [group]);

  const current = group ?? shown;
  if (!current) return null;
  const theme = ACTION_THEMES[current.type];

  return (
    <Modal visible={!!group} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />

        <View style={styles.dialog} accessibilityRole={Platform.OS === 'web' ? ('dialog' as any) : undefined}>
          {/* ---- En-tête ---- */}
          <View style={styles.header}>
            <View style={[styles.headerTile, { backgroundColor: theme.tile }]}>
              <Image source={{ uri: theme.image }} resizeMode="contain" style={styles.headerImage} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>{theme.sheetTitle}</Text>
              <Text style={styles.headerSummary}>{groupSummary(current)}</Text>
            </View>
            <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={Colors.text} />
            </Pressable>
          </View>

          {/* ---- Éléments ---- */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {current.items.map((item, index) => {
              const status = itemStatusLabel(item);
              const isLast = index === current.items.length - 1;

              return (
                <Pressable
                  key={`${item.type}-${item.id}`}
                  onPress={() => onSelect(item)}
                  accessibilityRole="button"
                  style={(state: any) => [
                    styles.row,
                    !isLast && styles.rowDivider,
                    (state.hovered || state.pressed) && styles.rowActive,
                  ]}
                >
                  <View style={styles.rowTexts}>
                    <Text style={[styles.rowTitle, !item.isNew && styles.rowTitleSeen]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.rowMeta}>
                      {item.isNew && <View style={styles.rowDot} />}
                      <Text style={styles.rowMetaText} numberOfLines={1}>
                        {[status, ...item.meta].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>

                  <RowAction item={item} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/** Lecture pour un podcast, coche pour un quiz déjà répondu, flèche sinon. */
const RowAction = ({ item }: { item: DailyActionItem }) => {
  if (item.type === 'quiz' && item.isDone) {
    return (
      <View style={styles.actionSlot}>
        <View style={styles.doneCircle}>
          <Ionicons name="checkmark" size={16} color={Colors.success} />
        </View>
      </View>
    );
  }

  const active = item.isNew;
  return (
    <View style={[styles.actionCircle, { backgroundColor: active ? Colors.primaryLightBackground : Colors.grayLight }]}>
      <Ionicons
        name={item.type === 'podcast' ? 'play' : 'chevron-forward'}
        size={item.type === 'podcast' ? 16 : 18}
        color={active ? Colors.primary : Colors.gray}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Boîte ---- */
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayWarm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 26,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.xxs,
  },

  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingBottom: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
  },
  headerTile: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    width: 44,
    height: 44,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  headerSummary: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Lignes ---- */
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xxs,
    borderRadius: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  rowActive: {
    backgroundColor: Colors.warmBackground,
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  rowTitleSeen: {
    fontFamily: 'Poppins-Regular',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  rowMetaText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },

  /* ---- Action ---- */
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.successBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
