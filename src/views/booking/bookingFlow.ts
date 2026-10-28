/**
 * Écrans de sélection dont la demande vient d'être envoyée.
 * Lu de façon synchrone dans « beforeRemove » : un paramètre de route n'aurait pas
 * encore été pris en compte au moment où le récapitulatif remonte toute la pile.
 */
const completed = new Set<string>();

export const markBookingCompleted = (routeKey: string | undefined) => {
  if (routeKey) completed.add(routeKey);
};

/** Consomme le signal : un même écran ne le reçoit qu'une fois. */
export const takeBookingCompleted = (routeKey: string): boolean => completed.delete(routeKey);