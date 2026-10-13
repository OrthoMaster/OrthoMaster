import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  aiSearch,
  AiSearchErrorCode,
  AiSearchOption,
  AiSearchPayload,
  AiSearchVideo,
} from '../services/v2/ContentService';
import { AI_SEARCH_STATUS_KEY } from './useAiSearchAvailable';

/** Même limite que le serveur (ai_search.conversation.max_message_length). */
export const AI_SEARCH_MAX_MESSAGE_LENGTH = 300;

export const AI_SEARCH_ERROR_MESSAGES: Record<AiSearchErrorCode, string> = {
  ai_unavailable: 'L\'assistant est momentanément indisponible. Vous pouvez utiliser la recherche classique.',
  network: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
  rate_limited: 'Vous avez atteint la limite de 30 recherches par heure. Nous vous remercions de bien vouloir patienter quelques instants avant de revenir : l\'assistant sera de nouveau à votre disposition très prochainement.',
  session_expired: 'Cette conversation a expiré. Utilisez le bouton ↻ en haut de l\'écran pour démarrer une nouvelle recherche.',
  invalid_request: 'Je n\'ai pas compris cette demande. Pouvez-vous la reformuler ?',
};

export type AiChatItem =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; kind: 'text'; text: string; isError?: boolean }
  | {
    id: string;
    role: 'assistant';
    kind: 'question';
    text: string;
    options: AiSearchOption[];
    total: number | null;
    answered: boolean;
  }
  | { id: string; role: 'assistant'; kind: 'results'; text: string; videos: AiSearchVideo[]; total: number };

export const formatAiChapterTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');

  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

type Options = {
  /** Appelé à chaque nouvelle bulle de l'assistant : l'écran s'en sert pour défiler jusqu'à elle. */
  onAssistantItem?: (id: string) => void;
  /** Appelé avant chaque envoi : l'écran repasse en mode « suivre le bas de la liste ». */
  onRequestStart?: () => void;
};

/**
 * État et appels de la conversation avec l'assistant, sans aucun rendu :
 * partagé par la version web et, à terme, par la version mobile de l'écran.
 */
export const useAiSearchConversation = ({ onAssistantItem, onRequestStart }: Options = {}) => {
  const queryClient = useQueryClient();

  const [items, setItems] = useState<AiChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Assistant indisponible : l'écran remplace la saisie par un retour vers la recherche classique.
  const [isClosed, setIsClosed] = useState(false);

  // Refs plutôt que state : lues dans des callbacks async, elles doivent toujours être à jour.
  const sessionIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const closedRef = useRef(false);
  const idRef = useRef(0);

  const nextId = () => `m${++idRef.current}`;

  const pushItem = (item: AiChatItem) => setItems((prev) => [...prev, item]);

  const pushAssistant = (item: Extract<AiChatItem, { role: 'assistant' }>) => {
    pushItem(item);
    onAssistantItem?.(item.id);
  };

  // Une seule question reste interactive : la dernière.
  const closeOpenQuestions = () =>
    setItems((prev) =>
      prev.map((item) =>
        item.role === 'assistant' && item.kind === 'question' && !item.answered
          ? { ...item, answered: true }
          : item
      )
    );

  const request = async (payload: AiSearchPayload, retryOnExpired: boolean): Promise<void> => {
    loadingRef.current = true;
    setIsLoading(true);
    onRequestStart?.();

    const response = await aiSearch({ ...payload, session_id: sessionIdRef.current });

    loadingRef.current = false;
    setIsLoading(false);

    if (response.success === false) {
      if (response.code === 'session_expired') {
        sessionIdRef.current = null;
        // Une question tapée peut être rejouée dans une nouvelle session ; un choix d'option non.
        if (retryOnExpired && payload.message) {
          return request(payload, false);
        }
      }

      if (response.code === 'ai_unavailable') {
        queryClient.setQueryData(AI_SEARCH_STATUS_KEY, false);
        closedRef.current = true;
        setIsClosed(true);
      }

      pushAssistant({
        id: nextId(),
        role: 'assistant',
        kind: 'text',
        // Un code inconnu (nouvelle version du serveur) ne doit pas afficher une bulle vide.
        text: AI_SEARCH_ERROR_MESSAGES[response.code] ?? AI_SEARCH_ERROR_MESSAGES.ai_unavailable,
        isError: true,
      });
      return;
    }

    const data = response.data;
    sessionIdRef.current = data.session_id;

    if (data.type === 'question') {
      pushAssistant({
        id: nextId(),
        role: 'assistant',
        kind: 'question',
        text: data.message,
        options: data.options,
        total: data.total,
        answered: false,
      });
    } else {
      pushAssistant({
        id: nextId(),
        role: 'assistant',
        kind: 'results',
        text: data.message,
        videos: data.videos,
        total: data.total,
      });
    }
  };

  const canSend = () => !loadingRef.current && !closedRef.current;

  /**
   * @returns true si le message est parti (l'écran peut alors vider la saisie)
   */
  const sendMessage = (raw: string): boolean => {
    const text = raw.trim().slice(0, AI_SEARCH_MAX_MESSAGE_LENGTH);
    if (!text || !canSend()) return false;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text });
    request({ message: text }, true);

    return true;
  };

  const chooseOption = (option: AiSearchOption) => {
    if (!canSend()) return;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text: option.label });
    request({ option_id: option.id }, false);
  };

  const showResults = (total: number) => {
    if (!canSend()) return;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text: `Voir les ${total} vidéos` });
    request({ action: 'show' }, false);
  };

  const resetConversation = () => {
    if (loadingRef.current) return;

    sessionIdRef.current = null;
    setItems([]);
  };

  return { items, isLoading, isClosed, sendMessage, chooseOption, showResults, resetConversation };
};