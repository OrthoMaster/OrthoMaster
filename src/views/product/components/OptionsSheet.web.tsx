import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
  // WEB: render inline inside the right-hand panel instead of a slide-up
  // Modal + backdrop. The web SolarFilter screen always passes embedded.
  embedded?: boolean;
};

// Web-only style props not present in React Native's type definitions.
// Kept outside StyleSheet.create (which type-checks against RN styles).
const webClickable = { cursor: 'pointer' } as any;

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
          webClickable,
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
          {isMulti ? 'plusieurs choix' : 'un seul choix'}
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

// ScrollView with a custom scrollbar that stays visible whenever content
// overflows the viewport. Native RN scroll indicators can't be styled and
// only appear briefly while scrolling, so we draw our own track + thumb.
function ScrollableBody({ children }: { children: React.ReactNode }) {
  const [trackH, setTrackH] = useState(0);       // viewport height
  const [contentH, setContentH] = useState(0);   // content height
  const scrollY = useRef(new Animated.Value(0)).current;

  const overflowing = contentH > trackH + 1;
  const MIN_THUMB = 32;

  // Thumb height proportional to the visible fraction of content.
  const thumbH = overflowing
    ? Math.max((trackH * trackH) / contentH, MIN_THUMB)
    : 0;

  // Max distance the thumb can travel inside the track.
  const maxThumbTravel = Math.max(trackH - thumbH, 0);
  const maxScroll = Math.max(contentH - trackH, 1);

  const thumbTranslate = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, maxThumbTravel],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.scrollWrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 76, paddingRight: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={e => setTrackH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentH(h)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {children}
      </ScrollView>

      {overflowing && (
        <View style={styles.scrollTrack} pointerEvents="none">
          <Animated.View
            style={[
              styles.scrollThumb,
              { height: thumbH, transform: [{ translateY: thumbTranslate }] },
            ]}
          />
        </View>
      )}
    </View>
  );
}

// Find all nodes transitively unlocked starting from rootNode.
function findLinkedNodes(
  rootNode: MainNode,
  allNodes: MainNode[],
  selections: Selections,
): MainNode[] {
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

      const override = effectiveParent.get(n.id);
      if (override !== undefined) {
        if (override === rootNode.id) {
          result.push(n);
          inResult.add(n.id);
          changed = true;
        }
        continue;
      }

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

export function OptionsSheet({
  visible, rootNode, allNodes, selections, accent, onClose, onToggle, onNext, embedded = false,
}: OptionsSheetProps) {
  // Empty state differs by mode: embedded panel shows a placeholder so the
  // right column isn't blank; modal returns a hidden Modal as before.
  if (!rootNode || !accent) {
    if (embedded) {
      return (
        <View style={styles.embeddedEmpty}>
          <Ionicons name="planet-outline" size={40} color={palette.textMuted} />
          <Text style={styles.embeddedEmptyText}>
            Sélectionnez une planète pour afficher ses options.
          </Text>
        </View>
      );
    }
    return <Modal visible={false} transparent />;
  }

  const linkedNodes = findLinkedNodes(rootNode, allNodes, selections);
  const totalSelections =
    (selections[rootNode.id]?.length || 0) +
    linkedNodes.reduce((s, n) => s + (selections[n.id]?.length || 0), 0);

  // Shared inner content for both embedded + modal.
  const inner = (
    <>
      {/* Header — fixed height 100 to line up with the left column header */}
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
        <TouchableOpacity onPress={onClose} hitSlop={8} style={[styles.closeBtn, webClickable]}>
          <Ionicons name="close" size={24} color={palette.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content — scroll if linked sections push it long */}
      <ScrollableBody>
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
      </ScrollableBody>

      {/* Single full-width Next button — floats absolutely over the body
          so the options underneath stay partly visible around it. */}
      <View style={styles.actionRow} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.nextBtn, webClickable, { backgroundColor: accent.strong }]}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, { color: accent.textOn }]}>Suivant</Text>
          <Ionicons name="arrow-forward" size={20} color={accent.textOn} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </>
  );

  // ---- WEB: embedded inline panel (no Modal, no backdrop, full height)
  if (embedded) {
    return <View style={styles.embeddedContainer}>{inner}</View>;
  }

  // ---- Fallback: original bottom-sheet Modal (kept for parity)
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.handle} />
          {inner}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // WEB embedded container — fills the right panel.
  embeddedContainer: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  embeddedEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  embeddedEmptyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

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
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 49, 66, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    // Float over the body instead of taking layout space, so the options
    // list is still partly visible beneath the translucent button.
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  scrollWrap: {
    flex: 1,
    position: 'relative',
    marginTop: 10,
    // Bleed past the card's horizontal padding (22) so the track can sit
    // near the panel edge. Content keeps its inset via paddingRight below.
    marginRight: -22,
    paddingRight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollTrack: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    right: 4,               // ~4px from the panel edge
    width: 5,
    borderRadius: 3,
    backgroundColor: palette.border,
    opacity: 0.35,
  },
  scrollThumb: {
    width: 5,
    borderRadius: 3,
    backgroundColor: palette.textMuted,
    opacity: 0.9,
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
});