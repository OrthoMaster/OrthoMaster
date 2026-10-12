import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import {
  aiSearch,
  AiSearchErrorCode,
  AiSearchOption,
  AiSearchPayload,
  AiSearchVideo,
} from '../../services/v2/ContentService';
import { AI_SEARCH_STATUS_KEY } from '../../hooks/useAiSearchAvailable';

const { width } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;

/*
 * Écran de lecture d'une vidéo selon la pile d'où l'assistant est ouvert : chaque pile
 * a ses propres noms d'écran, naviguer vers un écran d'une autre pile donne une 404.
 */
const PREVIEW_SCREENS = {
  media: 'flash-media-preview',
} as const;

type OpenFrom = keyof typeof PREVIEW_SCREENS;

/** Même limite que le serveur (ai_search.conversation.max_message_length). */
const MAX_MESSAGE_LENGTH = 300;

/**
 * Exemples proposés à l'ouverture. Désactivés pour l'instant : remettre des phrases ici
 * (ou les charger depuis le serveur) suffit à réafficher le bloc.
 */
const SUGGESTIONS: string[] = [];

const ERROR_MESSAGES: Record<AiSearchErrorCode, string> = {
  ai_unavailable: 'L\'assistant est momentanément indisponible. Vous pouvez utiliser la recherche classique.',
  network: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
  rate_limited: 'Vous avez atteint la limite de recherches pour le moment. Réessayez un peu plus tard.',
  session_expired: 'La conversation a expiré. Posez à nouveau votre question.',
  invalid_request: 'Je n\'ai pas compris cette demande. Pouvez-vous la reformuler ?',
};

type ChatItem =
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

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');

  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

/* ===================== Indicateur de saisie ===================== */

const TypingDots = () => {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          // Décalage par point pour obtenir la vague plutôt qu'un clignotement simultané.
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    animations.forEach((a) => a.start());

    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { opacity: dot, transform: [{ scale: dot }] }]}
        />
      ))}
    </View>
  );
};

/* ===================== Écran ===================== */

export const MediaAiSearchView = ({ navigation, route }) => {
  const openFrom: OpenFrom = route.params?.openFrom ?? 'media';
  const initialMessage: string | undefined = route.params?.initialMessage;

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Assistant indisponible : la saisie est remplacée par un retour vers la recherche classique.
  const [isClosed, setIsClosed] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Refs plutôt que state : lues dans des callbacks async, elles doivent toujours être à jour.
  const sessionIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const idRef = useRef(0);
  const initialSentRef = useRef(false);

  const scrollRef = useRef<ScrollView>(null);
  // Nouvelle réponse : on fait défiler jusqu'à son début, pas jusqu'au bas de la liste,
  // sinon une longue liste de vidéos cache le message de l'assistant.
  const scrollTargetRef = useRef<string | null>(null);
  const stickToEndRef = useRef(true);

  // L'assistant s'ouvre depuis la recherche, qui a déjà masqué la barre d'onglets et la
  // réaffichera en se démontant : ne pas la réafficher ici, sinon elle revient sur la recherche.
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Recherche classique sans résultat → l'utilisateur arrive avec sa requête déjà posée.
  // La ref évite le double envoi du StrictMode qui rejoue les effets.
  useEffect(() => {
    if (initialMessage && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  const nextId = () => `m${++idRef.current}`;

  const pushItem = (item: ChatItem) => setItems((prev) => [...prev, item]);

  // Une seule question reste interactive : la dernière.
  const closeOpenQuestions = () =>
    setItems((prev) =>
      prev.map((item) =>
        item.role === 'assistant' && item.kind === 'question' && !item.answered
          ? { ...item, answered: true }
          : item
      )
    );

  /* ---- Appels API ---- */

  const request = async (payload: AiSearchPayload, retryOnExpired: boolean) => {
    loadingRef.current = true;
    setIsLoading(true);
    stickToEndRef.current = true;

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
        setIsClosed(true);
        Keyboard.dismiss();
      }

      const id = nextId();
      scrollTargetRef.current = id;
      pushItem({
        id,
        role: 'assistant',
        kind: 'text',
        // Un code inconnu (nouvelle version du serveur) ne doit pas afficher une bulle vide.
        text: ERROR_MESSAGES[response.code] ?? ERROR_MESSAGES.ai_unavailable,
        isError: true,
      });
      return;
    }

    const data = response.data;
    sessionIdRef.current = data.session_id;

    const id = nextId();
    scrollTargetRef.current = id;

    if (data.type === 'question') {
      pushItem({
        id,
        role: 'assistant',
        kind: 'question',
        text: data.message,
        options: data.options,
        total: data.total,
        answered: false,
      });
    } else {
      pushItem({ id, role: 'assistant', kind: 'results', text: data.message, videos: data.videos, total: data.total });
    }
  };

  const sendMessage = (raw?: string) => {
    const text = (raw ?? input).trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || loadingRef.current || isClosed) return;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text });
    setInput('');
    request({ message: text }, true);
  };

  const chooseOption = (option: AiSearchOption) => {
    if (loadingRef.current || isClosed) return;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text: option.label });
    request({ option_id: option.id }, false);
  };

  const showResults = (total: number) => {
    if (loadingRef.current || isClosed) return;

    closeOpenQuestions();
    pushItem({ id: nextId(), role: 'user', text: `Voir les ${total} vidéos` });
    request({ action: 'show' }, false);
  };

  const resetConversation = () => {
    if (loadingRef.current) return;

    sessionIdRef.current = null;
    stickToEndRef.current = true;
    setItems([]);
    setInput('');
  };

  const openVideo = (video: AiSearchVideo) => {
    navigation.navigate(PREVIEW_SCREENS[openFrom], { media: video });
  };

  /* ---- Défilement ---- */

  const handleContentSizeChange = () => {
    if (stickToEndRef.current && !scrollTargetRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleItemLayout = (id: string, y: number) => {
    if (scrollTargetRef.current !== id) return;

    scrollTargetRef.current = null;
    stickToEndRef.current = false;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - Spacings.md), animated: true });
  };

  /* ---- Rendu des messages ---- */

  const renderAvatar = () => (
    <View style={styles.avatar}>
      <Ionicons name="sparkles" size={14} color={Colors.white} />
    </View>
  );

  // Même structure que SimilarMediasContentCard (aperçu d'un média), posée dans une carte
  // avec ombre pour signaler qu'elle est cliquable.
  const renderVideo = (video: AiSearchVideo) => (
    <TouchableOpacity
      key={`ai-video-${video.id_content}`}
      style={styles.videoCard}
      activeOpacity={0.7}
      onPress={() => openVideo(video)}
    >
      <View style={styles.videoRow}>
        {video.thumbnail
          ? <Image source={{ uri: video.thumbnail }} style={styles.videoImage} />
          : (
            <View style={[styles.videoImage, styles.videoImagePlaceholder]}>
              <MaterialCommunityIcons name="play-circle" size={32} color={Colors.grayLight} />
            </View>
          )
        }

        <View style={styles.videoDescription}>
          <Text style={styles.videoAuthor} numberOfLines={1} ellipsizeMode="tail">
            {video.expert_names ? video.expert_names : 'OrthoMaster'}
          </Text>
          <Text style={styles.videoTitle} numberOfLines={2} ellipsizeMode="tail">
            {video.title}
          </Text>

          {!!video.duration && (
            <View style={styles.videoMetadata}>
              <AntDesign name="clock-circle" size={12} color={Colors.subtext2} />
              <Text style={styles.videoMetatext}>{video.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {video.matched_chapter && (
        <View style={styles.chapterNote}>
          <FontAwesome name="play" size={10} color={Colors.redDark} style={styles.chapterNoteIcon} />
          <Text style={styles.chapterNoteText}>
            Abordé à <Text style={styles.chapterNoteTime}>{formatTime(video.matched_chapter.seconds)}</Text>
            {' : '}{video.matched_chapter.label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAssistant = (item: Extract<ChatItem, { role: 'assistant' }>) => (
    <View style={styles.assistantRow}>
      {renderAvatar()}
      <View style={styles.assistantContent}>
        <View style={[styles.assistantBubble, item.kind === 'text' && item.isError && styles.errorBubble]}>
          <Text style={[styles.assistantText, item.kind === 'text' && item.isError && styles.errorText]}>
            {item.text}
          </Text>
        </View>

        {item.kind === 'question' && (
          <View style={styles.optionsWrap}>
            {item.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionPill,
                  // Le compteur a son propre fond arrondi : il remplace la marge droite.
                  option.count !== null && styles.optionPillWithCount,
                  item.answered && styles.pillDisabled,
                ]}
                disabled={item.answered || isLoading}
                activeOpacity={0.7}
                onPress={() => chooseOption(option)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                {option.count !== null && (
                  <View style={styles.optionCount}>
                    <Text style={styles.optionCountText}>{option.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {item.total !== null && item.total > 0 && (
              <TouchableOpacity
                style={[styles.showPill, item.answered && styles.pillDisabled]}
                disabled={item.answered || isLoading}
                activeOpacity={0.7}
                onPress={() => showResults(item.total as number)}
              >
                <Ionicons name="play" size={12} color={Colors.white} />
                <Text style={styles.showPillText}>Voir les {item.total} vidéos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {item.kind === 'results' && item.videos.length > 0 && (
          <View style={styles.videoList}>
            {item.videos.map(renderVideo)}
            {item.total > item.videos.length && (
              <Text style={styles.resultsFootnote}>
                Les {item.videos.length} vidéos les plus pertinentes sur {item.total}.
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderItem = (item: ChatItem) => (
    <View key={item.id} onLayout={(e) => handleItemLayout(item.id, e.nativeEvent.layout.y)}>
      {item.role === 'user'
        ? (
          <View style={styles.userRow}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{item.text}</Text>
            </View>
          </View>
        )
        : renderAssistant(item)
      }
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.welcome}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="sparkles" size={28} color={Colors.white} />
      </View>
      <Text style={styles.welcomeTitle}>Que cherchez-vous ?</Text>
      <Text style={styles.welcomeText}>
        Décrivez un sujet, une pathologie, un intervenant ou un congrès. Je vous aide à affiner si besoin.
      </Text>

      {SUGGESTIONS.length > 0 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.suggestionPill}
              activeOpacity={0.7}
              onPress={() => sendMessage(suggestion)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.redDark} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.red} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.roundButton, styles.backButton]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={16} color={Colors.white} />
            <Text style={styles.headerTitle}>Assistant Médias</Text>
          </View>
          <Text style={styles.headerSubtitle}>Recherche guidée par l'IA</Text>
        </View>

        {items.length > 0
          ? (
            <TouchableOpacity style={[styles.roundButton, styles.resetButton]} onPress={resetConversation}>
              <Ionicons name="refresh" size={20} color={Colors.white} />
            </TouchableOpacity>
          )
          : <View style={styles.resetButton} />
        }
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
        >
          {items.length === 0 && !isLoading && renderWelcome()}
          {items.map(renderItem)}

          {isLoading && (
            <View style={styles.assistantRow}>
              {renderAvatar()}
              <View style={styles.assistantBubble}>
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Saisie */}
        <View
          style={[
            styles.inputBar,
            // Clavier ouvert : il couvre déjà la zone de sécurité du bas.
            { paddingBottom: keyboardVisible ? Spacings.sm : Math.max(insets.bottom, Spacings.sm) },
          ]}
        >
          {isClosed
            ? (
              <TouchableOpacity style={styles.closedButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
                <Ionicons name="search-outline" size={18} color={Colors.white} />
                <Text style={styles.closedButtonText}>Retour à la recherche</Text>
              </TouchableOpacity>
            )
            : (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Posez votre question…"
                  placeholderTextColor={Colors.gray}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={MAX_MESSAGE_LENGTH}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                  disabled={!canSend}
                  activeOpacity={0.7}
                  onPress={() => sendMessage()}
                >
                  <Ionicons name="arrow-up" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )
          }
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.red,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    backgroundColor: Colors.red,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  backButton: {},
  resetButton: {
    width: 40,
    height: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: 'rgba(255,255,255,0.8)',
  },

  /* ---- Liste des messages ---- */
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.lg,
    gap: Spacings.md,
    width: '100%',
    maxWidth: isTablet ? 720 : undefined,
    alignSelf: 'center',
  },

  /* ---- Accueil ---- */
  welcome: {
    alignItems: 'center',
    paddingTop: Spacings.xl,
    paddingHorizontal: Spacings.md,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    marginBottom: Spacings.md,
  },
  welcomeTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  welcomeText: {
    fontSize: isTablet ? 17 : 15,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: isTablet ? 24 : 22,
    marginBottom: Spacings.lg,
  },
  suggestions: {
    width: '100%',
    gap: Spacings.sm,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },

  /* ---- Bulles ---- */
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: Colors.red,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userText: {
    fontSize: isTablet ? 17 : 15,
    fontFamily: 'Roboto',
    color: Colors.white,
    lineHeight: isTablet ? 24 : 22,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    marginTop: 2,
  },
  assistantContent: {
    flex: 1,
    gap: Spacings.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: Colors.white,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    borderTopLeftRadius: 4,
  },
  assistantText: {
    fontSize: isTablet ? 17 : 15,
    fontFamily: 'Roboto',
    color: Colors.text,
    lineHeight: isTablet ? 24 : 22,
  },
  errorBubble: {
    backgroundColor: Colors.red3,
    borderWidth: 1,
    borderColor: Colors.redDark,
  },
  errorText: {
    color: Colors.redDark,
  },

  /* ---- Indicateur de saisie ---- */
  typingRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.redDark,
  },

  /* ---- Options ---- */
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  // Ombre commune aux pastilles cliquables : les distingue du texte des bulles.
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.xs + 2,
    paddingHorizontal: Spacings.md,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.red,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  optionPillWithCount: {
    paddingRight: Spacings.xs,
  },
  optionText: {
    fontSize: isTablet ? 16 : 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.redDark,
  },
  optionCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: Colors.red3,
    alignItems: 'center',
  },
  optionCountText: {
    fontSize: isTablet ? 13 : 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.redDark,
  },
  showPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.xs + 2,
    paddingHorizontal: Spacings.md,
    borderRadius: 999,
    backgroundColor: Colors.red,
    borderWidth: 1,
    borderColor: Colors.red,
    shadowColor: Colors.redDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  showPillText: {
    fontSize: isTablet ? 16 : 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  // Une pastille désactivée ne doit plus sembler cliquable : on retire aussi l'ombre.
  pillDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  /* ---- Vidéos ---- */
  videoList: {
    gap: Spacings.md,
  },
  // Pas d'overflow: 'hidden' ici : sur iOS il couperait l'ombre de la carte.
  videoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacings.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  // Plus petite que dans l'aperçu (100 px de haut) : la bulle de chat est plus étroite que l'écran.
  videoImage: {
    width: (isTablet ? 100 : 72) * 16 / 9,
    height: isTablet ? 100 : 72,
    borderRadius: 8,
    objectFit: 'cover',
  },
  videoImagePlaceholder: {
    backgroundColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDescription: {
    flex: 1,
    flexShrink: 1,
  },
  videoAuthor: {
    fontSize: isTablet ? 15 : 12,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  videoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? 16 : 13,
    color: Colors.text,
    lineHeight: isTablet ? 22 : 18,
  },
  videoMetadata: {
    marginTop: Spacings.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  videoMetatext: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? 13 : 11,
    color: Colors.subtext2,
  },
  chapterNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
    paddingTop: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  // Aligne le triangle sur la première ligne du texte.
  chapterNoteIcon: {
    marginTop: isTablet ? 5 : 4,
  },
  chapterNoteText: {
    flex: 1,
    fontSize: isTablet ? 15 : 13,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    color: Colors.subtext,
    lineHeight: isTablet ? 20 : 18,
  },
  chapterNoteTime: {
    fontFamily: 'Poppins-Medium',
    fontStyle: 'normal',
    color: Colors.redDark,
  },
  resultsFootnote: {
    fontSize: isTablet ? 15 : 13,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    paddingHorizontal: Spacings.xs,
  },

  /* ---- Saisie ---- */
  inputBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: Spacings.sm,
    paddingHorizontal: Spacings.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacings.sm,
    width: '100%',
    maxWidth: isTablet ? 720 : undefined,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingHorizontal: Spacings.md,
    paddingTop: Platform.OS === 'ios' ? 10 : Spacings.xs,
    paddingBottom: Platform.OS === 'ios' ? 10 : Spacings.xs,
    borderRadius: 20,
    backgroundColor: Colors.grayLight,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  closedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.red,
  },
  closedButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});