import { useWindowDimensions } from 'react-native';

export type HomeBreakpoint = 'md' | 'lg' | 'xl';

// Même largeur que la barre latérale de AppTab.web : la page n'occupe que le reste.
const SIDEBAR_WIDTH = 200;

// Au-delà, les lignes deviennent trop longues à lire (écrans 4K) : le contenu reste centré.
const MAX_INNER = 1760;

const PADDING: Record<HomeBreakpoint, number> = { md: 32, lg: 40, xl: 56 };

// Titres de section et libellés des trois raccourcis : même taille, même graisse.
const HEADING_SIZE: Record<HomeBreakpoint, number> = { md: 17, lg: 19, xl: 21 };

/**
 * Mise en page de l'accueil web selon la largeur de fenêtre.
 * md < 1280 ≤ lg < 1600 ≤ xl. Pas de sm : les petits écrans tactiles basculent vers l'app.
 * useWindowDimensions plutôt que onLayout, peu fiable sur react-native-web.
 */
export const useHomeLayout = () => {
  const { width } = useWindowDimensions();
  const breakpoint: HomeBreakpoint = width >= 1600 ? 'xl' : width >= 1280 ? 'lg' : 'md';
  const pageWidth = Math.max(0, width - SIDEBAR_WIDTH);
  const padding = PADDING[breakpoint];
  const innerWidth = Math.min(pageWidth - padding * 2, MAX_INNER);

  const headingSize = HEADING_SIZE[breakpoint];
  const headingStyle = { fontSize: headingSize, lineHeight: headingSize + 8, fontFamily: 'Poppins-Medium' };

  return { breakpoint, pageWidth, padding, innerWidth, headingStyle };
};
