import { Platform, SwitchProps } from 'react-native';

import Colors from '../../../constants/Colors';
import { tint } from './bookingPalette';

/**
 * Couleurs d'un interrupteur (Switch) de l'espace rendez-vous.
 *
 * Mobile : piste de la couleur, pastille blanche (rendu natif habituel).
 * Web : react-native-web ignore thumbColor quand l'interrupteur est actif et prend sa propre
 * couleur (vert) ; la pastille prend donc la couleur, sur une piste de la même couleur éclaircie.
 */
export const switchColors = (color: string, value: boolean): Partial<SwitchProps> & { activeThumbColor?: string } =>
  Platform.OS === 'web'
    ? {
        trackColor: { false: Colors.disabledBackground, true: tint(color, 0.45) },
        thumbColor: Colors.white,
        activeThumbColor: color,
      }
    : {
        trackColor: { false: Colors.disabledBackground, true: color },
        thumbColor: Colors.white,
        ios_backgroundColor: value ? color : Colors.disabledBackground,
      };
