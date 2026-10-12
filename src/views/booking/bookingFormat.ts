/**
 * Prix au format français : 1 250 €, 300,50 €.
 * Repli manuel si Intl n'est pas disponible dans le moteur JS.
 */
export const formatPrice = (amount: number, currency = 'EUR'): string => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ',');
    return `${text} ${currency === 'EUR' ? '€' : currency}`;
  }
};

/**
 * Même règle que ExpertOffer::durationLabel côté serveur, pour l'affichage pendant la saisie :
 * 1 → « 0,5 jour », 3 → « 1,5 jour », 4 → « 2 jours ».
 */
export const durationLabel = (blocks: number): string => {
  const days = blocks / 2;
  const text = Number.isInteger(days) ? String(days) : String(days).replace('.', ',');
  return `${text} ${days >= 2 ? 'jours' : 'jour'}`;
};

export const blocksLabel = (blocks: number): string =>
  `${blocks} ${blocks > 1 ? 'demi-journées' : 'demi-journée'}`;

/** Accepte la virgule française ; NaN si la saisie n'est pas un nombre. */
export const parseAmount = (input: string): number => Number(input.replace(/\s/g, '').replace(',', '.'));

/** Deux premières initiales : « Jean Martin » → « JM ». */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');