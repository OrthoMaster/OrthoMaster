import { Platform, StyleSheet, useWindowDimensions } from 'react-native';

import Spacings from '../../../../constants/Spacings';

/**
 * Version WEB des listes de cartes de l'espace rendez-vous (Rendez-vous, Demandes, historiques) :
 * contenu centré ; deux cartes par ligne sur grand écran, une colonne centrée sur écran étroit.
 * Sur mobile, rien ne change.
 */

/** Barre latérale commune (AppTab.web) : la zone de contenu est le reste de la fenêtre. */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_MAX_WIDTH = 1180;
const WEB_SINGLE_MAX_WIDTH = 640;
/** Marge latérale des listes (LIST_PADDING des écrans). */
const LIST_PADDING = Spacings.lg;
export const WEB_LIST_GAP = Spacings.md;

export const useWebList = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const twoColumns = isWeb && width - WEB_SIDEBAR_WIDTH >= WEB_TWO_COLUMNS_FROM;
  return {
    isWeb,
    twoColumns,
    columns: twoColumns ? 2 : 1,
    /** À ajouter au contentContainerStyle (et à l'en-tête fixe s'il y en a un). */
    centered: isWeb ? [webListStyles.centered, twoColumns ? webListStyles.wide : webListStyles.narrow] : null,
  };
};

/** Cartes deux par deux (listes à sections). */
export const pairUp = <T,>(items: T[]): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
};

export const webListStyles = StyleSheet.create({
  centered: {
    width: '100%',
    alignSelf: 'center',
  },
  wide: {
    maxWidth: WEB_MAX_WIDTH + LIST_PADDING * 2,
  },
  narrow: {
    maxWidth: WEB_SINGLE_MAX_WIDTH + LIST_PADDING * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: WEB_LIST_GAP,
  },
  // Une carte seule sur sa ligne garde la largeur d'une colonne.
  cell: {
    flex: 1,
    maxWidth: `calc(50% - ${WEB_LIST_GAP / 2}px)` as any,
  },
});
