import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

import Spacings from '../../../../constants/Spacings';

import { BookingExpert } from '../../../services/v2/BookingService';
import { initials } from '../bookingFormat';
import { withAlpha } from '../bookingPalette';
import { ExpertTheme } from '../expertTheme';
import { SwooshRule } from './SwooshRule';
import { ThemeBackdrop } from './ThemeBackdrop';

const PHOTO_SIZE = 92;
const AVATAR_GAP = 5;
const AVATAR_RING = 1.5;
export const IDENTITY_AVATAR_SIZE = PHOTO_SIZE + (AVATAR_GAP + AVATAR_RING) * 2;
const PADDING = Spacings.lg;
const LEDE_LINES = 3;

/** Prénom sur la première ligne, nom sur la seconde, comme la fiche publique. */
const nameLines = (name: string) => {
  const words = name.trim().split(/\s+/);
  return words.length < 2 ? [name] : [words[0], words.slice(1).join(' ')];
};

interface ExpertIdentityCardProps {
  expert: BookingExpert;
  theme: ExpertTheme;
  /** Largeur extérieure de la carte : sert au filet sous les références. */
  width: number;
  /** Pastille posée sur l'avatar (statut de l'expert). */
  avatarBadge?: React.ReactNode;
  /** Contenu ajouté en bas de la carte (lien de la page vitrine…). */
  children?: React.ReactNode;
}

/**
 * Carte d'identité de l'expert, reprise de sa fiche publique (ExpertProfileView) :
 * fond à halo de sa palette, avatar à double liseré qui dépasse du bord, titre, nom sur
 * deux lignes, références, filet, domaines puis présentation repliable.
 * L'expert voit ainsi son profil comme ses confrères le voient.
 */
export const ExpertIdentityCard: React.FC<ExpertIdentityCardProps> = ({ expert, theme, width, avatarBadge, children }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  return (
    <View style={[styles.wrap, { paddingTop: IDENTITY_AVATAR_SIZE / 2 }]}>
      <View style={[styles.card, { borderColor: theme.line }]}>
        <View style={[StyleSheet.absoluteFill, styles.clip]}>
          <ThemeBackdrop theme={theme} />
        </View>

        {/* Réserve la moitié basse de l'avatar, qui dépasse au-dessus de la carte. */}
        <View style={{ height: IDENTITY_AVATAR_SIZE / 2 + Spacings.sm }} />

        <View style={styles.identity}>
          {expert.honorific ? <Text style={[styles.honorific, { color: theme.primary }]}>{expert.honorific}</Text> : null}
          {nameLines(expert.name).map((line, i) => (
            <Text key={i} style={[styles.name, { color: theme.ink }]}>
              {line}
            </Text>
          ))}
          {expert.credentials ? (
            <Text style={[styles.credentials, { color: theme.ink }]}>{expert.credentials}</Text>
          ) : null}
        </View>

        <SwooshRule color={theme.primary} width={width - PADDING * 2} style={styles.rule} />

        {expert.domains.length > 0 && (
          <View style={styles.domains}>
            {expert.domains.map((domain) => (
              <View
                key={domain.id}
                style={[
                  styles.domainPill,
                  { borderColor: withAlpha(theme.primary, 0.45), backgroundColor: withAlpha(theme.primary, 0.09) },
                ]}
              >
                <Text style={[styles.domainText, { color: theme.primary }]}>{domain.name}</Text>
              </View>
            ))}
          </View>
        )}

        {expert.lede ? (
          <Pressable onPress={() => overflows && setExpanded((e) => !e)} disabled={!overflows} style={styles.ledeBlock}>
            {/* Copie invisible : « Lire la suite » seulement si le texte dépasse réellement. */}
            <Text
              style={[styles.lede, styles.measure]}
              onTextLayout={(e) => setOverflows(e.nativeEvent.lines.length > LEDE_LINES)}
            >
              {expert.lede}
            </Text>
            <Text style={[styles.lede, { color: theme.muted }]} numberOfLines={expanded ? undefined : LEDE_LINES}>
              {expert.lede}
            </Text>
            {overflows && (
              <Text style={[styles.more, { color: theme.primary }]}>{expanded ? 'Réduire' : 'Lire la suite'}</Text>
            )}
          </Pressable>
        ) : null}

        {children ? <View style={styles.footer}>{children}</View> : null}
      </View>

      {/* ---- Avatar à cheval sur le bord haut ---- */}
      <View style={[styles.avatar, { backgroundColor: theme.bg, borderColor: theme.primary }]}>
        <View style={[styles.photo, { backgroundColor: theme.card }]}>
          {expert.avatar_url ? (
            <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={[styles.photoInitials, { color: theme.primary }]}>{initials(expert.name)}</Text>
          )}
        </View>
        {avatarBadge}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingBottom: PADDING,
  },
  clip: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  /* ---- Avatar ---- */
  avatar: {
    position: 'absolute',
    top: 0,
    left: PADDING,
    width: IDENTITY_AVATAR_SIZE,
    height: IDENTITY_AVATAR_SIZE,
    borderRadius: IDENTITY_AVATAR_SIZE / 2,
    borderWidth: AVATAR_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
  },

  /* ---- Identité ---- */
  identity: {
    paddingHorizontal: PADDING,
  },
  honorific: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  // Poppins a de hauts jambages : interligne ≥ 1,25 × la taille.
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    lineHeight: 22,
    marginTop: Spacings.sm,
  },
  rule: {
    marginLeft: PADDING,
    marginTop: Spacings.md,
  },

  /* ---- Domaines ---- */
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
    paddingHorizontal: PADDING,
    marginTop: Spacings.md,
  },
  domainPill: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    lineHeight: 17,
  },

  /* ---- Présentation ---- */
  ledeBlock: {
    paddingHorizontal: PADDING,
  },
  lede: {
    fontFamily: 'Roboto',
    fontSize: 15,
    lineHeight: 23,
    marginTop: Spacings.md,
  },
  measure: {
    position: 'absolute',
    left: PADDING,
    right: PADDING,
    opacity: 0,
  },
  more: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginTop: Spacings.xxs,
  },

  footer: {
    paddingHorizontal: PADDING,
    marginTop: Spacings.md,
  },
});