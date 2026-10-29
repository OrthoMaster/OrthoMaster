/**
 * Conversation actuellement à l'écran : le gestionnaire de notifications (App.tsx)
 * n'affiche pas la notification d'un nouveau message de ce fil, la relève l'affiche déjà.
 */
let activeConversationId: number | null = null;

/** $only : ne rien effacer si une autre conversation est devenue active entre-temps. */
export const setActiveConversation = (id: number | null, only?: number) => {
  if (id === null && only !== undefined && activeConversationId !== only) return;
  activeConversationId = id;
};

export const getActiveConversation = () => activeConversationId;
