import { ChatConversation } from '../../../services/v2/BookingService';
import { chatDock } from './chatDock';

/**
 * Ouvre une conversation — version WEB : fenêtre flottante en bas à droite (comme Facebook),
 * par-dessus la page en cours. Mobile : openConversation.ts.
 */
export const openConversation = (_navigation: any, conversation: ChatConversation) => chatDock.open(conversation);
