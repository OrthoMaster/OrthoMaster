// ============================================================
// Pure logic & types — same shape as the web evaluator.
// Zero React Native imports here. Easy to unit-test.
// ============================================================

export type Selections = Record<string, string[]>;

export type Rule =
  | { kind: 'selected'; nodeId: string; childId: string }
  | { kind: 'any_selected'; nodeId: string }
  | { op: 'AND'; rules: (Rule | null)[] }
  | { op: 'OR'; rules: (Rule | null)[] }
  | { op: 'NOT'; rule: Rule | null };

export type ChildNode = {
  id: string;
  label: string;
  visibilityRule?: Rule | null;
};

export type MainNode = {
  id: string;
  title: string;
  selectionType: 'single' | 'multi';
  children: ChildNode[];
  visibilityRule?: Rule | null;
};

// ---------- evaluator ----------

export function evaluateRule(
  rule: Rule | null | undefined,
  selections: Selections,
): boolean {
  if (!rule) return true;
  if ('kind' in rule) {
    if (rule.kind === 'selected')
      return (selections[rule.nodeId] || []).includes(rule.childId);
    if (rule.kind === 'any_selected')
      return (selections[rule.nodeId] || []).length > 0;
  }
  if ('op' in rule) {
    if (rule.op === 'AND') return rule.rules.every(r => evaluateRule(r, selections));
    if (rule.op === 'OR')  return rule.rules.some(r => evaluateRule(r, selections));
    if (rule.op === 'NOT') return !evaluateRule(rule.rule, selections);
  }
  return false;
}

export function isChildVisible(child: ChildNode, selections: Selections) {
  return evaluateRule(child.visibilityRule, selections);
}

export function isNodeVisible(node: MainNode, selections: Selections) {
  // Main rule must pass first
  if (!evaluateRule(node.visibilityRule, selections)) return false;
  // For conditional nodes: also require at least one visible child
  if (node.visibilityRule) {
    return node.children.some(c => isChildVisible(c, selections));
  }
  return true;
}

// ---------- mutations (pure) ----------

export function pruneInvalidSelections(
  nodes: MainNode[],
  selections: Selections,
): Selections {
  const next: Selections = { ...selections };
  let changed = true;
  while (changed) {
    changed = false;
    for (const nodeId of Object.keys(next)) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || !isNodeVisible(node, next)) {
        delete next[nodeId];
        changed = true;
        continue;
      }
      const filtered = next[nodeId].filter(childId => {
        const child = node.children.find(c => c.id === childId);
        return child && isChildVisible(child, next);
      });
      if (filtered.length !== next[nodeId].length) {
        if (filtered.length === 0) delete next[nodeId];
        else next[nodeId] = filtered;
        changed = true;
      }
    }
  }
  return next;
}

export function toggleSelection(
  nodes: MainNode[],
  selections: Selections,
  nodeId: string,
  childId: string,
): Selections {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return selections;
  const current = selections[nodeId] || [];
  let next: string[];
  if (current.includes(childId)) {
    next = current.filter(c => c !== childId);
  } else if (node.selectionType === 'single') {
    next = [childId];
  } else {
    next = [...current, childId];
  }
  const draft: Selections = { ...selections };
  if (next.length === 0) delete draft[nodeId];
  else draft[nodeId] = next;
  return pruneInvalidSelections(nodes, draft);
}

export function totalSelectedCount(selections: Selections): number {
  return Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
}