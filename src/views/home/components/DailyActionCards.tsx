import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { DailyActionGroup, ACTION_THEMES } from './dailyActions';
import { ActionCardShell, CountBadge, StatusMark } from './DailyActionParts';

type Variant = 'large' | 'small' | 'medium' | 'wide';

// Hauteurs choisies pour que la grande carte (2 rangées + l'écart) tombe juste à côté des deux petites.
const SMALL_HEIGHT = 112;
const GAP = Spacings.sm;
const LARGE_HEIGHT = SMALL_HEIGHT * 2 + GAP;
const MEDIUM_HEIGHT = 164;
const WIDE_HEIGHT = 124;

const VARIANTS: Record<Variant, { height: number; titleSize: number; titleLines: number; image: number }> = {
  large: { height: LARGE_HEIGHT, titleSize: 15, titleLines: 3, image: 104 },
  small: { height: SMALL_HEIGHT, titleSize: 13, titleLines: 2, image: 44 },
  medium: { height: MEDIUM_HEIGHT, titleSize: 14, titleLines: 3, image: 62 },
  wide: { height: WIDE_HEIGHT, titleSize: 15, titleLines: 2, image: 96 },
};

const ActionCard = ({ group, variant, onPress }: { group: DailyActionGroup; variant: Variant; onPress: () => void }) => {
  const theme = ACTION_THEMES[group.type];
  const config = VARIANTS[variant];
  const latest = group.items[0];
  const isWide = variant === 'wide';

  return (
    <ActionCardShell
      group={group}
      height={config.height}
      onPress={onPress}
      style={!isWide && styles.flexCard}
      accessibilityLabel={`${theme.label} : ${latest.title}`}
    >
      <View style={[styles.content, isWide && styles.contentWide, variant === 'small' && styles.contentSmall]}>
        <Text style={[styles.label, { color: theme.ink }]}>{theme.label}</Text>
        <Text
          style={[styles.title, { fontSize: config.titleSize, lineHeight: config.titleSize + 6 }, group.allDone && styles.titleDone]}
          numberOfLines={config.titleLines}
          ellipsizeMode="tail"
        >
          {latest.title}
        </Text>
      </View>

      <View style={[styles.badge, variant === 'small' ? styles.badgeSmall : null]}>
        <CountBadge group={group} size={variant === 'small' ? 24 : 26} />
      </View>

      <Image
        source={{ uri: theme.image }}
        resizeMode="contain"
        style={[
          { width: config.image, height: config.image },
          isWide ? styles.imageWide : variant === 'small' ? styles.imageSmall : styles.image,
        ]}
      />

      <StatusMark group={group} style={styles.status} />
    </ActionCardShell>
  );
};

export const DailyActionCards = ({
  groups,
  onOpenGroup,
}: {
  groups: DailyActionGroup[];
  onOpenGroup: (group: DailyActionGroup) => void;
}) => {
  if (groups.length === 0) return null;

  if (groups.length === 1) {
    return <ActionCard group={groups[0]} variant="wide" onPress={() => onOpenGroup(groups[0])} />;
  }

  if (groups.length === 2) {
    return (
      <View style={styles.row}>
        {groups.map((group) => (
          <ActionCard key={group.type} group={group} variant="medium" onPress={() => onOpenGroup(group)} />
        ))}
      </View>
    );
  }

  const [main, ...others] = groups;
  return (
    <View style={styles.row}>
      <ActionCard group={main} variant="large" onPress={() => onOpenGroup(main)} />
      <View style={styles.column}>
        {others.map((group) => (
          <ActionCard key={group.type} group={group} variant="small" onPress={() => onOpenGroup(group)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Grille ---- */
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  column: {
    flex: 1,
    gap: GAP,
  },
  flexCard: {
    flex: 1,
  },

  /* ---- Texte ---- */
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  contentSmall: {
    paddingTop: Spacings.sm,
    paddingRight: Spacings.xl,
  },
  contentWide: {
    paddingRight: 122,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Poppins-Medium',
  },
  title: {
    marginTop: 2,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  titleDone: {
    fontFamily: 'Poppins-Regular',
  },

  /* ---- Éléments posés ---- */
  badge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
  },
  badgeSmall: {
    bottom: 10,
  },
  image: {
    position: 'absolute',
    right: Spacings.xs,
    bottom: Spacings.xs,
  },
  imageSmall: {
    position: 'absolute',
    right: Spacings.xs,
    bottom: 6,
  },
  imageWide: {
    position: 'absolute',
    right: 14,
    top: 13,
  },
  status: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
