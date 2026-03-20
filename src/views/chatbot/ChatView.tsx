import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';

import {
  fetchChatHistory,
  sendMessage,
  type ChatDayGroup,
  type ChatMessage,
} from '../../services/v2/ChatService';

type MessageRole = 'user' | 'ai';

interface UIMessage {
  id: string;
  role: MessageRole;
  text: string;
  time: string;
}

interface UIGroup {
  date: string;
  label: string;
  messages: UIMessage[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const nowTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/** Chuyển ChatMessage (Laravel) → UIMessage (local) */
const toUIMessage = (m: ChatMessage): UIMessage => ({
  id: String(m.id),
  role: m.role === 'bot' ? 'ai' : 'user',
  text: m.content,
  time: m.time,
});

/** Chuyển ChatDayGroup[] (Laravel) → UIGroup[] (local) */
const toUIGroups = (groups: ChatDayGroup[]): UIGroup[] =>
  groups.map((g) => ({
    date: g.date,
    label: g.label,
    messages: g.messages.map(toUIMessage),
  }));

// ── Sub-components ────────────────────────────────────────────────────────────
const DateDivider = ({ label }: { label: string }) => (
  <View style={styles.dateDividerRow}>
    <View style={styles.dateDividerLine} />
    <Text style={styles.dateDividerText}>{label}</Text>
    <View style={styles.dateDividerLine} />
  </View>
);

const AIAvatar = () => (
  <View style={styles.aiAvatar}>
    <View style={styles.aiAvatarDot} />
  </View>
);

const MessageBubble = ({ message }: { message: UIMessage }) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
      {!isUser && (
        <View style={styles.aiLabelRow}>
          <AIAvatar />
          <Text style={styles.aiName}>Assistant IA</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timeText, isUser && { textAlign: 'right' }]}>{message.time}</Text>
    </View>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export const ChatView = ({ navigation, route }) => {
  const domainId = route?.params?.domainId ?? '';
  const planName = 'Starter';

  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const conversationIdRef = useRef<string | null>(route?.params?.conversationId ?? null);
  const nextCursorRef = useRef<number | null>(null);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!conversationIdRef.current);

  // ── Keyboard listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      scrollToBottom();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      scrollToBottom();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Load lịch sử lần đầu (nếu có conversationId từ route) ───────────────────
  useEffect(() => {
    if (!conversationIdRef.current) return;
    loadHistory();
  }, []);

  const loadHistory = async (cursor?: number | null) => {
    if (!conversationIdRef.current) return;
    try {
      const res = await fetchChatHistory(conversationIdRef.current, cursor);
      hasMoreRef.current = res.pagination.has_more;
      nextCursorRef.current = res.pagination.next_cursor;

      if (!cursor) {
        // Lần đầu: set toàn bộ
        setGroups(toUIGroups(res.data));
        setTimeout(scrollToBottom, 200);
      } else {
        // Scroll up load thêm: prepend vào đầu, merge group cùng ngày nếu có
        setGroups((prev) => mergeGroups(toUIGroups(res.data), prev));
      }
    } catch (e) {
      console.error('loadHistory error', e);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  /**
   * Merge oldGroups (mới load) vào đầu currentGroups.
   * Nếu ngày cuối của oldGroups trùng ngày đầu của currentGroups → gộp messages.
   */
  const mergeGroups = (oldGroups: UIGroup[], currentGroups: UIGroup[]): UIGroup[] => {
    if (!oldGroups.length) return currentGroups;
    if (!currentGroups.length) return oldGroups;

    const lastOld = oldGroups[oldGroups.length - 1];
    const firstCurrent = currentGroups[0];

    if (lastOld.date === firstCurrent.date) {
      const merged: UIGroup = {
        ...lastOld,
        messages: [...lastOld.messages, ...firstCurrent.messages],
      };
      return [...oldGroups.slice(0, -1), merged, ...currentGroups.slice(1)];
    }
    return [...oldGroups, ...currentGroups];
  };

  const handleScrollToTop = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    loadHistory(nextCursorRef.current);
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const userMsg: UIMessage = {
      id: tempId,
      role: 'user',
      text: trimmed,
      time: nowTime(),
    };

    // Thêm tin user vào today group ngay lập tức (optimistic)
    appendMessage(userMsg);
    setInputText('');
    setIsSending(true);
    scrollToBottom();

    try {
      const res = await sendMessage(trimmed, domainId, conversationIdRef.current);

      if (!conversationIdRef.current) {
        conversationIdRef.current = res.chat_conversation_id;
      }

      const botMsg: UIMessage = {
        id: String(res.message_id),
        role: 'ai',
        text: res.answer,
        time: new Date(res.sent_at).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      appendMessage(botMsg);
      scrollToBottom();
    } catch (e) {
      console.error('sendMessage error', e);
      // Hiện lỗi dưới dạng tin bot tạm
      appendMessage({
        id: `err-${Date.now()}`,
        role: 'ai',
        text: 'Erreur de connexion. Veuillez réessayer.',
        time: nowTime(),
      });
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Thêm message vào group "Hôm nay".
   * Nếu group chưa tồn tại thì tạo mới.
   */
  const appendMessage = (msg: UIMessage) => {
    const todayDate = new Date().toISOString().split('T')[0]; // "2025-03-20"
    setGroups((prev) => {
      const existing = [...prev];
      const todayIdx = existing.findIndex((g) => g.date === todayDate);
      if (todayIdx >= 0) {
        existing[todayIdx] = {
          ...existing[todayIdx],
          messages: [...existing[todayIdx].messages, msg],
        };
        return existing;
      }
      // Tạo group mới cho hôm nay
      return [...existing, { date: todayDate, label: "Aujourd'hui", messages: [msg] }];
    });
  };

  // ── Flatten groups → items cho FlatList ──────────────────────────────────────
  type FlatItem =
    | { type: 'divider'; date: string; label: string; key: string }
    | { type: 'message'; data: UIMessage; key: string };

  const flatItems: FlatItem[] = groups.flatMap((g) => [
    { type: 'divider', date: g.date, label: g.label, key: `div-${g.date}` },
    ...g.messages.map((m) => ({ type: 'message' as const, data: m, key: m.id })),
  ]);

  const canSend = inputText.trim().length > 0 && !isSending;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <View style={styles.activeDot} />
            <Text style={styles.headerDomain} numberOfLines={1}>Oscar</Text>
          </View>
          <Text style={styles.headerSub}>Assistance IA</Text>
        </View>

        <View style={styles.planChip}>
          <Ionicons name="flash" size={9} color="#F6C90E" style={{ marginRight: 3 }} />
          <Text style={styles.planChipText}>{planName}</Text>
        </View>
      </View>

      {/* ── BODY ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── MESSAGES ── */}
        {isInitialLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color="#00A3FF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={flatItems}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={scrollToBottom}
            // Scroll lên đầu → load thêm tin cũ
            onScrollToIndexFailed={() => {}}
            onScroll={({ nativeEvent }) => {
              if (nativeEvent.contentOffset.y < 60) handleScrollToTop();
            }}
            scrollEventThrottle={300}
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#00A3FF" />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.type === 'divider') {
                return <DateDivider label={item.label} />;
              }
              return <MessageBubble message={item.data} />;
            }}
            ListFooterComponent={
              isSending ? (
                <View style={[styles.msgRow, styles.msgRowAI]}>
                  <View style={styles.aiLabelRow}>
                    <AIAvatar />
                    <Text style={styles.aiName}>Assistant IA</Text>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                    <Text style={styles.typingDots}>• • •</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* ── INPUT ── */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: Platform.OS === 'ios'
                ? (keyboardOpen ? 12 : 12 + insets.bottom)
                : 12 + insets.bottom,
            },
          ]}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Aa"
              placeholderTextColor="rgba(130,150,170,0.5)"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, canSend && styles.sendButtonActive]}
              onPress={handleSend}
              activeOpacity={canSend ? 0.8 : 1}
              disabled={!canSend}
            >
              <Ionicons
                name="send"
                size={16}
                color={canSend ? Colors.white : 'rgba(100,116,139,0.4)'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles (không thay đổi so với bản gốc) ───────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#39FF14',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  headerDomain: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#E0E6ED',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#8492A6',
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246,201,14,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(246,201,14,0.3)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planChipText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#F6C90E',
  },

  // ── Messages
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  dateDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dateDividerText: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: 'rgba(130,150,170,0.45)',
  },

  // ── Bubbles
  msgRow: {
    marginBottom: 2,
  },
  msgRowUser: {
    alignItems: 'flex-end',
  },
  msgRowAI: {
    alignItems: 'flex-start',
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  aiAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,163,255,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,163,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A3FF',
  },
  aiName: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#8492A6',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleUser: {
    backgroundColor: '#00A3FF',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleAI: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(180,200,220,0.1)',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.white,
  },
  bubbleTextAI: {
    color: '#C8D6E5',
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(130,150,170,0.45)',
    marginTop: 4,
  },

  // ── Typing indicator
  typingBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingDots: {
    fontSize: 14,
    color: 'rgba(0,163,255,0.6)',
    letterSpacing: 3,
  },

  // ── Input
  inputContainer: {
    backgroundColor: Colors.blackBackground,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(180,200,220,0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#E0E6ED',
    maxHeight: 110,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(100,116,139,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(100,116,139,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#00A3FF',
    borderColor: '#00A3FF',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
});