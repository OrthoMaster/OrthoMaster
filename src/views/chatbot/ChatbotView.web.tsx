import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { Portal, Dialog, Button, ActivityIndicator } from "react-native-paper";
import { Feather } from '@expo/vector-icons';

import {
  currentSubscription,
  askNotebook,
  parseQuizFromAnswer,
  type QuizData,
  type QuizQuestion,
} from "../../services/v2/ChatbotService";

import Colors from '../../../constants/Colors';
import { Styles } from '../../../constants/Styles';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "bot";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  quizData?: QuizData | null;
}

// ─── Markdown parser (web-only, no extra dependency) ─────────────────────────

function parseMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (/^### (.+)/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h3 style="font-weight:600;font-size:0.95rem;color:#0f172a;margin:0.7em 0 0.25em;font-family:Poppins-Bold,sans-serif">${line.slice(4)}</h3>`);
      continue;
    }
    if (/^## (.+)/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h2 style="font-weight:600;font-size:1.05rem;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:0.8em 0 0.3em;font-family:Poppins-Bold,sans-serif">${line.slice(3)}</h2>`);
      continue;
    }
    if (/^[*-] (.+)/.test(line)) {
      if (!inList) { out.push("<ul style=\"padding-left:1.4em;margin:0.4em 0\">"); inList = true; }
      out.push(`<li style="margin:0.2em 0">${inline(line.slice(2))}</li>`);
      continue;
    }
    if (inList && line.trim() !== "") { out.push("</ul>"); inList = false; }
    if (line.trim() === "") {
      out.push("<br/>");
      continue;
    }
    out.push(`<p style="margin:0.3em 0;line-height:1.7">${inline(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;font-weight:600;font-family:Poppins-Bold,sans-serif">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="font-family:monospace;background:#f1f5f9;border-radius:4px;padding:1px 5px;font-size:0.82em;color:#0369a1">$1</code>');
}

// ─── WebMarkdown ──────────────────────────────────────────────────────────────

function WebMarkdown({ text }: { text: string }) {
  const html = useMemo(() => parseMarkdown(text), [text]);

  return (
    // @ts-ignore
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: "#1e293b",
        fontFamily: "Poppins-Regular, sans-serif",
      }}
    />
  );
}

// ─── QuizBlock ────────────────────────────────────────────────────────────────

const QUIZ_FONT = "Poppins-Regular, sans-serif";
const QUIZ_FONT_BOLD = "Poppins-Bold, sans-serif";
const QUIZ_FONT_MEDIUM = "Poppins-Medium, sans-serif";

function QuizBlock({ quiz }: { quiz: QuizData }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Always allow re-selection — no lock after first pick
  const handleAnswer = (qIdx: number, oIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  return (
    // @ts-ignore
    <div
      style={{
        marginTop: 20,
        padding: 20,
        background: "#f8f7ff",
        borderRadius: 16,
        border: "1px solid #e0e7ff",
        fontFamily: QUIZ_FONT,
      }}
    >
      {/* Header */}
      {/* @ts-ignore */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {/* @ts-ignore */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: QUIZ_FONT_BOLD,
            color: Colors.purpleDark,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >Vérification des connaissances</span>
      </div>

      {quiz.questions.map((q: QuizQuestion, qIdx: number) => {
        const selected = answers[qIdx];
        const answered = selected !== undefined;
        const isCorrect = selected === q.correct_index;

        return (
          // @ts-ignore
          <div key={qIdx} style={{ marginBottom: 20 }}>
            {/* @ts-ignore */}
            <p
              style={{
                fontWeight: 600,
                fontFamily: QUIZ_FONT_MEDIUM,
                fontSize: 14,
                color: "#1e293b",
                marginBottom: 10,
              }}
            >
              {qIdx + 1}. {q.question}
            </p>

            {q.options.map((opt: string, oIdx: number) => {
              const isSelected = selected === oIdx;
              const isRight = oIdx === q.correct_index;

              let border = "2px solid #e2e8f0";
              let bg = "#fff";
              let color = "#1e293b";
              let badgeBg = "transparent";
              let badgeBorder = "2px solid #e2e8f0";
              let badgeColor = "#94a3b8";
              let badgeText = String.fromCharCode(65 + oIdx);

              if (answered) {
                if (isRight) {
                  border = "2px solid #10b981"; bg = "#ecfdf5"; color = "#065f46";
                  badgeBg = "#10b981"; badgeBorder = "2px solid #10b981";
                  badgeColor = "#fff"; badgeText = "✓";
                } else if (isSelected) {
                  border = "2px solid #f43f5e"; bg = "#fff1f2"; color = "#9f1239";
                  badgeBg = "#f43f5e"; badgeBorder = "2px solid #f43f5e";
                  badgeColor = "#fff"; badgeText = "✗";
                }
              }

              return (
                // @ts-ignore
                <button
                  key={oIdx}
                  onClick={() => handleAnswer(qIdx, oIdx)}
                  style={{
                    width: "100%", textAlign: "left",
                    fontSize: 14, fontFamily: QUIZ_FONT,
                    padding: "10px 14px", border, borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 10,
                    background: bg, cursor: "pointer",
                    marginBottom: 8, color,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {/* Badge */}
                  {/* @ts-ignore */}
                  <span
                    style={{
                      width: 24, height: 24, minWidth: 24, borderRadius: "50%",
                      border: badgeBorder, background: badgeBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, fontFamily: QUIZ_FONT_BOLD, color: badgeColor,
                    }}
                  >
                    {badgeText}
                  </span>

                  {/* @ts-ignore */}
                  <span style={{ flex: 1, fontFamily: QUIZ_FONT }}>{opt}</span>
                </button>
              );
            })}

            {/* Feedback */}
            {answered && (
              // @ts-ignore
              <div
                style={{
                  marginTop: 10, padding: "10px 12px",
                  background: isCorrect ? "#ecfdf5" : "#fff1f2",
                  borderRadius: 10,
                  border: `1px solid ${isCorrect ? "#6ee7b7" : "#fda4af"}`,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}
              >
                {/* @ts-ignore */}
                <div>
                  {/* @ts-ignore */}
                  <strong
                    style={{
                      color: isCorrect ? "#065f46" : "#9f1239",
                      fontSize: 13, fontFamily: QUIZ_FONT_BOLD,
                    }}
                  >
                    {isCorrect ? "Correct!" : "Incorrect."}
                  </strong>
                  {q.explanation && (
                    // @ts-ignore
                    <p style={{ color: "#374151", margin: "3px 0 0", fontSize: 12, fontFamily: QUIZ_FONT }}>
                      {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SubscriptionBadge ────────────────────────────────────────────────────────

interface SubscriptionBadgeProps {
  tier?: string;
  onUpgrade: () => void;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ tier, onUpgrade }) => {
  const [hovered, setHovered] = useState(false);

  const tierConfig: Record<
    string,
    { color: string; bg: string; border: string; showUpgrade: boolean }
  > = {
    Free: { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "#cbd5e1", showUpgrade: true },
    Pro: { color: "#0284c7", bg: "rgba(2,132,199,0.08)", border: "#bae6fd", showUpgrade: true },
    Expert: { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "#ddd6fe", showUpgrade: false },
  };

  const cfg = (tier && tierConfig[tier]) ?? tierConfig["Free"];
  const displayTier = tier ?? "—";

  return (
    <Pressable
      onPress={onUpgrade}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.subscriptionBadge,
        { backgroundColor: hovered ? cfg.bg : "transparent", borderColor: cfg.border },
      ]}
    >
      <View style={[styles.tierDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.tierLabel, { color: cfg.color }]}>{displayTier}</Text>
      {cfg.showUpgrade && (
        <>
          <View style={styles.badgeDivider} />
          <Text style={styles.upgradeText}>Upgrade</Text>
          <Text style={styles.upgradeArrow}>↗</Text>
        </>
      )}
    </Pressable>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC<{ visible: boolean }> = ({ visible }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -5, duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(700 - delay),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 160);
    const a3 = bounce(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: anim }] }]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── User bubble ────────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <View style={styles.userWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
        {/* Timestamp outside, below the bubble, aligned right */}
        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
      </View>
    );
  }

  // ── AI bubble ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.aiRow}>
      <View style={styles.aiMessageContent}>
        {/* Name only — no avatar icon */}
        <Text style={styles.aiSenderName}>OrthoMaster IA</Text>
        {message.content.length > 0 &&
          <WebMarkdown text={message.content} />
        }
        {message.quizData && <QuizBlock quiz={message.quizData} />}
        <Text style={styles.messageTimeAi}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: "🦴", text: "Protocole post-opératoire fracture de cheville" },
  { icon: "🏃", text: "Exercices de rééducation après entorse" },
  { icon: "📋", text: "Critères de reprise sportive" },
  { icon: "📚", text: "Créez un quiz avec 3 questions sur les chevilles." },
];

const EmptyState: React.FC<{ onSuggestion: (text: string) => void }> = ({ onSuggestion }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>Comment puis-je vous aider ?</Text>
    <Text style={styles.emptySubtitle}>
      Posez vos questions sur la cheville, les fractures, ou les protocoles de rééducation.
    </Text>
    <View style={styles.suggestionGrid}>
      {SUGGESTIONS.map((s, i) => (
        <TouchableOpacity key={i} style={styles.suggestionCard} onPress={() => onSuggestion(s.text)} activeOpacity={0.75}>
          <Text style={styles.suggestionIcon}>{s.icon}</Text>
          <Text style={styles.suggestionText}>{s.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_INPUT_HEIGHT = 26;
const MAX_INPUT_HEIGHT = 180;
const LINE_HEIGHT = 22;

// ─── Main Component ───────────────────────────────────────────────────────────

export const ChatbotView = ({ navigation, route }: any) => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await currentSubscription();
        if (!data) throw new Error("No subscription data");
        setSubscription(data);
      } catch (e) {
        setSubscriptionError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      setInputHeight(
        Math.min(Math.max(e.nativeEvent.contentSize.height, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT)
      );
    },
    []
  );

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setInputHeight(MIN_INPUT_HEIGHT);
    setIsTyping(true);

    try {
      const data = await askNotebook(content, sessionId);

      if (data.session_id) setSessionId(data.session_id);

      const rawAnswer =
        data.status === "skipped"
          ? `${data.message} [${data.reasons}]`
          : data.answer;

      const { cleanAnswer, quizData } = parseQuizFromAnswer(rawAnswer);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "bot",
          content: cleanAnswer,
          timestamp: new Date(),
          quizData,
        },
      ]);
    } catch (err) {
      console.error("[ChatbotView] API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "bot",
          content: "❌ **System Error:** Unable to reach AI Core. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, sessionId]);

  const handleKeyDown = useCallback(
    (e: any) => {
      if (e.nativeEvent?.key === "Enter" && !e.nativeEvent?.shiftKey) {
        e.preventDefault?.();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = inputText.trim().length > 0 && !isTyping;

  return (
    <View style={styles.root}>
      {/* ── Loading Portal ───────────────────────────────────────────────── */}
      <Portal>
        <Dialog visible={isLoading} dismissable={false} style={Styles.dialogWeb}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.success }]}>Initialisation de votre espace</Dialog.Title>
          <Dialog.Content>
            <ActivityIndicator animating color={Colors.gray} size="large" />
            <Text style={Styles.dialogWebContent}>Chargement en cours…</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* ── Error Portal ─────────────────────────────────────────────────── */}
      <Portal>
        <Dialog visible={!isLoading && subscriptionError} dismissable={false} style={Styles.dialogWeb}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.danger }]}>Accès impossible</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Impossible de charger votre abonnement ou votre abonnement a expiré.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => navigation.goBack()}
              textColor={Colors.danger}
              labelStyle={{ fontFamily: FONT.bold }}
            >
              Retour
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>


      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => { navigation.goBack() }}
          >
            <Feather name="arrow-left" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.brandName}>OrthoMaster IA</Text>
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.contextChip}>
            <View style={styles.contextDot} />
            <Text style={styles.contextLabel}>Domaine Cheville</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <SubscriptionBadge tier={subscription?.plan.name} onUpgrade={() => { }} />
        </View>
      </View>
      <View style={styles.headerBorder} />

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(t) => handleSend(t)} />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <TypingIndicator visible={isTyping} />
            </>
          )}
        </ScrollView>

        {/* ── Input bar ───────────────────────────────────────────────── */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { height: inputHeight }]}
              placeholder="Posez votre question clinique …"
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleKeyDown}
              onContentSizeChange={handleContentSizeChange}
              multiline
              maxLength={4000}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!canSend}
              style={[
                styles.sendButton,
                canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.sendIcon, !canSend && styles.sendIconDisabled]}>↑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>
            OrthoMaster IA est une IA construite à partir de contenus internes élaborés par des experts du domaine.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Color Palette ────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderFocus: "#bfdbfe",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  accent: "#FF9600",
  accentLight: "#eff6ff",
  userBubble: "#ffaf32",
  userText: "#ffffff",
  aiText: "#1e293b",
  codeBg: "#f1f5f9",
  codeText: "#0369a1",
  headerBg: "rgba(248,250,252,0.95)",
};

const FONT = {
  regular: "Poppins-Regular" as any,
  medium: "Poppins-Medium" as any,
  bold: "Poppins-Bold" as any,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: COLORS.bg,
    display: "flex" as any, flexDirection: "column", height: "100%" as any,
  },
  flex: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 28, paddingVertical: 15, backgroundColor: COLORS.headerBg,
    height: 110,
    // @ts-ignore
    backdropFilter: "blur(16px)", zIndex: 100,

  },
  headerBorder: { height: 1, backgroundColor: COLORS.border },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  brandName: { color: COLORS.accent, fontSize: 26, fontFamily: FONT.bold, marginLeft: 5 },
  headerCenter: { flex: 1, alignItems: "center" },
  contextChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
    // @ts-ignore
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  },
  contextDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: "#16a34a",
    // @ts-ignore
    boxShadow: "0 0 5px rgba(22,163,74,0.5)",
  },
  contextLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.medium },
  headerRight: { flex: 1, alignItems: "flex-end" },

  // ── Subscription Badge ───────────────────────────────────────────────────────
  subscriptionBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    // @ts-ignore
    cursor: "pointer",
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierLabel: { fontSize: 11, fontWeight: "700" as any, fontFamily: FONT.bold, letterSpacing: 1, textTransform: "uppercase" as any },
  badgeDivider: { width: 1, height: 11, backgroundColor: "#e2e8f0", marginHorizontal: 2 },
  upgradeText: { color: "#d97706", fontSize: 11, fontWeight: "700" as any, fontFamily: FONT.bold, letterSpacing: 0.3 },
  upgradeArrow: { color: "#d97706", fontSize: 11, fontWeight: "700" as any },

  // ── Messages ─────────────────────────────────────────────────────────────────
  messagesScroll: { flex: 1 },
  messagesContent: {
    paddingBottom: 24, paddingTop: 16,
    maxWidth: 820, width: "100%" as any,
    alignSelf: "center" as any, paddingLeft: 28, paddingRight: 28,
  },
  messagesContentEmpty: {
    flex: 1, justifyContent: "center",
    alignItems: "center" as any, minHeight: "100%" as any,
  },

  // ── User bubble ──────────────────────────────────────────────────────────────
  userWrapper: {
    alignItems: "flex-end",   // bubble + timestamp both hug the right edge
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    maxWidth: "72%" as any,
    // @ts-ignore
    boxShadow: "0 2px 8px rgba(37,99,235,0.20)",
  },
  userText: { color: COLORS.userText, fontSize: 14, lineHeight: LINE_HEIGHT, fontFamily: FONT.regular },
  // Timestamp rendered outside the bubble, below it, right-aligned
  messageTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, fontFamily: FONT.regular },

  // ── AI message ───────────────────────────────────────────────────────────────
  aiRow: { flexDirection: "row", alignItems: "flex-start", marginVertical: 10 },
  aiMessageContent: { flex: 1, paddingRight: 12 },
  // Name only — avatar removed
  aiSenderName: {
    color: COLORS.accent, fontSize: 12,
    fontWeight: "700" as any, fontFamily: FONT.medium,
    marginBottom: 5, letterSpacing: 0.3,
  },
  messageTimeAi: { color: COLORS.textMuted, fontSize: 10, marginTop: 6, fontFamily: FONT.regular },

  // ── Typing Indicator ─────────────────────────────────────────────────────────
  typingRow: { flexDirection: "row", alignItems: "flex-start", marginVertical: 10 },
  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: COLORS.border,
    // @ts-ignore
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },

  // ── Empty State ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center", paddingVertical: 48,
    paddingHorizontal: 24, width: "100%" as any, maxWidth: 600,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONT.bold, marginBottom: 10, textAlign: "center" as any, letterSpacing: -0.2 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: 16, textAlign: "center" as any, lineHeight: 21, fontFamily: FONT.regular, maxWidth: 400, marginBottom: 36 },
  suggestionGrid: { flexDirection: "row", flexWrap: "wrap" as any, gap: 10, justifyContent: "center", width: "100%" as any },
  suggestionCard: {
    flexDirection: "row", alignItems: "center", gap: 9,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    // @ts-ignore
    cursor: "pointer", boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
    maxWidth: 260, flex: 1, minWidth: 200,
  },
  suggestionIcon: { fontSize: 17 },
  suggestionText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'Poppins-Regular', flex: 1 },

  // ── Input area ────────────────────────────────────────────────────────────────
  inputArea: {
    paddingHorizontal: 28, paddingTop: 10, paddingBottom: 16,
    backgroundColor: COLORS.bg, maxWidth: 820, width: "100%" as any,
    alignSelf: "center" as any,
    // @ts-ignore
    boxSizing: "border-box",
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 18, paddingVertical: 10, gap: 10,
    // @ts-ignore
    boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
  },
  textInput: {
    flex: 1, color: COLORS.textPrimary, fontSize: 14,
    lineHeight: LINE_HEIGHT, fontFamily: FONT.regular,
    // @ts-ignore
    outlineStyle: "none",
    minHeight: MIN_INPUT_HEIGHT, maxHeight: MAX_INPUT_HEIGHT,
    paddingTop: 2, paddingBottom: 2, backgroundColor: "transparent",
  },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 1 },
  sendButtonActive: { backgroundColor: COLORS.accent, /* @ts-ignore */ boxShadow: "0 2px 10px rgba(37,99,235,0.35)" },
  sendButtonDisabled: { backgroundColor: "#e2e8f0" },
  sendIcon: { color: "#fff", fontSize: 16, fontWeight: "700" as any, lineHeight: 20 },
  sendIconDisabled: { color: COLORS.textMuted },
  disclaimer: { color: COLORS.textMuted, fontSize: 12, textAlign: "center" as any, marginTop: 12, fontFamily: FONT.regular, lineHeight: 16 },
});