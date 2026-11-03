import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

export interface ServiceLink {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  summary: string;
  /** Résumé en orange : ce réglage empêche de recevoir des demandes. */
  warning?: boolean;
  onPress: () => void;
}

interface ExpertiseServiceCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Couleur du service (bleu : Thèmes, violet : Consultation). */
  color: string;
  soft: string;
  title: string;
  description: string;
  enabled: boolean;
  saving?: boolean;
  onToggle: (value: boolean) => void;
  /** État lisible sous le titre : « Reçoit des demandes », « Désactivé »… */
  stateLabel: string;
  stateColor: string;
  /** Message bloquant (rien à réserver, prix manquant…). */
  warning?: string | null;
  links: ServiceLink[];
}

/**
 * Une façon d'être réservé (Thèmes ou Consultation), mobile et web : même carte pour les deux,
 * avec son interrupteur, son état, et les réglages qui la concernent (chacun sur son écran).
 */
export const ExpertiseServiceCard: React.FC<ExpertiseServiceCardProps> = ({
  icon,
  color,
  soft,
  title,
  description,
  enabled,
  saving,
  onToggle,
  stateLabel,
  stateColor,
  warning,
  links,
}) => (
  <View style={styles.card}>
    <View style={styles.head}>
      <View style={[styles.medallion, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.stateRow}>
          <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
          <Text style={[styles.stateText, { color: stateColor }]}>{stateLabel}</Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={saving}
        trackColor={{ false: Colors.disabledBackground, true: color }}
        thumbColor={Colors.white}
        ios_backgroundColor={enabled ? color : Colors.disabledBackground}
        accessibilityLabel={`Accepter les demandes : ${title}`}
      />
    </View>

    <Text style={styles.description}>{description}</Text>

    {warning ? (
      <View style={styles.warning}>
        <MaterialCommunityIcons name="alert-outline" size={18} color={Colors.warning} />
        <Text style={styles.warningText}>{warning}</Text>
      </View>
    ) : null}

    <View style={styles.links}>
      {links.map((link, index) => (
        <TouchableOpacity
          key={link.title}
          style={[styles.link, index > 0 && styles.linkDivider]}
          onPress={link.onPress}
          activeOpacity={0.6}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name={link.icon} size={20} color={color} />
          <View style={styles.flex}>
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={[styles.linkSummary, link.warning && styles.linkSummaryWarning]} numberOfLines={1}>
              {link.summary}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.subtext} />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    backgroundColor: Colors.white,
    gap: Spacings.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  medallion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stateText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.subtext2,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 10,
    backgroundColor: Colors.warningBackground,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.yellowDark,
  },
  links: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacings.sm,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  linkDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  linkTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  linkSummary: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  linkSummaryWarning: {
    color: Colors.yellowDark,
  },
});
