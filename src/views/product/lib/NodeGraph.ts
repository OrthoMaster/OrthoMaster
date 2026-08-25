import { evaluateRule, isNodeVisible, MainNode, Rule, Selections } from './Logic';

// ============================================================
// Graph helpers for the funnel layout.
//
// Two questions this module answers:
//   1. Which root step does a given node belong to?  (static — depends
//      only on rules.json, never on the user's selections)
//   2. Is a node visible, hidden, or partially unlocked?  (dynamic)
// ============================================================

// A single terminal condition inside a rule tree.
export type Leaf = { nodeId: string; childId?: string };

// Flatten a rule tree into its terminal conditions.
//
// NOTE: NOT branches are collected as if positive. rules.json has no
// NOT today; if one ever appears, the partial-unlock counter would
// mis-report it (visibility itself stays correct — that goes through
// evaluateRule).
export function collectLeaves(rule: Rule | null | undefined, out: Leaf[] = []): Leaf[] {
  if (!rule) return out;
  if ('kind' in rule) {
    if (rule.kind === 'selected') out.push({ nodeId: rule.nodeId, childId: rule.childId });
    else if (rule.kind === 'any_selected') out.push({ nodeId: rule.nodeId });
    return out;
  }
  if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') rule.rules.forEach(r => collectLeaves(r, out));
    else if (rule.op === 'NOT') collectLeaves(rule.rule, out);
  }
  return out;
}

// Every nodeId referenced anywhere in a rule tree.
export function collectRefNodeIds(rule: Rule | null | undefined, out = new Set<string>()): Set<string> {
  collectLeaves(rule).forEach(l => out.add(l.nodeId));
  return out;
}

function leafSatisfied(leaf: Leaf, selections: Selections): boolean {
  const arr = selections[leaf.nodeId] || [];
  return leaf.childId ? arr.includes(leaf.childId) : arr.length > 0;
}

// ------------------------------------------------------------
// Ownership: nodeId → rootId
// ------------------------------------------------------------

// Assign every node to exactly one root step.
//
// Priority:
//   1. `parentNodeId` pointing at a valid root wins outright.
//   2. Otherwise BFS: a node joins root R if its own rule, or any of
//      its children's rules, references a node already owned by R.
//
// Roots are processed in display order, so a node reachable from two
// roots lands on the earlier one — deterministic, and in practice the
// ambiguous cases (path_rachis references both zone and path_type) all
// carry an explicit parentNodeId anyway.
//
// Unlike findLinkedNodes in OptionsSheet, this ignores visibility: a
// node must keep its owner even while locked, otherwise it could never
// be rendered as "locked" anywhere.
export function buildOwnership(nodes: MainNode[], roots: MainNode[]): Map<string, string> {
  const rootIds = new Set(roots.map(r => r.id));
  const owner = new Map<string, string>();

  for (const r of roots) owner.set(r.id, r.id);

  for (const n of nodes) {
    const p = n.parentNodeId;
    if (typeof p === 'string' && p !== '' && rootIds.has(p) && !owner.has(n.id)) {
      owner.set(n.id, p);
    }
  }

  for (const root of roots) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (owner.has(n.id)) continue;
        const refs = collectRefNodeIds(n.visibilityRule);
        n.children.forEach(c => collectRefNodeIds(c.visibilityRule, refs));
        let hit = false;
        refs.forEach(ref => { if (owner.get(ref) === root.id) hit = true; });
        if (hit) {
          owner.set(n.id, root.id);
          changed = true;
        }
      }
    }
  }

  return owner;
}

// ------------------------------------------------------------
// Gate: visible / hidden / partially unlocked
// ------------------------------------------------------------

export type Gate =
  | { state: 'visible' }
  | { state: 'hidden' }
  | { state: 'locked'; total: number; satisfied: number; missing: string[] };

// Decide how a node should render given the current selections.
//
//   visible → the user can pick in it right now
//   hidden  → nothing about it is relevant yet, don't render at all
//   locked  → at least one of its conditions is met, so the user is
//             "on the way there" — render it with what's still missing
//
// Conditions are counted per referenced NODE, not per leaf rule.
// path_rachis has ~170 children each carrying its own
// AND(local_tronc.X, path_type.Y) pair; counting leaves would produce a
// meaningless "3 / 340". Grouped by node it reads "1 / 2".
export function nodeGate(node: MainNode, selections: Selections): Gate {
  if (isNodeVisible(node, selections)) return { state: 'visible' };

  // When the node's own rule passes but no child is visible, the
  // blockers live in the children's rules — look there instead.
  const nodeRuleOk = evaluateRule(node.visibilityRule, selections);
  const leaves: Leaf[] = [];
  if (nodeRuleOk) node.children.forEach(c => collectLeaves(c.visibilityRule, leaves));
  else collectLeaves(node.visibilityRule, leaves);

  const byNode = new Map<string, boolean>();
  for (const lf of leaves) {
    const ok = leafSatisfied(lf, selections);
    byNode.set(lf.nodeId, (byNode.get(lf.nodeId) ?? false) || ok);
  }

  const total = byNode.size;
  if (total === 0) return { state: 'hidden' };

  let satisfied = 0;
  const missing: string[] = [];
  byNode.forEach((ok, nid) => {
    if (ok) satisfied += 1;
    else missing.push(nid);
  });

  if (satisfied === 0) return { state: 'hidden' };
  return { state: 'locked', total, satisfied, missing };
}