import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { DailyActionGroup, ACTION_THEMES } from './dailyActions';
import { ActionCardShell, CountBadge, StatusMark } from './DailyActionParts';
import { HomeBreakpoint, useHomeLayout } from './useHomeLayout';

// Largeur plafonnée et rangée centrée : avec une ou deux actions, les cartes ne s'étirent pas sur tout l'écran.
// En md, les trois cartes se partagent la largeur pour rester sur une seule ligne.
const SIZES: Record<HomeBreakpoint, { maxWidth: number; height: number; image: number; title: number; label: number; gap: number }> = {
  md: { maxWidth: 320, height: 99, image: 56, title: 13, label: 13, gap: 12 },
  lg: { maxWidth: 340, height: 99, image: 68, title: 13, label: 14, gap: 14 },
  xl: { maxWidth: 400, height: 111, image: 80, title: 14, label: 15, gap: 18 },
};

type CardSize = typeof SIZES[HomeBreakpoint] & { width: number };

const ActionCard = ({ group, size, onPress }: { group: DailyActionGroup; size: CardSize; onPress: () => void }) => {
  const theme = ACTION_THEMES[group.type];
  const latest = group.items[0];

  return (
    <ActionCardShell
      group={group}
      height={size.height}
      onPress={onPress}
      style={{ width: size.width }}
      innerStyle={styles.face}
      accessibilityLabel={`${theme.label} : ${latest.title}`}
    >
      <View>
        <Image source={{ uri: theme.image }} resizeMode="contain" style={{ width: size.image, height: size.image }} />
        <StatusMark group={group} style={group.allDone ? styles.checkMark : styles.dotMark} />
      </View>

      <View style={styles.texts}>
        <Text style={[styles.label, { color: theme.ink, fontSize: size.label, lineHeight: size.label + 6 }]}>{theme.label}</Text>
        <Text style={[styles.title, { fontSize: size.title, lineHeight: size.title + 5 }, group.allDone && styles.titleDone]} numberOfLines={2} ellipsizeMode="tail">
          {latest.title}
        </Text>
      </View>

      <CountBadge group={group} />
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
  const { breakpoint, innerWidth } = useHomeLayout();
  if (groups.length === 0) return null;

  const base = SIZES[breakpoint];
  const shared = (innerWidth - base.gap * (groups.length - 1)) / groups.length;
  const size = { ...base, width: Math.max(0, Math.min(base.maxWidth, shared)) };

  return (
    <View style={[styles.row, { gap: base.gap }]}>
      {groups.map((group) => (
        <ActionCard key={group.type} group={group} size={size} onPress={() => onOpenGroup(group)} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Rangée ---- */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: Spacings.xs,
    paddingRight: Spacings.sm,
  },

  /* ---- Contenu ---- */
  dotMark: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  checkMark: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: 'Poppins-Medium',
  },
  title: {
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  titleDone: {
    fontFamily: 'Poppins-Regular',
  },
});
