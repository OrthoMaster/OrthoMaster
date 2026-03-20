import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

// ── Constants ─────────────────────────────────────────────────────────────────
const HOTSPOT_SIZE = 20;

// ── Demo data ─────────────────────────────────────────────────────────────────
const CURRENT_PLAN = {
  name: 'Starter',
  usedPercent: 4,
  usedLabel: 'Sessions utilisées',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type LabelPosition = 'top' | 'bottom' | 'left' | 'right';

interface BodyDomainHotspot {
  id: string;
  name: string;
  xPercentage: number;
  yPercentage: number;
  labelPosition?: LabelPosition;
  active: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const anatomyDomains: BodyDomainHotspot[] = [
  { id: 'vai_l', name: 'Épaule', xPercentage: 35, yPercentage: 18, labelPosition: 'left', active: true },
  { id: 'khuyu_l', name: 'Coude', xPercentage: 30, yPercentage: 38, labelPosition: 'left', active: false },
  { id: 'cot_song', name: 'Colonne vertébrale', xPercentage: 50, yPercentage: 35, labelPosition: 'right', active: true },
  { id: 'dau_goi_l', name: 'Genou', xPercentage: 42, yPercentage: 71, labelPosition: 'left', active: false },
  { id: 'co_chan_r', name: 'Cheville', xPercentage: 58, yPercentage: 90, labelPosition: 'right', active: true },
];

// ── HotspotMarker ─────────────────────────────────────────────────────────────
interface HotspotMarkerProps {
  domain: BodyDomainHotspot;
  isSelected: boolean;
  onPress: (domain: BodyDomainHotspot) => void;
}

const HotspotMarker: React.FC<HotspotMarkerProps> = ({ domain, isSelected, onPress }) => {
  const { active } = domain;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, active]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.3, 0] });

  const colors = (() => {
    if (!active) return {
      dot: '#4A5568',
      ring: 'rgba(100,116,139,0.4)',
      bg: 'rgba(30,35,45,0.5)',
      border: 'rgba(100,116,139,0.35)',
    };
    if (isSelected) return {
      dot: '#39FF14',
      ring: 'rgba(57,255,20,0.5)',
      bg: 'rgba(57,255,20,0.15)',
      border: 'rgba(57,255,20,0.6)',
    };
    return {
      dot: '#00A3FF',
      ring: 'rgba(0,163,255,0.5)',
      bg: 'rgba(0,163,255,0.12)',
      border: 'rgba(0,163,255,0.5)',
    };
  })();

  const hotspotPositionStyle: ViewStyle = {
    position: 'absolute',
    left: `${domain.xPercentage}%` as `${number}%`,
    top: `${domain.yPercentage}%` as `${number}%`,
    transform: [{ translateX: -HOTSPOT_SIZE / 2 }, { translateY: -HOTSPOT_SIZE / 2 }],
  };

  const labelPosition: LabelPosition = domain.labelPosition ?? 'right';
  const LABEL_GAP = 8;

  const labelStyle: ViewStyle = (() => {
    switch (labelPosition) {
      case 'top':
        return { position: 'absolute', bottom: HOTSPOT_SIZE + LABEL_GAP, left: HOTSPOT_SIZE / 2, transform: [{ translateX: -999 / 2 }], alignItems: 'center' };
      case 'bottom':
        return { position: 'absolute', top: HOTSPOT_SIZE + LABEL_GAP, left: 0, right: 0, alignItems: 'center' };
      case 'left':
        return { position: 'absolute', right: HOTSPOT_SIZE + LABEL_GAP, top: '50%', transform: [{ translateY: -(HOTSPOT_SIZE / 2) }], justifyContent: 'center', alignItems: 'flex-end' };
      case 'right':
      default:
        return { position: 'absolute', left: HOTSPOT_SIZE + LABEL_GAP, top: '50%', transform: [{ translateY: -(HOTSPOT_SIZE / 2) }], justifyContent: 'center', alignItems: 'flex-start' };
    }
  })();

  return (
    <View style={hotspotPositionStyle} pointerEvents="box-none">
      {active && (
        <Animated.View
          pointerEvents="none"
          style={[styles.pulseRing, { borderColor: colors.ring, transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
        />
      )}

      <TouchableOpacity
        style={[styles.hotspot, { backgroundColor: colors.bg, borderColor: colors.border }]}
        onPress={() => active && onPress(domain)}
        activeOpacity={active ? 0.75 : 1}
      >
        <View style={[styles.hotspotInner, { backgroundColor: colors.dot }]} />
        <View style={[styles.hotspotGlow, { borderColor: colors.ring }]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={labelStyle}
        onPress={() => active && onPress(domain)}
        activeOpacity={active ? 0.75 : 1}
      >
        <View style={[
          styles.labelBadge,
          !active && styles.labelBadgeInactive,
          isSelected && active && styles.labelBadgeSelected,
        ]}>
          <Text style={[
            styles.labelText,
            !active && styles.labelTextInactive,
            isSelected && active && styles.labelTextSelected,
          ]}>
            {domain.name}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ── ChatbotDomainView ─────────────────────────────────────────────────────────
export const ChatDomainView = ({ navigation }: any) => {
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    }, [navigation])
  );

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const handleHotspotPress = (domain: BodyDomainHotspot) => setSelectedDomainId(domain.id);
  const handleClose = () => navigation.goBack();
  const handleUpgrade = () => console.log('Navigate to upgrade screen');
  const handleStart = () => {
    if (!selectedDomainId) return;
    navigation.navigate('chat-view', { domainId: selectedDomainId });
  };

  const canStart = selectedDomainId !== null;
  const isNearLimit = CURRENT_PLAN.usedPercent >= 80;

  // ── Progress bar animation ──────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: CURRENT_PLAN.usedPercent / 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  // ── Start button pulse khi active ──────────────────────────────────────────
  const startPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!canStart) {
      startPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(startPulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(startPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [canStart]);

  // Màu progress bar: xanh bình thường → cam khi gần limit
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.79, 0.8, 1],
    outputRange: ['#00A3FF', '#00A3FF', '#FF6B35', '#FF6B35'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <View style={styles.headerCenter}>
          <Text style={styles.appTitle}>Assistance IA</Text>
          <Text style={styles.headerSubtitle}>Choisissez un domaine pour commencer</Text>
        </View>
        <View style={styles.headerSide}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAP ── */}
      <View style={styles.mapOuter}>
        <View style={styles.imageWrapper}>
          <Image
            source={require('../../../assets/chatbot/body_xray.jpeg')}
            style={styles.backgroundImage}
            resizeMode="stretch"
          />
          {anatomyDomains.map((domain) => (
            <HotspotMarker
              key={domain.id}
              domain={domain}
              isSelected={domain.id === selectedDomainId}
              onPress={handleHotspotPress}
            />
          ))}
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.planRow}>
            <View style={styles.planBadge}>
              <Ionicons name="flash" size={10} color="#F6C90E" style={{ marginRight: 3 }} />
              <Text style={styles.planBadgeText}>{CURRENT_PLAN.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-up-circle-outline" size={11} color="#00A3FF" style={{ marginRight: 3 }} />
              <Text style={styles.upgradeText}>Abonnement</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, isNearLimit && styles.usageLabelWarn]}>
              {isNearLimit ? '⚠️  ' : ''}{CURRENT_PLAN.usedLabel}
            </Text>
            <Text style={[styles.usagePercent, isNearLimit && styles.usageLabelWarn]}>
              {CURRENT_PLAN.usedPercent}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.footerDivider} />

        <View style={styles.footerRight}>
          <Animated.View style={{ transform: [{ scale: startPulse }] }}>
            <TouchableOpacity
              style={[styles.startButton, canStart && styles.startButtonActive]}
              onPress={handleStart}
              activeOpacity={canStart ? 0.8 : 1}
              disabled={!canStart}
            >
              <Text style={[styles.startButtonText, canStart && styles.startButtonTextActive]}>
                Démarrer
              </Text>
              <Ionicons
                name="chatbox-ellipses"
                size={22}
                color={canStart ? Colors.white : 'rgba(100,116,139,0.5)'}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

      </View>
    </SafeAreaView >
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: '#E0E6ED',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#8492A6',
    marginTop: Spacings.xs,
    textAlign: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Map
  mapOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '80%',
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },

  // ── Hotspot
  hotspot: {
    width: HOTSPOT_SIZE,
    height: HOTSPOT_SIZE,
    borderRadius: HOTSPOT_SIZE / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  hotspotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hotspotGlow: {
    position: 'absolute',
    width: HOTSPOT_SIZE - 12,
    height: HOTSPOT_SIZE - 12,
    borderRadius: (HOTSPOT_SIZE - 12) / 2,
    borderWidth: 1,
  },
  pulseRing: {
    position: 'absolute',
    width: HOTSPOT_SIZE,
    height: HOTSPOT_SIZE,
    borderRadius: HOTSPOT_SIZE / 2,
    borderWidth: 1.5,
  },

  // ── Label
  labelBadge: {
    backgroundColor: 'rgba(10,14,23,0.75)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,163,255,0.75)',
    borderRadius: 6,
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xs,
    minWidth: 100,
  },
  labelBadgeSelected: {
    borderColor: 'rgba(57,255,20,0.75)',
    backgroundColor: 'rgba(57,255,20,0.5)',
  },
  labelBadgeInactive: {
    backgroundColor: 'rgba(100,116,139,0.3)',
    borderColor: 'rgba(100,116,139,0.75)',
  },
  labelText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  labelTextSelected: {
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
  },
  labelTextInactive: {
    color: 'rgba(100,116,139,0.6)',
    fontFamily: 'Poppins-Medium',
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacings.md,
    marginBottom: Spacings.sm,
    marginTop: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(180,200,220,0.2)',
  },

  // Footer left — plan info
  footerLeft: {
    flex: 1,
    gap: 6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246,201,14,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(246,201,14,0.4)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#F6C90E',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,163,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,163,255,0.35)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  upgradeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#00A3FF',
  },
  usageLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(180,200,220,0.5)',
  },
  usageLabelWarn: {
    color: '#FF6B35',
  },

  // Progress bar
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usagePercent: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#00A3FF',
  },

  // Footer divider
  footerDivider: {
    width: 0.5,
    height: 56,
    backgroundColor: 'rgba(180,200,220,0.12)',
    marginHorizontal: 14,
  },

  // Footer right — start button
  footerRight: {
    alignItems: 'center',
    gap: Spacings.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(100,116,139,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.25)',
  },
  startButtonActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: 'rgba(100,116,139,0.5)',
  },
  startButtonTextActive: {
    color: Colors.white,
  },
});