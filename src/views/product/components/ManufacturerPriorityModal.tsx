import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { palette } from '../lib/Theme';

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

  const handleApply = () => {
    onApply(priority);
    onClose();
  };
  const handleClear = () => setPriority([]);

  // Render a priority row inside the draggable list.
  // ScaleDecorator gives a nice "lifting" visual while dragging.
  const renderPriorityItem = ({ item, drag, isActive, getIndex }: RenderItemParams<string>) => {
    const i = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <View style={[styles.row, styles.rowPriority, isActive && styles.rowDragging]}>
          {/* Drag handle area covers icon + rank + name — long-press anywhere
              here to start dragging. Only the X button is excluded so the
              user can still tap to remove without triggering a drag. */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={150}
            style={styles.rowDragArea}
            activeOpacity={0.8}
          >
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
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => removeFromPriority(item)}
            style={styles.removeBtn}
            hitSlop={6}
          >
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* GestureHandlerRootView is required for draggable-flatlist gestures.
            Wrapping just the card (not the backdrop) keeps backdrop tap-to-close. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Priorité Marques</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={30} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              Sélectionnez les marques à afficher en priorité.
            </Text>

            {/* Priority section header */}
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Afficher en priorité
                  {priority.length > 0 && (
                    <Text style={styles.sectionCount}>  ({priority.length})</Text>
                  )}
                </Text>
                {priority.length > 1 && (
                  <Text style={styles.sectionSubtitle}>
                    Maintenez l'icône ou le nom pour changer l'ordre.
                  </Text>
                )}
              </View>
              {priority.length > 0 && (
                <TouchableOpacity onPress={handleClear} hitSlop={8}>
                  <Text style={styles.clearText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Priority list — draggable */}
            {priority.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Aucun fabricant prioritaire. Sélectionnez ci-dessous.
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                data={priority}
                keyExtractor={item => item}
                renderItem={renderPriorityItem}
                onDragEnd={({ data }) => setPriority(data)}
                activationDistance={8}
                containerStyle={{ maxHeight: 280 }}
              />
            )}

            {/* Available section — wrapping pills, NOT full-width rows */}
            {available.length > 0 && (
              <ScrollView
                style={styles.availableScroll}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Autres marques
                    <Text style={styles.sectionCount}>  ({available.length})</Text>
                  </Text>
                </View>
                <View style={styles.availablePills}>
                  {available.map(name => (
                    <TouchableOpacity
                      key={name}
                      style={styles.availablePill}
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
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.closeText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
                <Text style={styles.applyText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </GestureHandlerRootView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 66, 0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: palette.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 60,
    height: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
    marginBottom: 0
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: palette.textSecondary,
    marginBottom: 6,
    width: '70%'
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: palette.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Roboto',
    color: palette.textMuted,
    letterSpacing: 0.3,
    marginBottom: 12
  },
  sectionCount: {
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    textTransform: 'none',
  },
  clearText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
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
    fontSize: 14,
    fontFamily: 'Roboto',
    color: palette.textMuted,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: palette.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    // Outer row has NO horizontal padding — that prevents ScaleDecorator's
    // grow-on-press from being clipped at the edges. Padding lives on the
    // inner drag area + the X button instead.
    marginHorizontal: 4,
  },
  rowPriority: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  rowDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
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
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.4,
    color: palette.textPrimary,
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  // Available manufacturers — wrapping pills (not full-width rows)
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
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
  },

  availableScroll: {
    flex: 1,
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
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
});