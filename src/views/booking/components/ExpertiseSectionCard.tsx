import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const PRESS_DEPTH = 4;

interface ExpertiseSectionCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  summary: string;
  /** Résumé en orange : la section bloque la réception de demandes. */
  warning?: boolean;
  onPress: () => void;
}

export const ExpertiseSectionCard: React.FC<ExpertiseSectionCardProps> = ({ icon, title, summary, warning, onPress }) => {
  const press = useRef(new Animated.Value(0)).current;

  const animatePress = (toValue: number) => {
    Animated.timing(press, { toValue, duration: 90, useNativeDriver: true }).start();
  };

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      accessibilityRole="button"
    >
      <View style={styles.edge}>
        <Animated.View style={[styles.face, { transform: [{ translateY }] }]}>
          <View style={styles.medallion}>
            <MaterialCommunityIcons name={icon} size={24} color={Colors.lblueDark} />
          </View>

          <View style={styles.texts}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.summary, warning && styles.summaryWarning]} numberOfLines={1}>
              {summary}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={Colors.subtext} />
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte 3D ---- */
  edge: {
    backgroundColor: Colors.disabledBackground,
    borderRadius: 14,
    paddingBottom: PRESS_DEPTH,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  /* ---- Contenu ---- */
  medallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  summary: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
    marginTop: Spacings.xxxs,
  },
  summaryWarning: {
    color: Colors.warning,
  },
});