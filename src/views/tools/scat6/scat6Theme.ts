import Colors from '../../../../constants/Colors';

/**
 * Couleurs de l'espace SCAT6 : le bleu de l'en-tête Outils (Colors.blue), décliné.
 * Fond de page clair : l'examen se fait au cabinet, l'écran doit rester lisible à distance.
 */
export const SCAT = {
  /* ---- Bleu Outils ---- */
  blue: Colors.blue,
  /** Tranche des cartes 3D et texte bleu sur fond clair (contraste ≥ 4.5:1 sur blanc). */
  blueDark: '#3B72B9',
  blueInk: Colors.blueDark2,
  blueSoft: '#E8F1FC',
  blueLine: '#C9DCF4',

  /* ---- Page ---- */
  page: '#F3F6FA',
  card: Colors.white,
  line: '#E1E8F0',
  text: Colors.text,
  muted: '#6B7385',
  faint: '#9AA2B5',

  /* ---- États ---- */
  success: '#2E8B57',
  successSoft: '#E6F4EC',
  warning: '#B26A00',
  warningSoft: '#FFF4DE',
  warningLine: '#F5C46B',
  danger: Colors.danger,
  dangerDark: '#B71C1C',
  dangerSoft: '#FDECEA',
  /** Brouillon : orange de l'application. */
  draft: Colors.primary,
  draftSoft: Colors.primaryLightBackground,
};

/** Sévérité d'un symptôme 0 → 6 : du blanc au bleu foncé (le rouge reste réservé aux alertes). */
export const SEVERITY_COLORS = ['#FFFFFF', '#DCE9FA', '#BBD4F4', '#8FB8EC', '#5C96DF', '#3B72B9', '#24508F'];
export const SEVERITY_TEXT = [SCAT.muted, SCAT.blueInk, SCAT.blueInk, SCAT.blueInk, '#FFFFFF', '#FFFFFF', '#FFFFFF'];

/** Largeur de la barre latérale de l'application (AppTab.web) : le contenu est le reste. */
export const WEB_SIDEBAR_WIDTH = 200;
/** Colonne de lecture des pages (listes, fiches). */
export const PAGE_MAX_WIDTH = 1120;
/** Hauteur de la barre d'onglets flottante + marges, à laisser libre en bas des pages. */
export const TAB_BAR_SPACE = 66 + 16 * 2;

export const FONTS = {
  title: 'Poppins-Bold',
  medium: 'Poppins-Medium',
  regular: 'Poppins-Regular',
  body: 'Roboto',
};
