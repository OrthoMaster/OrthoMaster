import Colors from '../../../constants/Colors';

/** Couleur d'un expert sans palette : celle de l'espace rendez-vous. */
export const DEFAULT_ACCENT = Colors.lblueDark;

export const accentOf = (paletteColor: string | null | undefined) => paletteColor ?? DEFAULT_ACCENT;

/** #RRGGBB + opacité (0–1) en #RRGGBBAA. */
export const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

const mix = (hex: string, toward: number, amount: number) => {
  const channel = (i: number) => {
    const value = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(value + (toward - value) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
};

/**
 * Teinte opaque très claire (couleur mêlée de blanc). Opaque plutôt que transparente :
 * le fond de l'écran ne transparaît pas dessous.
 */
export const tint = (hex: string, amount: number) => mix(hex, 255, 1 - amount);

/** Version plus sombre (0–1), pour les dégradés et les tranches. */
export const darken = (hex: string, amount: number) => mix(hex, 0, amount);