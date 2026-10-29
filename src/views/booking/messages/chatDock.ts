import { useSyncExternalStore } from 'react';

import { ChatConversation } from '../../../services/v2/BookingService';

/**
 * Version WEB de la messagerie, à la manière de Facebook : un panneau flottant à droite
 * (liste des conversations) et des fenêtres de discussion ancrées en bas à droite.
 * État partagé entre la barre d'onglets web (bouton Messages), la fiche d'un thème
 * (« Échanger avec l'expert ») et le dock lui-même. Inutilisé sur mobile.
 */

/**
 * Une seule fenêtre à la fois (écrans étroits en pharmacie) : ouvrir une autre conversation
 * remplace la fenêtre en cours.
 */
export const MAX_CHAT_WINDOWS = 1;

export interface ChatWindow {
  conversationId: number;
  preview?: ChatConversation;
  minimized: boolean;
}

interface DockState {
  panelOpen: boolean;
  /** La plus récente en premier (la plus à droite). */
  windows: ChatWindow[];
}

let state: DockState = { panelOpen: false, windows: [] };
const listeners = new Set<() => void>();

const set = (next: Partial<DockState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const chatDock = {
  togglePanel: (open?: boolean) => set({ panelOpen: open ?? !state.panelOpen }),

  /** Ouvre la fenêtre d'une conversation (remplace celle en cours, ou la déplie) ; ferme le panneau. */
  open: (conversation: ChatConversation) => {
    const others = state.windows.filter((w) => w.conversationId !== conversation.id);
    const current = state.windows.find((w) => w.conversationId === conversation.id);
    set({
      panelOpen: false,
      windows: [
        { conversationId: conversation.id, preview: current?.preview ?? conversation, minimized: false },
        ...others,
      ].slice(0, MAX_CHAT_WINDOWS),
    });
  },

  close: (conversationId: number) =>
    set({ windows: state.windows.filter((w) => w.conversationId !== conversationId) }),

  setMinimized: (conversationId: number, minimized: boolean) =>
    set({
      windows: state.windows.map((w) => (w.conversationId === conversationId ? { ...w, minimized } : w)),
    }),
};

export const useChatDock = () => useSyncExternalStore(subscribe, () => state, () => state);
