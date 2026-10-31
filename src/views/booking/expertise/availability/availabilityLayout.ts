import { Platform, useWindowDimensions } from 'react-native';

/**
 * Mise en page de l'écran Disponibilités :
 *  - mobile : une colonne (inchangé) ;
 *  - webOne : web sur écran étroit, une colonne centrée ;
 *  - webTwo : web sur grand écran, deux colonnes.
 */
export type AvailabilityLayout = 'mobile' | 'webOne' | 'webTwo';

/** Web : barre latérale commune (AppTab.web) ; la zone de contenu est le reste. */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_TWO_COLUMNS_FROM = 900;

export const WEB_MAX_WIDTH = 1180;
export const WEB_SINGLE_MAX_WIDTH = 640;
/** Colonne étroite (réglages, liste). */
export const WEB_SIDE_COLUMN = 400;

export const useAvailabilityLayout = (): AvailabilityLayout => {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return 'mobile';
  return width - WEB_SIDEBAR_WIDTH >= WEB_TWO_COLUMNS_FROM ? 'webTwo' : 'webOne';
};
