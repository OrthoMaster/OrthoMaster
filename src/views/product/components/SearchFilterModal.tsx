import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MainNode, Selections } from '../lib/Logic';
import { palette } from '../lib/Theme';

type SearchFilterModalProps = {
  visible: boolean;
  allNodes: MainNode[];
  // Current selections — passed to handlePick so we can decide which
  // ancestor steps need to be applied vs already set.
  selections: Selections;
  onClose: () => void;
  // Called when user taps a result. Parent decides what to do with it
  // (toggle, navigate to planet, etc.).
  onSelect: (nodeId: string, childId: string) => void;
};

// One row in the search results — represents a (node, child) pair with
// ONE path through the rules tree. The same child can appear in multiple
// rows when its node has compound rules (AND/OR with multiple branches),
// each branch producing its own breadcrumb.
type SearchResult = {
  key: string;                 // unique row key
  nodeId: string;
  childId: string;
  label: string;               // child label (used for matching + display)
  pathSegments: string[];      // path crumbs to render in row 2
};

export function SearchFilterModal({
  visible, allNodes, selections, onClose, onSelect,
}: SearchFilterModalProps) {
  const [query, setQuery] = useState('');

  // Index lookup tables built once per rules tree.
  const { byId, allResults } = useMemo(
    () => buildSearchIndex(allNodes),
    [allNodes],
  );

  // Filter by query (only after >= 2 chars), case-insensitive substring on label.
  // No more conflict detection — every match is clickable. When a row's
  // selection conflicts with an existing single-choice value in the main
  // screen, picking it OVERRIDES the existing one (per spec).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as SearchResult[];
    return allResults.filter(r => r.label.toLowerCase().includes(q));
  }, [query, allResults]);

  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens.
  React.useEffect(() => {
    if (visible) {
      setQuery('');
      // Focus the input after the slide animation settles
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [visible]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handlePick = (r: SearchResult) => {
    // The row's leaf alone isn't enough: if its node has a visibility rule
    // depending on ancestor selections, pruneInvalidSelections will remove
    // the leaf the moment we set it. So we walk the visibility chain and
    // pre-fill every required ancestor too.
    //
    // For each step we either:
    //   - skip if the value is already set (no need to toggle off), or
    //   - call onSelect to set it. For single-choice nodes with a
    //     different existing value, the parent's toggleSelection will
    //     OVERRIDE — that's the spec: pressing a search row replaces
    //     whatever's there.
    //
    // We rely on React's batching: each onSelect goes through the parent's
    // setSelections(prev => toggleSelection(rules, prev, ...)), so calls
    // chain correctly through the latest state even though `selections`
    // here is the snapshot from the current render.
    const chain: Array<{ nodeId: string; childId: string }> = [];
    collectAncestorChain(r.nodeId, r.childId, byId, chain, new Set());
    chain.push({ nodeId: r.nodeId, childId: r.childId });

    for (const step of chain) {
      const existing = selections[step.nodeId] ?? [];
      if (existing.includes(step.childId)) continue;        // already set
      onSelect(step.nodeId, step.childId);
    }

    onClose();
  };

  // What to show in the body depending on query state
  const renderBody = () => {
    const q = query.trim();

    if (q.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={32} color={palette.textMuted} />
          <Text style={styles.emptyTitle}>Rechercher des filtres</Text>
          <Text style={styles.emptySub}>
            Tapez au moins 2 caractères pour trouver une option parmi tous les filtres.
          </Text>
        </View>
      );
    }

    if (q.length < 2) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptySub}>Tapez au moins 2 caractères …</Text>
        </View>
      );
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={28} color={palette.textMuted} />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySub}>
            Rien ne correspond à « {q} ». Essayez un terme différent ou plus court.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={r => r.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => handlePick(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={styles.rowPath} numberOfLines={2}>
                {item.pathSegments.join(' › ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => { }}>
          <View style={styles.handle} />

          {/* Header — title + close */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Recherche de filtres</Text>
              <Text style={styles.subtext}>
                Les résultats dépendent des filtres déjà sélectionnés. Pour
                une recherche complète, effacez vos filtres avant de
                chercher.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Tapez pour rechercher une option …"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Body */}
          <View style={styles.body}>{renderBody()}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// Index builder — pre-compute every search row at modal mount.
// ============================================================

// Build a flat list of every (node, child) pair with one row per
// breadcrumb path. Same child can produce multiple rows when its parent
// node has a compound rule with multiple references.
function buildSearchIndex(allNodes: MainNode[]) {
  const byId = new Map<string, MainNode>();
  allNodes.forEach(n => byId.set(n.id, n));

  const allResults: SearchResult[] = [];

  for (const node of allNodes) {
    // Each path of this node = a chain of ancestor crumbs.
    // For a multi-condition rule we get multiple chains (one per branch).
    const ancestorPaths = pathsOfNode(node, byId, new Set([node.id]));
    // Ensure at least one path exists (root node → empty ancestor list)
    const paths = ancestorPaths.length > 0 ? ancestorPaths : [[]];

    // Whether to include THIS node's title in the crumb. Consistent with
    // pathsOfRule: keep title only for multi-select nodes. Single-select
    // nodes are represented by the chosen child label coming from their
    // referrers (or omitted entirely for the leaf node — the leaf's
    // option becomes the row label in row 1, not a crumb).
    const includeOwnTitle = node.selectionType === 'multi';

    for (const child of node.children) {
      const childLabel = child.label || child.id;
      // For every ancestor path, emit one row appended with the leaf crumb.
      paths.forEach((anc, pi) => {
        const segments = [...anc];
        if (includeOwnTitle) {
          segments.push(node.title);
        }
        segments.push(childLabel);

        allResults.push({
          key: `${node.id}::${child.id}::${pi}`,
          nodeId: node.id,
          childId: child.id,
          label: childLabel,
          pathSegments: segments,
        });
      });
    }
  }

  return { byId, allResults };
}

// Build ancestor crumb chains for a node by walking its visibility rule.
// Returns a list of paths (each path is an array of crumb strings).
//
// Each "selected" or "any_selected" rule reference contributes:
//   [...path of referenced node, (referenced child label if "selected")]
// to one chain.
//
// AND/OR rules with multiple branches → cartesian-style: each branch
// produces its own chain. For OR, branches are treated as alternatives →
// each as a separate chain. For AND, the convention here is the same —
// we emit one chain per branch so users see each condition explicitly
// rather than trying to merge them into one ugly compound crumb.
function pathsOfNode(
  node: MainNode,
  byId: Map<string, MainNode>,
  visiting: Set<string>,        // cycle guard
): string[][] {
  if (node.visibilityRule == null) return [];   // root node — no ancestors
  return pathsOfRule(node.visibilityRule, byId, visiting);
}

function pathsOfRule(
  rule: any,
  byId: Map<string, MainNode>,
  visiting: Set<string>,
): string[][] {
  if (!rule) return [];

  if ('kind' in rule) {
    // Atomic rule — reference to a single node (+ optional child)
    const refNode = byId.get(rule.nodeId);
    if (!refNode) return [];
    if (visiting.has(refNode.id)) return [];   // break cycle
    const nextVisiting = new Set(visiting); nextVisiting.add(refNode.id);

    const parentChains = pathsOfNode(refNode, byId, nextVisiting);
    const seedChains = parentChains.length > 0 ? parentChains : [[]];

    return seedChains.map(chain => {
      const extended = [...chain];

      // What crumb to add for this rule?
      //   - Multi-select node: use the node TITLE (children are pointers
      //     like "type"/"age" — meaningless as crumbs).
      //   - Single-select node + a specific child pinned: use the CHILD
      //     LABEL instead of the node title. The user thinks in terms of
      //     "Membre supérieur → Épaule", not "Zone → Membre supérieur →
      //     Segment → Épaule".
      //   - Single-select node + any_selected (no specific child): fall
      //     back to the node title since we have nothing else.
      if (refNode.selectionType === 'multi') {
        extended.push(refNode.title);
      } else if (rule.kind === 'selected' && rule.childId) {
        const ch = refNode.children.find(c => c.id === rule.childId);
        if (ch) extended.push(ch.label || ch.id);
        else extended.push(refNode.title);          // child not found → fallback
      } else {
        extended.push(refNode.title);
      }
      return extended;
    });
  }

  if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') {
      // Each sub-rule produces its own set of chains. Flatten them —
      // one row per branch keeps the UI legible.
      const all: string[][] = [];
      for (const sub of rule.rules) {
        for (const chain of pathsOfRule(sub, byId, visiting)) {
          all.push(chain);
        }
      }
      return all;
    }
    if (rule.op === 'NOT') {
      // NOT is hard to display in a breadcrumb; emit the inner path
      // marked with a "not" prefix on the first crumb so user sees it.
      const inner = pathsOfRule(rule.rule, byId, visiting);
      return inner.map(chain => {
        if (chain.length === 0) return chain;
        return [`NOT ${chain[0]}`, ...chain.slice(1)];
      });
    }
  }

  return [];
}

// Walk a node's visibility rule (and the rules of every required
// ancestor) and emit the (nodeId, childId) pairs that must be set so
// the leaf survives pruneInvalidSelections. Recursively goes deeper —
// e.g. localisation requires segment=tronc-rac-hau, which itself
// requires zone=tronc. The result is ordered deepest-first (zone before
// segment before localisation) so caller can apply each in order.
//
// Cycle-safe via the `visited` set. We walk BOTH the node-level
// visibilityRule AND the specific child's visibilityRule (children can
// add extra constraints beyond what the node requires — e.g. segment
// node only needs any_selected zone, but child tronc-rac-hau requires
// the concrete zone=tronc).
function collectAncestorChain(
  nodeId: string,
  childId: string | null,
  byId: Map<string, MainNode>,
  chain: Array<{ nodeId: string; childId: string }>,
  visited: Set<string>,
): void {
  const visitKey = childId ? `${nodeId}:${childId}` : nodeId;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);

  const node = byId.get(nodeId);
  if (!node) return;

  // Node-level rule first.
  const nodeReqs = collectRequiredFromRule(node.visibilityRule);

  // Child-specific rule, if we have a target child.
  const childReqs: Array<{ nodeId: string; childId: string }> = [];
  if (childId) {
    const child = node.children.find(c => c.id === childId);
    if (child) {
      childReqs.push(...collectRequiredFromRule(child.visibilityRule));
    }
  }

  const allReqs = [...nodeReqs, ...childReqs];

  for (const req of allReqs) {
    // Recurse first so deeper ancestors are added before this one.
    // Pass req.childId so we walk THAT specific child's rule too.
    collectAncestorChain(req.nodeId, req.childId, byId, chain, visited);
    // De-dupe: rules may reference the same (node, child) via multiple paths.
    if (!chain.some(s => s.nodeId === req.nodeId && s.childId === req.childId)) {
      chain.push(req);
    }
  }
}

// Extract the concrete (nodeId, childId) requirements from a rule. Only
// `selected` references give us a specific child to fill; `any_selected`
// doesn't (we'd have to invent a child), so it's skipped.
//   - AND: all branches required, return union.
//   - OR: just take the first branch with concrete requirements
//     (simplest heuristic; if user needs smarter logic for OR, refine here).
//   - NOT: skipped — negation isn't fillable.
function collectRequiredFromRule(rule: any): Array<{ nodeId: string; childId: string }> {
  if (!rule) return [];
  if ('kind' in rule) {
    if (rule.kind === 'selected' && rule.childId) {
      return [{ nodeId: rule.nodeId, childId: rule.childId }];
    }
    return [];
  }
  if ('op' in rule) {
    if (rule.op === 'AND') {
      return (rule.rules || []).flatMap((r: any) => collectRequiredFromRule(r));
    }
    if (rule.op === 'OR') {
      for (const sub of (rule.rules || [])) {
        const res = collectRequiredFromRule(sub);
        if (res.length > 0) return res;
      }
      return [];
    }
    if (rule.op === 'NOT') return [];
  }
  return [];
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
    height: '80%',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
  },
  subtext: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    lineHeight: 16,
    marginTop: 4,
    paddingRight: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    padding: 0,
  },
  body: {
    flex: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
    marginBottom: 2,
    lineHeight: 18,
  },
  rowPath: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    letterSpacing: 0.2,
    lineHeight: 15,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: palette.textSecondary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
});