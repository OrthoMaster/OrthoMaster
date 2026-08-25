// ============================================================
// Pastel theme. Each node is auto-assigned an accent from the
// palette by index, so the screen feels playful without being noisy.
// ============================================================

export const palette = {
  bg: '#FAF7F2',           // warm off-white
  cardBg: '#FFFFFF',
  textPrimary: '#2D3142',  // soft charcoal — easier on eyes than pure black
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#EDE9E1',
  shadow: 'rgba(45, 49, 66, 0.08)',
  fabBg: '#2D3142',
  fabText: '#FFFFFF',
};

export type Accent = {
  name: string;
  soft: string;    // pill background when unselected (very light)
  strong: string;  // pill background + border when selected
  text: string;    // pill text color when unselected
  textOn: string;  // text color on top of `strong`
};

export const accents: Accent[] = [
  { name: 'mint',     soft: '#E2F4EC', strong: '#7DC9B0', text: '#1F6E5A', textOn: '#FFFFFF' },
  { name: 'peach',    soft: '#FCE5D6', strong: '#F2A88B', text: '#9C4A2D', textOn: '#FFFFFF' },
  { name: 'sky',      soft: '#DCE9F8', strong: '#8FB8E6', text: '#2C5687', textOn: '#FFFFFF' },
  { name: 'lavender', soft: '#EADFF8', strong: '#B89AE0', text: '#553D7E', textOn: '#FFFFFF' },
  { name: 'lemon',    soft: '#F6E9C2', strong: '#E0C46E', text: '#7A5C12', textOn: '#FFFFFF' },
  { name: 'rose',     soft: '#F8DCE4', strong: '#DC9BB1', text: '#823756', textOn: '#FFFFFF' },
];

export function accentForIndex(index: number): Accent {
  return accents[index % accents.length];
}