import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { DailyActionGroup, ACTION_THEMES } from './dailyActions';
import { ActionCardShell, CountBadge, StatusMark } from './DailyActionParts';

// Largeur fixe et rangée centrée : avec une ou deux actions, les cartes ne s'étirent pas sur tout l'écran.
const CARD_WIDTH = 340;
const CARD_HEIGHT = 95;

const ActionCard = ({ group, onPress }: { group: DailyActionGroup; onPress: () => void }) => {
  const theme = ACTION_THEMES[group.type];
  const latest = group.items[0];

  return (
    <ActionCardShell
      group={group}
      height={CARD_HEIGHT}
      onPress={onPress}
      style={styles.card}
      innerStyle={styles.face}
      accessibilityLabel={`${theme.label} : ${latest.title}`}
    >
      <View>
        <Image source={{ uri: theme.image }} resizeMode="contain" style={styles.image} />
        <StatusMark group={group} style={group.allDone ? styles.checkMark : styles.dotMark} />
      </View>

      <View style={styles.texts}>
        <Text style={[styles.label, { color: theme.ink }]}>{theme.label}</Text>
        <Text style={[styles.title, group.allDone && styles.titleDone]} numberOfLines={2} ellipsizeMode="tail">
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
  if (groups.length === 0) return null;

  return (
    <View style={styles.row}>
      {groups.map((group) => (
        <ActionCard key={group.type} group={group} onPress={() => onOpenGroup(group)} />
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
    gap: 14,
  },
  card: {
    width: CARD_WIDTH,
    maxWidth: '100%',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: Spacings.xs,
    paddingRight: Spacings.sm,
  },

  /* ---- Contenu ---- */
  image: {
    width: 68,
    height: 68,
  },
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
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Poppins-Medium',
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  titleDone: {
    fontFamily: 'Poppins-Regular',
  },
});
