import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  CONTACT_BLOCKED,
  ChatConversation,
  ChatMessage,
  getChatMessages,
  getConversation,
  sendChatMessage,
} from '../../../services/v2/BookingService';
import { ExpertAvatar } from '../components/ExpertAvatar';
import { ModePill } from '../components/ModePill';
import { setActiveConversation } from './chatPresence';
import {
  CHAT_BLUE,
  CHAT_BUBBLE_OTHER,
  CHAT_UNREAD_KEY,
  CONVERSATIONS_KEY,
  newClientId,
  otherName,
  separatorTime,
} from './chatFormat';

/** Relève des nouveaux messages tant que le fil est ouvert. */
const POLL_MS = 4000;
/** Même expéditeur à moins de 5 min : bulles groupées. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** Plus d'une heure sans message : séparateur avec la date et l'heure. */
const SEPARATOR_GAP_MS = 60 * 60 * 1000;
const BODY_MAX = 2000;
/** Hauteur max de la saisie (≈ 5 lignes) ; au-delà, elle défile. */
const INPUT_MAX_HEIGHT = 120;
const AVATAR = 28;
const RADIUS = 18;
const RADIUS_JOINED = 4;

/** Message envoyé, pas encore confirmé par le serveur. */
interface PendingMessage {
  client_id: string;
  body: string;
  status: 'sending' | 'failed';
  created_at: string;
}

type Row =
  | { type: 'message'; key: string; message: ChatMessage; separator: string | null; groupStart: boolean; groupEnd: boolean }
  | { type: 'pending'; key: string; pending: PendingMessage };

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

/**
 * Hauteur du clavier (0 fermé). On décale nous-mêmes la saisie plutôt que de compter sur
 * KeyboardAvoidingView : avec l'affichage bord à bord d'Android (Expo 54), la fenêtre ne se
 * redimensionne plus et le clavier recouvrait la zone de saisie. Rien sur le web.
 */
const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS annonce le clavier avant son animation (on suit sa durée) ; Android après coup.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animate = (e?: KeyboardEvent) => {
      try {
        LayoutAnimation.configureNext({
          duration: e?.duration || 220,
          update: { type: LayoutAnimation.Types.keyboard ?? 'easeInEaseOut' },
        });
      } catch (err) { }
    };

    const show = Keyboard.addListener(showEvent, (e) => {
      animate(e);
      // Distance entre le haut du clavier et le bas de l'écran : sur Android bord à bord,
      // la hauteur annoncée peut ne pas compter la barre de navigation système.
      const fromTop = Dimensions.get('window').height - e.endCoordinates.screenY;
      setHeight(Math.max(e.endCoordinates.height, fromTop > 0 ? fromTop : 0));
    });
    const hide = Keyboard.addListener(hideEvent, (e) => {
      animate(e);
      setHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
};

interface ConversationThreadProps {
  conversationId: number;
  /** Aperçu (liste, ouverture depuis un thème) : l'en-tête s'affiche sans attendre. */
  preview?: ChatConversation;
  /** Écran visible / fenêtre dépliée : relève active et messages marqués lus. */
  active: boolean;
  /** Mobile : flèche de retour à gauche. */
  onBack?: () => void;
  /** Web (fenêtre flottante) : réduire et fermer, à droite de l'en-tête. */
  onMinimize?: () => void;
  onClose?: () => void;
  /** Fenêtre réduite (web) : l'en-tête seul, toucher pour déplier. */
  minimized?: boolean;
  onExpand?: () => void;
}

/**
 * Conversation à la manière de Messenger : bulles bleues à droite (moi), grises à gauche
 * avec l'avatar en fin de groupe, séparateurs d'heure, « Vu » sous mon dernier message lu.
 * Les événements des rendez-vous s'affichent au centre ; le contact depuis un thème,
 * en encadré, pour que l'expert sache de quel thème il s'agit.
 *
 * Relève toutes les 4 s tant qu'elle est active (pas de temps réel côté serveur).
 *
 * Sans navigation : utilisée par l'écran mobile (ConversationView) et par les fenêtres
 * flottantes du web (ChatDock.web).
 */
export const ConversationThread: React.FC<ConversationThreadProps> = ({
  conversationId,
  preview,
  active,
  onBack,
  onMinimize,
  onClose,
  minimized = false,
  onExpand,
}) => {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  // Clavier ouvert : la saisie remonte au-dessus ; sinon, marge de la zone sûre (barre d'accueil).
  const composerBottom = keyboardHeight > 0 ? keyboardHeight + Spacings.xs : Math.max(insets.bottom, Spacings.sm);
  const queryClient = useQueryClient();

  // En-tête : l'aperçu passé par la liste s'affiche tout de suite, la fiche complète suit.
  const { data: detail } = useQuery({
    queryKey: ['booking', 'conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });
  const header = detail ?? preview;
  const name = header ? otherName(header) : '';
  const isGuest = header?.role === 'guest';

  /* ---- Messages ---- */

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [canWrite, setCanWrite] = useState<boolean>(preview?.can_write ?? true);
  const [otherLastRead, setOtherLastRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const lastIdRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  // Web : la zone de texte grandit avec le message (jusqu'à ~5 lignes, puis défile)
  // et redescend quand on efface — comme la saisie mobile.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el: any = inputRef.current;
    if (!el?.style) return;
    el.style.height = 'auto';
    const height = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT);
    el.style.height = `${height}px`;
    el.style.overflowY = el.scrollHeight > INPUT_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [draft]);

  /** Ajoute sans doublon (une relève peut rapporter un message déjà reçu à l'envoi). */
  const merge = (incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const byId = new Map(current.map((m) => [m.id, m]));
      incoming.forEach((m) => byId.set(m.id, m));
      return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    });
    const clientIds = new Set(incoming.map((m) => m.client_id).filter(Boolean));
    if (clientIds.size) setPending((current) => current.filter((p) => !clientIds.has(p.client_id)));
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
  };

  const loadLatest = useCallback(async () => {
    const page = await getChatMessages(conversationId);
    setLoading(false);
    if (!page) return;
    setMessages(page.messages);
    lastIdRef.current = page.messages.length ? page.messages[page.messages.length - 1].id : 0;
    setHasMore(page.has_more);
    setCanWrite(page.can_write);
    setOtherLastRead(page.other_last_read_id);
  }, [conversationId]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  // Relève tant que la conversation est active ; en la quittant, la liste et le badge se mettent à jour.
  // Active = à l'écran : la notification d'un nouveau message de ce fil n'est pas affichée.
  useEffect(() => {
    if (!active) return;
    setActiveConversation(conversationId);

    const timer = setInterval(async () => {
        const page = await getChatMessages(conversationId, { after_id: lastIdRef.current });
        if (!page) return;
        if (page.has_more) {
          // Trop de nouveaux messages d'un coup : on recharge simplement la fin du fil.
          loadLatest();
          return;
        }
        merge(page.messages);
        setCanWrite(page.can_write);
        setOtherLastRead(page.other_last_read_id);
    }, POLL_MS);

    return () => {
      clearInterval(timer);
      setActiveConversation(null, conversationId);
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY });
    };
  }, [active, conversationId, loadLatest]);

  // Fenêtre dépliée de nouveau : on rattrape ce qui est arrivé pendant qu'elle était réduite.
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) loadLatest();
    wasActive.current = active;
  }, [active]);

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const page = await getChatMessages(conversationId, { before_id: messages[0].id });
    setLoadingOlder(false);
    if (!page) return;
    setMessages((current) => [...page.messages, ...current]);
    setHasMore(page.has_more);
  };

  /* ---- Envoi ---- */

  const deliver = async (item: PendingMessage) => {
    setPending((current) =>
      current.map((p) => (p.client_id === item.client_id ? { ...p, status: 'sending' } : p))
    );

    const result = await sendChatMessage(conversationId, item.body, item.client_id);
    if (result.ok === true) {
      merge([result.data]);
      return;
    }

    // Coordonnées refusées : le message n'est pas envoyé, on le rend à la saisie.
    if (result.code === CONTACT_BLOCKED) {
      setPending((current) => current.filter((p) => p.client_id !== item.client_id));
      setDraft((current) => current || item.body);
      setError(result.message ?? 'Les coordonnées (téléphone, e-mail, liens) ne peuvent pas être échangées ici.');
      return;
    }
    if (result.status === 422) {
      setPending((current) => current.filter((p) => p.client_id !== item.client_id));
      setError(result.message ?? "Ce message n'a pas pu être envoyé.");
      return;
    }

    // Réseau : on garde la bulle, un appui la renvoie (même client_id, pas de doublon).
    setPending((current) =>
      current.map((p) => (p.client_id === item.client_id ? { ...p, status: 'failed' } : p))
    );
  };

  const send = () => {
    const body = draft.trim();
    if (!body || !canWrite) return;
    setError(null);
    setDraft('');
    const item: PendingMessage = {
      client_id: newClientId(),
      body,
      status: 'sending',
      created_at: new Date().toISOString(),
    };
    setPending((current) => [...current, item]);
    deliver(item);
  };

  /* ---- Lignes : séparateurs et groupes ---- */

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [];
    messages.forEach((message, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const gapPrev = prev ? time(message.created_at) - time(prev.created_at) : Infinity;
      const gapNext = next ? time(next.created_at) - time(message.created_at) : Infinity;
      const sameAsPrev = !!prev && prev.kind === 'text' && message.kind === 'text' && prev.sender === message.sender && gapPrev < GROUP_GAP_MS;
      const sameAsNext = !!next && next.kind === 'text' && message.kind === 'text' && next.sender === message.sender && gapNext < GROUP_GAP_MS;

      list.push({
        type: 'message',
        key: `m${message.id}`,
        message,
        separator: !prev || gapPrev > SEPARATOR_GAP_MS ? separatorTime(message.created_at) : null,
        groupStart: !sameAsPrev,
        groupEnd: !sameAsNext,
      });
    });
    pending.forEach((p) => list.push({ type: 'pending', key: `p${p.client_id}`, pending: p }));
    // Liste inversée : le plus récent en bas, sous le pouce.
    return list.reverse();
  }, [messages, pending]);

  // « Vu » : sous le plus récent de mes messages déjà lus par l'autre partie.
  const seenId = useMemo(() => {
    const mine = messages.filter((m) => m.mine && m.id <= otherLastRead);
    return mine.length ? mine[mine.length - 1].id : null;
  }, [messages, otherLastRead]);

  /* ---- Rendu ---- */

  const otherAvatar = (
    <ExpertAvatar
      uri={isGuest ? header?.expert?.avatar_url ?? null : null}
      name={name || '?'}
      size={AVATAR}
      ringWidth={0}
      fillColor={isGuest ? Colors.lblue3 : Colors.purple3}
      initialsColor={isGuest ? Colors.lblueDark : Colors.purpleDark}
    />
  );

  const renderEvent = (message: ChatMessage) => {
    const offer = message.event?.type === 'inquiry' ? message.event.offer : null;
    if (!offer) {
      return (
        <View style={styles.eventWrap}>
          <Text style={styles.eventText}>{message.body}</Text>
        </View>
      );
    }

    // Contact depuis un thème : encadré, pour situer la discussion.
    return (
      <View style={styles.eventWrap}>
        <View style={styles.inquiry}>
          <View style={styles.inquiryHead}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={CHAT_BLUE} />
            <Text style={styles.inquiryKicker}>À propos du thème</Text>
          </View>
          <Text style={styles.inquiryTitle}>{offer.title}</Text>
          <View style={styles.inquiryMeta}>
            {offer.duration_label ? <Text style={styles.inquiryDuration}>{offer.duration_label}</Text> : null}
            {offer.mode ? <ModePill mode={offer.mode} size="compact" /> : null}
          </View>
          <Text style={styles.inquiryText}>{message.body}</Text>
        </View>
      </View>
    );
  };

  const bubbleShape = (mine: boolean, groupStart: boolean, groupEnd: boolean) =>
    mine
      ? {
          borderTopRightRadius: groupStart ? RADIUS : RADIUS_JOINED,
          borderBottomRightRadius: groupEnd ? RADIUS : RADIUS_JOINED,
        }
      : {
          borderTopLeftRadius: groupStart ? RADIUS : RADIUS_JOINED,
          borderBottomLeftRadius: groupEnd ? RADIUS : RADIUS_JOINED,
        };

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === 'pending') {
      const p = item.pending;
      return (
        <View style={[styles.line, styles.lineMine, styles.groupEnd]}>
          <Pressable
            onPress={() => p.status === 'failed' && deliver(p)}
            disabled={p.status !== 'failed'}
            style={styles.mineColumn}
          >
            <View style={[styles.bubble, styles.bubbleMine, styles.bubblePending, bubbleShape(true, true, true)]}>
              <Text style={styles.textMine}>{p.body}</Text>
            </View>
            <Text style={[styles.status, p.status === 'failed' && styles.statusFailed]}>
              {p.status === 'failed' ? "Échec de l'envoi · Touchez pour réessayer" : 'Envoi…'}
            </Text>
          </Pressable>
        </View>
      );
    }

    const { message, separator, groupStart, groupEnd } = item;
    return (
      <View>
        {separator ? <Text style={styles.separator}>{separator}</Text> : null}

        {message.kind === 'event' ? (
          renderEvent(message)
        ) : message.mine ? (
          <View style={[styles.line, styles.lineMine, groupEnd && styles.groupEnd]}>
            <View style={styles.mineColumn}>
              <View style={[styles.bubble, styles.bubbleMine, bubbleShape(true, groupStart, groupEnd)]}>
                <Text style={styles.textMine} selectable>
                  {message.body}
                </Text>
              </View>
              {message.id === seenId ? <Text style={styles.status}>Vu</Text> : null}
            </View>
          </View>
        ) : (
          <View style={[styles.line, groupEnd && styles.groupEnd]}>
            <View style={styles.avatarSlot}>{groupEnd ? otherAvatar : null}</View>
            <View style={[styles.bubble, styles.bubbleOther, bubbleShape(false, groupStart, groupEnd)]}>
              <Text style={styles.textOther} selectable>
                {message.body}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const headerView = (
      <Pressable style={styles.header} onPress={minimized ? onExpand : undefined} disabled={!minimized}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Retour">
            <Ionicons name="chevron-back" size={28} color={CHAT_BLUE} />
          </TouchableOpacity>
        ) : null}
        <ExpertAvatar
          uri={isGuest ? header?.expert?.avatar_url ?? null : null}
          name={name || '?'}
          size={38}
          ringWidth={0}
          fillColor={isGuest ? Colors.lblue3 : Colors.purple3}
          initialsColor={isGuest ? Colors.lblueDark : Colors.purpleDark}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
          {header ? <Text style={styles.headerRole}>{isGuest ? 'Expert' : 'Demandeur'}</Text> : null}
        </View>
        {onMinimize ? (
          <TouchableOpacity
            onPress={minimized ? onExpand : onMinimize}
            hitSlop={8}
            style={styles.headerAction}
            accessibilityLabel={minimized ? 'Agrandir' : 'Réduire'}
          >
            <Ionicons name={minimized ? 'chevron-up' : 'remove'} size={22} color={CHAT_BLUE} />
          </TouchableOpacity>
        ) : null}
        {onClose ? (
          <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.headerAction} accessibilityLabel="Fermer">
            <Ionicons name="close" size={22} color={CHAT_BLUE} />
          </TouchableOpacity>
        ) : null}
      </Pressable>
  );

  if (minimized) {
    return <View style={styles.container}>{headerView}</View>;
  }

  return (
    <View style={styles.container}>
      {headerView}

      <View style={styles.flex}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={CHAT_BLUE} />
          </View>
        ) : (
          <FlatList
            data={rows}
            inverted
            keyExtractor={(row) => row.key}
            renderItem={renderRow}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingOlder ? <ActivityIndicator color={CHAT_BLUE} style={styles.older} /> : null}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} hitSlop={8} accessibilityLabel="Fermer">
              <Ionicons name="close" size={18} color={Colors.subtext} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ---- Saisie ---- */}
        {canWrite ? (
          <View style={[styles.composer, { paddingBottom: composerBottom }]}>
            <TextInput
              ref={inputRef}
              // Web : pas de contour noir du navigateur au focus, la bulle grise suffit.
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                if (error) setError(null);
              }}
              placeholder="Message"
              placeholderTextColor={Colors.subtext}
              multiline
              // Web : une ligne au départ (sinon la zone de texte en montre deux), comme la saisie mobile.
              {...(Platform.OS === 'web' ? { numberOfLines: 1 } : {})}
              // Web : Entrée envoie, Maj + Entrée passe à la ligne (comme Messenger).
              // Pas pendant une composition (saisie avec accents / IME) : Entrée la valide seulement.
              onKeyPress={(e: any) => {
                if (Platform.OS !== 'web') return;
                const key = e.nativeEvent;
                if (key?.key === 'Enter' && !key.shiftKey && !key.isComposing && key.keyCode !== 229) {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={BODY_MAX}
            />
            <TouchableOpacity
              style={styles.send}
              onPress={send}
              disabled={!draft.trim()}
              hitSlop={6}
              accessibilityLabel="Envoyer"
            >
              <Ionicons name="send" size={22} color={draft.trim() ? CHAT_BLUE : Colors.border} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.closed, { paddingBottom: composerBottom }]}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.subtext} />
            <Text style={styles.closedText}>Vous pourrez écrire dès qu'un rendez-vous sera accepté.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  headerAction: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRole: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },

  /* ---- Fil ---- */
  list: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  older: {
    paddingVertical: Spacings.sm,
  },
  separator: {
    alignSelf: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.subtext,
    marginTop: Spacings.md,
    marginBottom: Spacings.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacings.xs,
    marginTop: 2,
  },
  lineMine: {
    justifyContent: 'flex-end',
  },
  groupEnd: {
    marginBottom: Spacings.xs,
  },
  avatarSlot: {
    width: AVATAR,
  },
  mineColumn: {
    maxWidth: '78%',
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS,
  },
  bubbleMine: {
    backgroundColor: CHAT_BLUE,
  },
  bubblePending: {
    opacity: 0.6,
  },
  bubbleOther: {
    maxWidth: '72%',
    backgroundColor: CHAT_BUBBLE_OTHER,
  },
  textMine: {
    fontFamily: 'Roboto',
    fontSize: 16,
    lineHeight: 21,
    color: Colors.white,
  },
  textOther: {
    fontFamily: 'Roboto',
    fontSize: 16,
    lineHeight: 21,
    color: Colors.text,
  },
  status: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext,
    marginTop: 2,
    marginRight: 4,
  },
  statusFailed: {
    color: Colors.danger,
  },

  /* ---- Événements ---- */
  eventWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    marginVertical: Spacings.sm,
  },
  eventText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
    textAlign: 'center',
  },
  inquiry: {
    width: '100%',
    maxWidth: 340,
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E6FF',
    backgroundColor: '#F3F8FF',
    gap: 4,
  },
  inquiryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inquiryKicker: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: CHAT_BLUE,
  },
  inquiryTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  inquiryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  inquiryDuration: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  inquiryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
    marginTop: 2,
  },

  /* ---- Saisie ---- */
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginHorizontal: Spacings.sm,
    marginBottom: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
  },
  errorText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.danger,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: INPUT_MAX_HEIGHT,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    borderRadius: 20,
    backgroundColor: CHAT_BUBBLE_OTHER,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: Colors.text,
  },
  send: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  closedText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'center',
  },
});
