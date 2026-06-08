import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { ChildNode, isChildVisible, isNodeVisible, MainNode, Selections } from '../lib/Logic';
import { Accent, palette } from '../lib/Theme';

type OptionsSheetProps = {
  visible: boolean;
  rootNode: MainNode | null;          // the planet that was tapped
  allNodes: MainNode[];               // full tree (to find linked children)
  selections: Selections;
  accent: Accent | null;
  onClose: () => void;
  onToggle: (nodeId: string, childId: string) => void;
  onNext: () => void;                 // cycle to next planet
};

// Tappable choice pill — same look as previous version.
function ChoicePill({
  child, selected, accent, onPress,
}: {
  child: ChildNode;
  selected: boolean;
  accent: Accent;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }).start()}
        style={[
          styles.pill,
          selected
            ? { backgroundColor: accent.strong, borderColor: accent.strong }
            : { backgroundColor: accent.soft, borderColor: 'transparent' },
        ]}
      >
        {selected && <Text style={[styles.pillCheck, { color: accent.textOn }]}>✓</Text>}
        <Text style={[
          styles.pillText,
          { color: selected ? accent.textOn : accent.text },
          selected && { fontWeight: '700' },
        ]}>
          {child.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Render one section of options for a given node.
function NodeSection({
  node, selections, accent, onToggle, isPrimary,
}: {
  node: MainNode;
  selections: Selections;
  accent: Accent;
  onToggle: (nodeId: string, childId: string) => void;
  isPrimary: boolean;
}) {
  const sels = selections[node.id] || [];
  const visibleChildren = node.children.filter(c => isChildVisible(c, selections));
  const isMulti = node.selectionType === 'multi';

  return (
    <View style={[styles.section, !isPrimary && styles.sectionLinked]}>
      <View style={styles.sectionHeader}>
        {!isPrimary && <View style={[styles.linkDot, { backgroundColor: accent.strong }]} />}
        <Text style={[styles.sectionTitle, !isPrimary && styles.sectionTitleLinked]}>
          {node.title}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.sectionMeta}>
          {isMulti ? 'multiple' : 'one only'}
        </Text>
      </View>

      <View style={styles.options}>
        {visibleChildren.length === 0 ? (
          <Text style={styles.empty}>No options available</Text>
        ) : (
          visibleChildren.map(child => (
            <ChoicePill
              key={child.id}
              child={child}
              selected={sels.includes(child.id)}
              accent={accent}
              onPress={() => onToggle(node.id, child.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

// Find all nodes transitively unlocked starting from rootNode.
//
// Default behavior (no `parentNodeId` set on a node): BFS — a node N is
// included if its visibility rule references rootNode OR any node already
// in the result set, AND it's currently visible.
//
// Override (`parentNodeId` set on a node):
//   - If parentNodeId points at a valid root planet (a node with no
//     visibilityRule), the node is FORCED into that planet's sheet only.
//     It will NOT appear in any other sheet, regardless of BFS.
//   - If parentNodeId is invalid (node not found, or points at a non-root
//     node), the override is ignored and the node falls back to BFS.
//
// Returned in dependency order (parents before children).
function findLinkedNodes(
  rootNode: MainNode,
  allNodes: MainNode[],
  selections: Selections,
): MainNode[] {
  // Pre-compute which nodes have a VALID parent override and what that
  // override resolves to. Invalid overrides → treated as if absent.
  const rootIds = new Set(
    allNodes.filter(n => n.visibilityRule == null).map(n => n.id),
  );
  const effectiveParent = new Map<string, string>(); // nodeId → resolved parentRootId
  for (const n of allNodes) {
    const p = (n as any).parentNodeId;
    if (typeof p === 'string' && p !== '' && rootIds.has(p)) {
      effectiveParent.set(n.id, p);
    }
  }

  const result: MainNode[] = [];
  const inResult = new Set<string>([rootNode.id]);

  let changed = true;
  while (changed) {
    changed = false;
    for (const n of allNodes) {
      if (inResult.has(n.id)) continue;
      if (!isNodeVisible(n, selections)) continue;

      // Honor parent override first — wins over BFS.
      const override = effectiveParent.get(n.id);
      if (override !== undefined) {
        // Node has a valid parent override; include ONLY when we are
        // currently rendering that parent's sheet.
        if (override === rootNode.id) {
          result.push(n);
          inResult.add(n.id);
          changed = true;
        }
        // If override points at a different planet, skip — never include
        // here even if BFS would have hit this node.
        continue;
      }

      // No override → original BFS behavior.
      const refs = collectRuleRefs(n.visibilityRule);
      const referencesAny = [...refs].some(r => inResult.has(r));
      if (referencesAny) {
        result.push(n);
        inResult.add(n.id);
        changed = true;
      }
    }
  }
  return result;
}

// Collect all node ids referenced anywhere inside a rule tree.
function collectRuleRefs(rule: any, out = new Set<string>()): Set<string> {
  if (!rule) return out;
  if ('kind' in rule) {
    if (rule.kind === 'selected' || rule.kind === 'any_selected') {
      out.add(rule.nodeId);
    }
  } else if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') {
      rule.rules.forEach((r: any) => collectRuleRefs(r, out));
    } else if (rule.op === 'NOT') {
      collectRuleRefs(rule.rule, out);
    }
  }
  return out;
}

function ruleReferences(rule: any, targetId: string): boolean {
  if (!rule) return false;
  if ('kind' in rule) {
    return rule.nodeId === targetId;
  }
  if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') {
      return rule.rules.some((r: any) => ruleReferences(r, targetId));
    }
    if (rule.op === 'NOT') {
      return ruleReferences(rule.rule, targetId);
    }
  }
  return false;
}

export function OptionsSheet({
  visible, rootNode, allNodes, selections, accent, onClose, onToggle, onNext,
}: OptionsSheetProps) {
  if (!rootNode || !accent) return <Modal visible={false} transparent />;

  const linkedNodes = findLinkedNodes(rootNode, allNodes, selections);
  const totalSelections =
    (selections[rootNode.id]?.length || 0) +
    linkedNodes.reduce((s, n) => s + (selections[n.id]?.length || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.dot, { backgroundColor: accent.strong }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{rootNode.title}</Text>
              {totalSelections > 0 && (
                <Text style={styles.subtitle}>
                  {totalSelections} selection{totalSelections > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content — scroll if linked sections push it long */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
          >
            <NodeSection
              node={rootNode}
              selections={selections}
              accent={accent}
              onToggle={onToggle}
              isPrimary={true}
            />

            {/* Linked sections appear as sub-blocks */}
            {linkedNodes.map(linked => (
              <NodeSection
                key={linked.id}
                node={linked}
                selections={selections}
                accent={accent}
                onToggle={onToggle}
                isPrimary={false}
              />
            ))}
          </ScrollView>

          {/* Done + Next row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, { borderColor: accent.strong }]}
              onPress={onNext}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={20} color={accent.strong} />
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '85%',
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
    marginBottom: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',  // children fill the row height equally
    gap: 10,
    marginTop: 16,
  },
  nextBtn: {
    aspectRatio: 1,         // square — width derived from height
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 2,
  },
  scroll: {
    maxHeight: 480,
    marginTop: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionLinked: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  sectionTitleLinked: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  sectionMeta: {
    fontSize: 10,
    color: palette.textMuted,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillCheck: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 5,
  },
  pillText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  empty: {
    fontStyle: 'italic',
    color: palette.textMuted,
    fontSize: 13,
    paddingVertical: 8,
  },
  doneBtn: {
    flex: 1,
    backgroundColor: palette.fabBg,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneText: {
    color: palette.fabText,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});