import { ChatConversation } from '../../../services/v2/BookingService';

/**
 * Ouvre une conversation — version MOBILE : écran plein dans la pile courante
 * (la pile doit déclarer l'écran « conversation »). Web : openConversation.web.ts.
 */
export const openConversation = (navigation: any, conversation: ChatConversation, draft?: string) =>
  navigation.navigate('conversation', { conversationId: conversation.id, preview: conversation, draft });
