import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { isNodeVisible, MainNode, Selections } from '../lib/Logic';
import { accentForIndex, palette } from '../lib/Theme';

type FilterSummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  nodes: MainNode[];
  selections: Selections;
};

// Walk the rule tree and check if `targetIds` appears anywhere.
function ruleRefsAnyOf(rule: any, targetIds: Set<string>): boolean {
  if (!rule) return false;
  if ('kind' in rule) {
    if (rule.kind === 'selected' || rule.kind === 'any_selected') {
      return targetIds.has(rule.nodeId);
    }
    return false;
  }
  if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') {
      return rule.rules.some((r: any) => ruleRefsAnyOf(r, targetIds));
    }
    if (rule.op === 'NOT') return ruleRefsAnyOf(rule.rule, targetIds);
  }
  return false;
}

// Find linked nodes (transitively) of a root node.
function collectLinked(
  root: MainNode,
  allNodes: MainNode[],
  selections: Selections,
): MainNode[] {
  const result: MainNode[] = [];
  const inResult = new Set<string>([root.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of allNodes) {
      if (inResult.has(n.id)) continue;
      if (!isNodeVisible(n, selections)) continue;
      if (ruleRefsAnyOf(n.visibilityRule, inResult)) {
        result.push(n);
        inResult.add(n.id);
        changed = true;
      }
    }
  }
  return result;
}

// Same logic as in SolarFilterScreen — kept here so the modal is self-contained.
// Multi-select planet: aggregate all linked values.
// Single-select: deepest linked node's selection only.
function selectedLabelsForPlanet(
  planet: MainNode,
  allNodes: MainNode[],
  selections: Selections,
): string[] {
  const linked = collectLinked(planet, allNodes, selections);
  const isIndicator = planet.selectionType === 'multi';

  if (isIndicator) {
    const labels: string[] = [];
    linked.forEach(n => {
      const sels = selections[n.id] || [];
      sels.forEach(s => {
        const child = n.children.find(c => c.id === s);
        if (child) labels.push(child.label);
      });
    });
    return labels;
  } else {
    // Walk linked deep → shallow, return first match
    for (let i = linked.length - 1; i >= 0; i--) {
      const n = linked[i];
      const sels = selections[n.id] || [];
      if (sels.length > 0) {
        const child = n.children.find(c => c.id === sels[0]);
        if (child) return [child.label];
      }
    }
    const ownSels = selections[planet.id] || [];
    if (ownSels.length > 0) {
      const child = planet.children.find(c => c.id === ownSels[0]);
      if (child) return [child.label];
    }
    return [];
  }
}

export function FilterSummaryModal({
  visible, onClose, onReset, nodes, selections,
}: FilterSummaryModalProps) {
  // Only roots = planets
  const rootNodes = nodes.filter(n => n.visibilityRule == null);
  // Only show planets that actually have any (transitive) selection
  const planetsWithLabels = rootNodes
    .map(n => ({
      node: n,
      labels: selectedLabelsForPlanet(n, nodes, selections),
    }))
    .filter(x => x.labels.length > 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Filtres de pathologie sélectionnés</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {planetsWithLabels.length === 0 ? (
              <Text style={styles.empty}>No pathology filters set.</Text>
            ) : (
              planetsWithLabels.map(({ node, labels }) => {
                const accent = accentForIndex(rootNodes.indexOf(node));
                return (
                  <View key={node.id} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: accent.strong }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{node.title}</Text>
                      <View style={styles.chipRow}>
                        {labels.map((l, i) => (
                          <View
                            key={i}
                            style={[
                              styles.chip,
                              { backgroundColor: accent.soft, borderColor: accent.strong },
                            ]}
                          >
                            <Text style={[styles.chipText, { color: accent.text }]} numberOfLines={1}>
                              {l}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.85}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 22,
    maxHeight: '80%',
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
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  scroll: {
    maxHeight: 480,
  },
  empty: {
    fontStyle: 'italic',
    color: palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: 'transparent',
  },
  closeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: palette.textSecondary,
    letterSpacing: 0.2,
  },
  resetBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#EF4444',
  },
  resetText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});