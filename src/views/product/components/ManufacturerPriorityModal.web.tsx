import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { palette } from '../lib/Theme';

// Web-only style prop not present in React Native's type definitions.
const webClickable = { cursor: 'pointer' } as any;
const webGrab = { cursor: 'grab' } as any;

type ManufacturerPriorityModalProps = {
  visible: boolean;
  onClose: () => void;
  // Full list of available manufacturers (fixed set).
  allManufacturers: string[];
  // Current saved priority order — used to seed the modal state.
  initialPriority: string[];
  // Called when user taps "Apply". Pass the new priority order back.
  onApply: (priority: string[]) => void;
};

export function ManufacturerPriorityModal({
  visible, onClose, allManufacturers, initialPriority, onApply,
}: ManufacturerPriorityModalProps) {
  const [priority, setPriority] = useState<string[]>(initialPriority);

  // Index currently being dragged (HTML5 drag). Null when not dragging.
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Re-seed state every time the modal opens, so cancelling = discard changes
  useEffect(() => {
    if (visible) setPriority(initialPriority);
  }, [visible, initialPriority]);

  // Manufacturers NOT in the priority list, alphabetically.
  const available = allManufacturers
    .filter(m => !priority.includes(m))
    .sort((a, b) => a.localeCompare(b));

  const addToPriority = (name: string) => {
    setPriority(prev => [...prev, name]);
  };
  const removeFromPriority = (name: string) => {
    setPriority(prev => prev.filter(m => m !== name));
  };

  // Move an item from one index to another, returning a new array.
  const moveItem = (from: number, to: number) => {
    setPriority(prev => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleApply = () => {
    onApply(priority);
    onClose();
  };
  const handleClear = () => setPriority([]);

  // ---- HTML5 drag handlers (web). Attached to each priority row's
  // underlying <div> via DOM props forwarded by react-native-web. ----
  const onDragStart = (index: number) => {
    dragIndex.current = index;
  };
  const onDragOver = (index: number, e: any) => {
    // Must preventDefault to allow a drop.
    if (e?.preventDefault) e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };
  const onDrop = (index: number) => {
    const from = dragIndex.current;
    if (from != null && from !== index) {
      moveItem(from, index);
    }
    dragIndex.current = null;
    setDragOverIndex(null);
  };
  const onDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  // Render one priority row: rank, drag handle, name, up/down arrows, remove.
  const renderPriorityRow = (item: string, i: number) => {
    const isFirst = i === 0;
    const isLast = i === priority.length - 1;
    const isDragTarget = dragOverIndex === i;

    // DOM props for HTML5 drag — cast through any since RN's View types
    // don't include them (react-native-web forwards them to the <div>).
    const dragProps = {
      draggable: true,
      onDragStart: () => onDragStart(i),
      onDragOver: (e: any) => onDragOver(i, e),
      onDrop: () => onDrop(i),
      onDragEnd: onDragEnd,
    } as any;

    return (
      <View
        key={item}
        {...dragProps}
        style={[
          styles.row,
          styles.rowPriority,
          webGrab,
          isDragTarget && styles.rowDragOver,
        ]}
      >
        <View style={styles.rowDragArea}>
          <Ionicons
            name="reorder-three"
            size={22}
            color={palette.textSecondary}
            style={styles.dragIcon}
          />
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{i + 1}</Text>
          </View>
          <Text style={styles.rowName} numberOfLines={1}>{item}</Text>
        </View>

        {/* Up / down reorder buttons — always work, no drag needed. */}
        <TouchableOpacity
          onPress={() => moveItem(i, i - 1)}
          disabled={isFirst}
          style={[styles.arrowBtn, webClickable, isFirst && styles.arrowBtnDisabled]}
          hitSlop={4}
        >
          <Ionicons
            name="chevron-up"
            size={18}
            color={isFirst ? palette.textMuted : palette.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moveItem(i, i + 1)}
          disabled={isLast}
          style={[styles.arrowBtn, webClickable, isLast && styles.arrowBtnDisabled]}
          hitSlop={4}
        >
          <Ionicons
            name="chevron-down"
            size={18}
            color={isLast ? palette.textMuted : palette.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => removeFromPriority(item)}
          style={[styles.removeBtn, webClickable]}
          hitSlop={6}
        >
          <Ionicons name="close-circle" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Priorité Fabricants</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={webClickable}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Sélectionnez les fabricants à afficher en priorité.
          </Text>

          {/* Priority section header */}
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                Affichés en priorité
                {priority.length > 0 && (
                  <Text style={styles.sectionCount}>  ({priority.length})</Text>
                )}
              </Text>
              {priority.length > 1 && (
                <Text style={styles.sectionSubtitle}>
                  Glissez une ligne ou utilisez les flèches pour changer l'ordre.
                </Text>
              )}
            </View>
            {priority.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={8} style={webClickable}>
                <Text style={styles.clearText}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Priority list */}
          {priority.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Aucun fabricant prioritaire. Sélectionnez ci-dessous.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.priorityScroll}
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {priority.map((item, i) => renderPriorityRow(item, i))}
            </ScrollView>
          )}

          {/* Available section — wrapping pills */}
          {available.length > 0 && (
            <ScrollView
              style={styles.availableScroll}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Autres fabricants
                  <Text style={styles.sectionCount}>  ({available.length})</Text>
                </Text>
              </View>
              <View style={styles.availablePills}>
                {available.map(name => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.availablePill, webClickable]}
                    onPress={() => addToPriority(name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add"
                      size={14}
                      color={palette.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.availablePillText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Footer actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.closeBtn, webClickable]} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.applyBtn, webClickable]} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Centered modal sheet, same pattern as ShareQrModal.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 66, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: palette.cardBg,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: palette.textMuted,
    lineHeight: 15,
    marginBottom: 4
  },
  sectionCount: {
    fontWeight: '500',
    color: palette.textMuted,
    letterSpacing: 0,
    textTransform: 'none',
  },
  clearText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyBox: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: palette.textMuted,
    fontStyle: 'italic',
  },

  // Priority list scroll region — capped so the available section stays
  // visible below it.
  priorityScroll: {
    maxHeight: 360,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: palette.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    marginHorizontal: 4,
  },
  rowPriority: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  // Highlight the row currently under the dragged item.
  rowDragOver: {
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  rowDragArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingLeft: 10,
    paddingRight: 6,
  },
  dragIcon: {
    marginRight: 6,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  rowName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  // Up / down arrow buttons.
  arrowBtn: {
    width: 30,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  availablePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  availablePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  availableScroll: {
    flexGrow: 0,
    maxHeight: 200,
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});