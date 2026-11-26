import React, { forwardRef, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { SCAT, FONTS } from '../scat6Theme';

/**
 * Briques d'interface de l'espace SCAT6 (version web d'abord) : en-tête bleu Outils, cartes,
 * boutons 3D à tranche (comme les cartes Outils), pastilles de choix, encadrés.
 */

type IconName = keyof typeof Ionicons.glyphMap;

/* ---- En-tête ---- */

interface HeaderProps {
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  /** Sous l'en-tête, dans la bande bleue (onglets, recherche…). */
  children?: React.ReactNode;
}

/** Bande bleue de 100 px (comme les pages larges du profil), titre blanc à gauche. */
export const Scat6Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, backLabel = 'Retour', right, children }) => (
  <View style={styles.header}>
    <View style={styles.headerRow}>
      {onBack && (
        <Pressable style={styles.headerBack} onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel}>
          <Ionicons name="arrow-back" size={20} color={SCAT.card} />
        </Pressable>
      )}
      <View style={styles.headerTitles}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
    {children}
  </View>
);

/* ---- Boutons ---- */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'light';

const BUTTON_COLORS: Record<ButtonVariant, { face: string; edge: string; text: string; border?: string }> = {
  primary: { face: SCAT.blue, edge: SCAT.blueDark, text: SCAT.card },
  secondary: { face: SCAT.card, edge: SCAT.blueLine, text: SCAT.blueDark, border: SCAT.blueLine },
  danger: { face: SCAT.danger, edge: SCAT.dangerDark, text: SCAT.card },
  // Sur la bande bleue de l'en-tête.
  light: { face: SCAT.card, edge: '#D5E3F5', text: SCAT.blueDark },
};

const PRESS_DEPTH = 4;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Bouton compact (en-têtes, lignes de liste). */
  small?: boolean;
  /** Libellé lu quand le bouton n'a qu'une icône (title vide). */
  accessibilityLabel?: string;
}

/** Bouton 3D : la face s'enfonce dans sa tranche quand on appuie. */
export const Scat6Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
  accessibilityLabel,
}) => {
  const press = useRef(new Animated.Value(0)).current;
  const c = BUTTON_COLORS[variant];
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });
  const animate = (toValue: number) => Animated.timing(press, { toValue, duration: 80, useNativeDriver: false }).start();
  const inactive = disabled || loading;

  return (
    <Pressable
      style={[styles.buttonWrap, inactive && styles.buttonDisabled, style]}
      onPress={onPress}
      onPressIn={() => !inactive && animate(1)}
      onPressOut={() => animate(0)}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive }}
    >
      <View style={[styles.buttonEdge, { backgroundColor: c.edge }]}>
        <Animated.View
          style={[
            styles.buttonFace,
            small && styles.buttonFaceSmall,
            { backgroundColor: c.face, transform: [{ translateY }] },
            c.border ? { borderWidth: 1.5, borderColor: c.border } : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={c.text} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={c.text} /> : null}
              {title ? (
                <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: c.text }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
            </>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
};

/** Lien discret (actions secondaires : « Partie non réalisée… », « Effacer »). */
export const Scat6Link: React.FC<{ title: string; onPress: () => void; icon?: IconName; danger?: boolean }> = ({
  title,
  onPress,
  icon,
  danger,
}) => (
  <Pressable style={styles.link} onPress={onPress} accessibilityRole="button" hitSlop={6}>
    {icon ? <Ionicons name={icon} size={16} color={danger ? SCAT.danger : SCAT.blueDark} /> : null}
    <Text style={[styles.linkText, danger && { color: SCAT.danger }]}>{title}</Text>
  </Pressable>
);

/* ---- Choix ---- */

interface ChoiceProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Couleur de la pastille choisie (bleu par défaut). */
  tone?: 'blue' | 'danger' | 'success' | 'warning' | 'violet';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  /** Case à cocher (choix multiples) plutôt que bouton radio. */
  checkbox?: boolean;
}

const TONES = {
  blue: { bg: SCAT.blue, line: SCAT.blueDark },
  danger: { bg: SCAT.danger, line: SCAT.dangerDark },
  success: { bg: SCAT.success, line: '#1F6B41' },
  warning: { bg: '#E59A12', line: SCAT.warning },
  violet: { bg: SCAT.violet, line: SCAT.violetDark },
};

/** Contour et texte d'une pastille libre : teintés de sa couleur (Oui / Non se distinguent avant le choix). */
const IDLE_TINT: Partial<Record<keyof typeof TONES, { line: string; text: string }>> = {
  violet: { line: '#D3CBE8', text: SCAT.violetDark },
  success: { line: '#B9DEC8', text: '#1F6B41' },
  danger: { line: '#F4C2C0', text: SCAT.dangerDark },
};

/** Pastille de choix (bo 999) : contour quand libre, pleine quand choisie. */
export const Scat6Choice: React.FC<ChoiceProps> = ({ label, selected, onPress, tone = 'blue', icon, style, checkbox }) => {
  const t = TONES[tone];
  const idle = IDLE_TINT[tone];
  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.choice,
        !selected && idle ? { borderColor: idle.line } : null,
        selected ? { backgroundColor: t.bg, borderColor: t.line } : hovered && styles.choiceHover,
        style,
      ]}
      onPress={onPress}
      accessibilityRole={checkbox ? 'checkbox' : 'radio'}
      accessibilityState={checkbox ? { checked: selected } : { selected }}
      accessibilityLabel={label}
    >
      {checkbox ? (
        <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={18} color={selected ? SCAT.card : SCAT.faint} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={selected ? SCAT.card : SCAT.blueDark} />
      ) : null}
      <Text style={[styles.choiceText, !selected && idle ? { color: idle.text } : null, selected && styles.choiceTextSelected]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
};

/* ---- Carte, titres ---- */

export const Scat6Card = forwardRef<View, { children: React.ReactNode; style?: StyleProp<ViewStyle>; highlight?: boolean }>(
  ({ children, style, highlight }, ref) => (
    <View ref={ref} style={[styles.card, highlight && styles.cardMissing, style]}>
      {children}
    </View>
  )
);

export const Scat6SectionTitle: React.FC<{ title: string; right?: React.ReactNode; hint?: string | null }> = ({
  title,
  right,
  hint,
}) => (
  <View style={styles.sectionTitleRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
    {right}
  </View>
);

/* ---- Encadrés ---- */

type NoticeTone = 'info' | 'warning' | 'danger' | 'success';

const NOTICE: Record<NoticeTone, { bg: string; line: string; text: string; icon: IconName }> = {
  info: { bg: SCAT.blueSoft, line: SCAT.blue, text: SCAT.blueInk, icon: 'information-circle' },
  warning: { bg: SCAT.warningSoft, line: SCAT.warningLine, text: '#6B4300', icon: 'alert-circle' },
  danger: { bg: SCAT.dangerSoft, line: SCAT.danger, text: SCAT.dangerDark, icon: 'warning' },
  success: { bg: SCAT.successSoft, line: SCAT.success, text: '#1F5E3A', icon: 'checkmark-circle' },
};

export const Scat6Notice: React.FC<{ tone?: NoticeTone; children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  tone = 'info',
  children,
  style,
}) => {
  const n = NOTICE[tone];
  return (
    <View style={[styles.notice, { backgroundColor: n.bg, borderLeftColor: n.line }, style]}>
      <Ionicons name={n.icon} size={18} color={n.line} style={styles.noticeIcon} />
      <Text style={[styles.noticeText, { color: n.text }]}>{children}</Text>
    </View>
  );
};

/** « Consigne à lire au patient » : texte officiel, lu tel quel. */
export const Scat6Instruction: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.instruction}>
    <View style={styles.instructionHead}>
      <Ionicons name="chatbubble-ellipses-outline" size={16} color={SCAT.blueDark} />
      <Text style={styles.instructionLabel}>Consigne à lire au patient</Text>
    </View>
    <Text style={styles.instructionText}>« {text} »</Text>
  </View>
);

/* ---- Pastilles d'état ---- */

export const Scat6Badge: React.FC<{ label: string; tone?: NoticeTone | 'neutral' | 'draft'; icon?: IconName }> = ({
  label,
  tone = 'neutral',
  icon,
}) => {
  const palette = {
    neutral: { bg: SCAT.blueSoft, text: SCAT.blueDark },
    info: { bg: SCAT.blueSoft, text: SCAT.blueDark },
    warning: { bg: SCAT.warningSoft, text: SCAT.warning },
    danger: { bg: SCAT.dangerSoft, text: SCAT.dangerDark },
    success: { bg: SCAT.successSoft, text: SCAT.success },
    draft: { bg: SCAT.draftSoft, text: '#A85A00' },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons name={icon} size={13} color={palette.text} /> : null}
      <Text style={[styles.badgeText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

/* ---- Champ de saisie ---- */

export const Scat6Field: React.FC<TextInputProps & { label: string; hint?: string; error?: string | null }> = ({
  label,
  hint,
  error,
  style,
  multiline,
  ...props
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={SCAT.faint}
      style={[styles.input, multiline && styles.inputMultiline, error ? styles.inputError : null, style]}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
  </View>
);

/* ---- Oui / Non ---- */

interface YesNoProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  /** Réponse attendue rappelée à l'examinateur (orientation). */
  hint?: string | null;
  missing?: boolean;
  /** Oui = bonne réponse (vert) plutôt qu'antécédent présent (bleu). */
  positive?: 'yes' | 'none';
}

export const Scat6YesNo = forwardRef<View, YesNoProps>(
  ({ label, value, onChange, yesLabel = 'Oui', noLabel = 'Non', hint, missing, positive = 'none' }, ref) => (
    <View ref={ref} style={[styles.yesNo, missing && styles.rowMissing]}>
      <View style={styles.yesNoText}>
        <Text style={styles.yesNoLabel}>{label}</Text>
        {hint ? <Text style={styles.yesNoHint}>{hint}</Text> : null}
      </View>
      <View style={styles.yesNoButtons}>
        <Scat6Choice
          label={yesLabel}
          selected={value === true}
          tone={positive === 'yes' ? 'success' : 'blue'}
          onPress={() => onChange(true)}
          style={styles.yesNoChoice}
        />
        <Scat6Choice
          label={noLabel}
          selected={value === false}
          tone={positive === 'yes' ? 'danger' : 'violet'}
          onPress={() => onChange(false)}
          style={styles.yesNoChoice}
        />
      </View>
    </View>
  )
);

/* ---- États de page ---- */

export const Scat6Loading: React.FC = () => (
  <View style={styles.state}>
    <ActivityIndicator size="large" color={SCAT.blue} />
  </View>
);

export const Scat6Empty: React.FC<{
  icon: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ icon, title, message, action }) => (
  <View style={styles.state}>
    <View style={styles.stateIcon}>
      <Ionicons name={icon} size={40} color={SCAT.blue} />
    </View>
    <Text style={styles.stateTitle}>{title}</Text>
    {message ? <Text style={styles.stateMessage}>{message}</Text> : null}
    {action ? <View style={{ marginTop: Spacings.md }}>{action}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  /* ---- En-tête ---- */
  header: {
    backgroundColor: SCAT.blue,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    minHeight: 100,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: SCAT.card,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },

  /* ---- Boutons ---- */
  // Pas de minWidth: 0 : un bouton ne rétrécit jamais sous la largeur de son libellé.
  buttonWrap: {},
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonEdge: {
    borderRadius: 14,
    paddingBottom: PRESS_DEPTH,
  },
  buttonFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: Spacings.lg,
    minHeight: 48,
  },
  buttonFaceSmall: {
    paddingVertical: 7,
    paddingHorizontal: Spacings.md,
    minHeight: 38,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  buttonTextSmall: {
    fontSize: 14,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.blueDark,
  },

  /* ---- Choix ---- */
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacings.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: SCAT.blueLine,
    backgroundColor: SCAT.card,
  },
  choiceHover: {
    backgroundColor: SCAT.blueSoft,
  },
  choiceText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.blueInk,
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: SCAT.card,
  },

  /* ---- Carte ---- */
  card: {
    backgroundColor: SCAT.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCAT.line,
    padding: Spacings.lg,
    gap: Spacings.md,
  },
  // Partie à compléter avant « Suivant » : même orange que les brouillons.
  cardMissing: {
    borderColor: SCAT.draft,
    borderWidth: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: SCAT.blueInk,
  },
  sectionHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.muted,
  },

  /* ---- Encadrés ---- */
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: Spacings.sm,
  },
  noticeIcon: {
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  instruction: {
    backgroundColor: '#F7FAFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SCAT.blueLine,
    borderStyle: 'dashed',
    padding: Spacings.md,
    gap: 6,
  },
  instructionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: SCAT.blueDark,
  },
  instructionText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    color: SCAT.text,
  },

  /* ---- Pastilles ---- */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },

  /* ---- Champ ---- */
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: SCAT.text,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.text,
    backgroundColor: SCAT.card,
    borderWidth: 1.5,
    borderColor: SCAT.line,
    borderRadius: 12,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 10,
    outlineColor: SCAT.blue,
  } as any,
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: SCAT.danger,
  },
  fieldHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SCAT.muted,
  },
  fieldError: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: SCAT.danger,
  },

  /* ---- Oui / Non ---- */
  yesNo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowMissing: {
    borderColor: SCAT.draft,
    backgroundColor: SCAT.draftSoft,
  },
  yesNoText: {
    flex: 1,
    gap: 2,
  },
  yesNoLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: SCAT.text,
  },
  yesNoHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SCAT.blueDark,
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  yesNoChoice: {
    minWidth: 104,
  },

  /* ---- États ---- */
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.xl,
    gap: Spacings.xs,
  },
  stateIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: SCAT.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.sm,
  },
  stateTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: SCAT.blueInk,
    textAlign: 'center',
  },
  stateMessage: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: SCAT.muted,
    textAlign: 'center',
    maxWidth: 460,
  },
});
