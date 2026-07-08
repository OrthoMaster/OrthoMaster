// ============================================================
// Map node IDs to Ionicons names. Edit/extend per your domain.
// Falls back to a generic icon if not mapped.
// ============================================================

// Type matches Ionicons glyphMap names (typed as string for portability).
export const NODE_ICONS: Record<string, string> = {
  type: 'person-outline',
  age: 'hourglass-outline',
  activity: 'pulse-outline',
  zone: 'body-outline',
  segment: 'git-branch-outline',
  localization: 'locate-outline',
};

export function iconForNode(nodeId: string): string {
  return NODE_ICONS[nodeId] || 'ellipse-outline';
}