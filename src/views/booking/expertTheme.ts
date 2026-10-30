import Colors from '../../../constants/Colors';
import { accentOf, tint, withAlpha } from './bookingPalette';

/**
 * Thème d'un expert, repris tel quel de sa page vitrine web (variante claire de PALETTES
 * dans la page brochure). Les clés suivent BrochureDraft::PALETTES.
 *  - bg / bg2 : fond et halo du dégradé radial
 *  - primary  : couleur principale (déjà assombrie pour le contraste, ex. orange → #b35f00)
 */
export interface ExpertTheme {
  bg: string;
  bg2: string;
  ink: string;
  muted: string;
  primary: string;
  onPrimary: string;
  line: string;
  panel: string;
  card: string;
}

const THEMES: Record<string, ExpertTheme> = {
  turquoise: {
    bg: '#e3ebf0', bg2: '#cfdde7', ink: '#13293d', muted: '#4d6578', primary: '#1f8379',
    onPrimary: '#ffffff', line: 'rgba(19,41,61,0.16)', panel: 'rgba(227,235,240,0.82)', card: '#f3f7f9',
  },
  // Fond plus franchement orangé que la vitrine (beige qui tirait sur le brun dans l'application).
  orange: {
    bg: '#fff1e2', bg2: '#ffdcb5', ink: '#2a1c10', muted: '#6e5640', primary: '#b35f00',
    onPrimary: '#ffffff', line: 'rgba(42,28,16,0.14)', panel: 'rgba(255,241,226,0.86)', card: '#fff9f2',
  },
  ocean: {
    bg: '#e6ecf4', bg2: '#d2deee', ink: '#0f2240', muted: '#4a5d78', primary: '#1f56c9',
    onPrimary: '#ffffff', line: 'rgba(15,34,64,0.15)', panel: 'rgba(230,236,244,0.82)', card: '#f5f8fc',
  },
  rose: {
    bg: '#f2e9ed', bg2: '#e8d5de', ink: '#2e1622', muted: '#6e5361', primary: '#b52d60',
    onPrimary: '#ffffff', line: 'rgba(46,22,34,0.14)', panel: 'rgba(242,233,237,0.84)', card: '#fbf6f8',
  },
  lavande: {
    bg: '#ebe8f4', bg2: '#dbd5ee', ink: '#1e1838', muted: '#5c5677', primary: '#5f43c4',
    onPrimary: '#ffffff', line: 'rgba(30,24,56,0.14)', panel: 'rgba(235,232,244,0.84)', card: '#f7f6fc',
  },
};

/** Expert sans palette (ou palette inconnue) : thème calculé sur la couleur de l'espace rendez-vous. */
const derivedTheme = (accent: string): ExpertTheme => ({
  bg: tint(accent, 0.1),
  bg2: tint(accent, 0.2),
  ink: Colors.text,
  muted: '#5b6573',
  primary: accent,
  onPrimary: Colors.white,
  line: 'rgba(50,52,62,0.15)',
  panel: withAlpha(tint(accent, 0.1), 0.84),
  card: tint(accent, 0.04),
});

export const expertTheme = (palette: string | null | undefined, paletteColor?: string | null): ExpertTheme =>
  (palette && THEMES[palette]) || derivedTheme(accentOf(paletteColor));