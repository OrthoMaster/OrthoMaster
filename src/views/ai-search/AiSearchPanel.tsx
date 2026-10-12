import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { AiSearchOption, AiSearchVideo } from '../../services/v2/ContentService';
import {
  AiChatItem,
  AI_SEARCH_MAX_MESSAGE_LENGTH,
  formatAiChapterTime,
  useAiSearchConversation,
} from '../../hooks/useAiSearchConversation';

/*
 * Contenu de l'assistant pour le web, sans voile ni navigation : il s'affiche à l'intérieur
 * d'un panneau existant (celui de la recherche, ou celui de MediaAiSearchView.web).
 * Utilisé uniquement sur web : survol, Entrée pour envoyer.
 */

const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_HEIGHT = 140;

/** Hauteur réservée en haut de la liste pour que le bouton retour ne masque aucun message. */
const BACK_BUTTON_SPACE = 72;

export type AiSearchPendingMessage = { text: string; nonce: number };

type Props = {
  onBack: () => void;
  onOpenVideo: (video: AiSearchVideo) => void;
  /** Message à envoyer dès réception ; le nonce permet d'envoyer deux fois le même texte. */
  pendingMessage?: AiSearchPendingMessage | null;
  /** Le panneau peut rester monté mais caché : la saisie ne reprend le focus qu'une fois visible. */
  visible?: boolean;
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
          Animated.timing(dot, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: false }),
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

/* ===================== Panneau ===================== */

export const AiSearchPanel: React.FC<Props> = ({ onBack, onOpenVideo, pendingMessage, visible = true }) => {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const lastNonceRef = useRef<number | null>(null);
  // Nouvelle réponse : on fait défiler jusqu'à son début, pas jusqu'au bas de la liste,
  // sinon une longue liste de vidéos cache le message de l'assistant.
  const scrollTargetRef = useRef<string | null>(null);
  const stickToEndRef = useRef(true);

  const { items, isLoading, isClosed, sendMessage, chooseOption, showResults } =
    useAiSearchConversation({
      onAssistantItem: (id) => {
        scrollTargetRef.current = id;
      },
      onRequestStart: () => {
        stickToEndRef.current = true;
      },
    });

  // La ref sur le nonce évite le double envoi du StrictMode qui rejoue les effets.
  useEffect(() => {
    if (pendingMessage && lastNonceRef.current !== pendingMessage.nonce) {
      lastNonceRef.current = pendingMessage.nonce;
      sendMessage(pendingMessage.text);
    }
  }, [pendingMessage]);

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  const submit = () => {
    if (sendMessage(input)) {
      setInput('');
      setInputHeight(INPUT_MIN_HEIGHT);
    }
    inputRef.current?.focus();
  };

  // Entrée envoie, Maj + Entrée passe à la ligne : comportement attendu d'un chat sur ordinateur.
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      submit();
    }
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
    scrollRef.current?.scrollTo({ y: Math.max(0, y - BACK_BUTTON_SPACE), animated: true });
  };

  /* ---- Rendu des messages ---- */

  const renderAvatar = () => (
    <View style={styles.avatar}>
      <Ionicons name="sparkles" size={16} color={Colors.white} />
    </View>
  );

  // Même structure que SimilarMediasContentCard (aperçu d'un média), posée dans une carte
  // avec ombre pour signaler qu'elle est cliquable ; l'ombre se renforce au survol.
  const renderVideo = (video: AiSearchVideo) => (
    <Pressable
      key={`ai-video-${video.id_content}`}
      onPress={() => onOpenVideo(video)}
      style={({ hovered }: any) => [styles.videoCard, hovered && styles.videoCardHovered]}
    >
      <View style={styles.videoRow}>
        {video.thumbnail
          ? <Image source={{ uri: video.thumbnail }} style={styles.videoImage} />
          : (
            <View style={[styles.videoImage, styles.videoImagePlaceholder]}>
              <MaterialCommunityIcons name="play-circle" size={36} color={Colors.grayLight} />
            </View>
          )
        }

        <View style={styles.videoDescription}>
          <Text style={styles.videoAuthor} numberOfLines={1}>
            {video.expert_names ? video.expert_names : 'OrthoMaster'}
          </Text>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>

          {!!video.duration && (
            <View style={styles.videoMetadata}>
              <AntDesign name="clock-circle" size={13} color={Colors.subtext2} />
              <Text style={styles.videoMetatext}>{video.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {video.matched_chapter && (
        <View style={styles.chapterNote}>
          <FontAwesome name="play" size={11} color={Colors.redDark} style={styles.chapterNoteIcon} />
          <Text style={styles.chapterNoteText}>
            Abordé à <Text style={styles.chapterNoteTime}>{formatAiChapterTime(video.matched_chapter.seconds)}</Text>
            {' : '}{video.matched_chapter.label}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderOption = (option: AiSearchOption, disabled: boolean) => (
    <Pressable
      key={option.id}
      disabled={disabled}
      onPress={() => chooseOption(option)}
      style={({ hovered }: any) => [
        styles.optionPill,
        // Le compteur a son propre fond arrondi : il remplace la marge droite.
        option.count !== null && styles.optionPillWithCount,
        hovered && !disabled && styles.optionPillHovered,
        disabled && styles.pillDisabled,
      ]}
    >
      <Text style={styles.optionText}>{option.label}</Text>
      {option.count !== null && (
        <View style={styles.optionCount}>
          <Text style={styles.optionCountText}>{option.count}</Text>
        </View>
      )}
    </Pressable>
  );

  const renderAssistant = (item: Extract<AiChatItem, { role: 'assistant' }>) => {
    const disabled = item.kind === 'question' && (item.answered || isLoading);

    return (
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
              {item.options.map((option) => renderOption(option, disabled))}

              {item.total !== null && item.total > 0 && (
                <Pressable
                  disabled={disabled}
                  onPress={() => showResults(item.total as number)}
                  style={({ hovered }: any) => [
                    styles.showPill,
                    hovered && !disabled && styles.showPillHovered,
                    disabled && styles.pillDisabled,
                  ]}
                >
                  <Ionicons name="play" size={12} color={Colors.white} />
                  <Text style={styles.showPillText}>Voir les {item.total} vidéos</Text>
                </Pressable>
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
  };

  const renderItem = (item: AiChatItem) => (
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
        <Ionicons name="sparkles" size={32} color={Colors.white} />
      </View>
      <Text style={styles.welcomeTitle}>Assistant Médias</Text>
      <Text style={styles.welcomeText}>
        Décrivez un sujet, une pathologie, un intervenant ou un congrès. Je vous aide à affiner si besoin.
      </Text>
    </View>
  );

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <View style={styles.container}>
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
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
      <View style={styles.inputBar}>
        {isClosed
          ? (
            <TouchableOpacity style={styles.closedButton} activeOpacity={0.7} onPress={onBack}>
              <Ionicons name="search-outline" size={18} color={Colors.white} />
              <Text style={styles.closedButtonText}>Retour à la recherche</Text>
            </TouchableOpacity>
          )
          : (
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { height: inputHeight }]}
                placeholder="Posez votre question…  (Maj + Entrée pour aller à la ligne)"
                placeholderTextColor={Colors.gray}
                value={input}
                onChangeText={setInput}
                onKeyPress={handleKeyPress}
                onContentSizeChange={(e) => {
                  const height = e.nativeEvent.contentSize.height;
                  setInputHeight(Math.min(INPUT_MAX_HEIGHT, Math.max(INPUT_MIN_HEIGHT, height)));
                }}
                multiline
                maxLength={AI_SEARCH_MAX_MESSAGE_LENGTH}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                disabled={!canSend}
                activeOpacity={0.7}
                onPress={submit}
              >
                <Ionicons name="arrow-up" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )
        }
      </View>

      {/* Bouton retour fixe, au-dessus de la liste qui défile dessous */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  backButton: {
    position: 'absolute',
    top: Spacings.lg,
    left: Spacings.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: Colors.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 10,
  },

  /* ---- Liste des messages ---- */
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacings.xl,
    paddingTop: BACK_BUTTON_SPACE,
    paddingBottom: Spacings.lg,
    gap: Spacings.md,
  },

  /* ---- Accueil ---- */
  welcome: {
    alignItems: 'center',
    paddingTop: Spacings.xxl,
    paddingHorizontal: Spacings.xxl,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    marginBottom: Spacings.md,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 480,
  },

  /* ---- Bulles ---- */
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '75%',
    backgroundColor: Colors.red,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.white,
    lineHeight: 23,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    maxWidth: '90%',
    backgroundColor: Colors.white,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    borderTopLeftRadius: 4,
  },
  assistantText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.text,
    lineHeight: 23,
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
    paddingVertical: 7,
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
  },
  optionPillWithCount: {
    paddingRight: Spacings.xs,
  },
  optionPillHovered: {
    backgroundColor: Colors.red3,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.redDark,
  },
  optionCount: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: Colors.red3,
    alignItems: 'center',
  },
  optionCountText: {
    fontSize: 12,
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
  },
  showPillHovered: {
    backgroundColor: Colors.redDark,
    borderColor: Colors.redDark,
  },
  showPillText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  // Une pastille désactivée ne doit plus sembler cliquable : on retire aussi l'ombre.
  pillDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    cursor: 'default' as any,
  },

  /* ---- Vidéos ---- */
  videoList: {
    gap: Spacings.md,
  },
  videoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacings.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    transitionDuration: '150ms' as any,
  },
  videoCardHovered: {
    shadowOpacity: 0.22,
    shadowRadius: 14,
    transform: [{ translateY: -1 }],
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
  },
  // Même taille que l'aperçu d'un média (100 px de haut) : le panneau web est assez large.
  videoImage: {
    width: 100 * 16 / 9,
    height: 100,
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
    marginTop: Spacings.xs,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  videoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  videoMetadata: {
    marginTop: Spacings.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  videoMetatext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
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
    marginTop: 5,
  },
  chapterNoteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    color: Colors.subtext,
    lineHeight: 20,
  },
  chapterNoteTime: {
    fontFamily: 'Poppins-Medium',
    fontStyle: 'normal',
    color: Colors.redDark,
  },
  resultsFootnote: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    paddingHorizontal: Spacings.xs,
  },

  /* ---- Saisie ---- */
  inputBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacings.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacings.md,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: Colors.grayLight,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    outlineStyle: 'none' as any,
    resize: 'none' as any,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});