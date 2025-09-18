// CollapsibleHeaderLayout.tsx
import React, { useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ListRenderItem,
  FlatListProps,
  Text,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import AntDesign from '@expo/vector-icons/AntDesign';


const AnimatedFlatList = Animated.createAnimatedComponent(View);
// ↑ astuce: si tu préfères, remplace par Animated.createAnimatedComponent(FlatList)

export default function CollapsibleHeaderLayout({
  maxHeaderHeight,
  minHeaderHeight,
  renderExpanded,
  renderCollapsed,
  backButton = false,
  headerBackgroundColor = '#fff',
  enableSnap = false,
  listProps,
  children
}) {
  const inset = useSafeAreaInsets();
  const delta = Math.max(0, maxHeaderHeight - minHeaderHeight);

  const y = useSharedValue(0);
  const listRef = useAnimatedRef();
  const latestYRef = useRef(0);

  // expose progress 0..1
  const progress = useSharedValue(0);
  useDerivedValue(() => {
    progress.value = Math.min(1, Math.max(0, y.value / (delta || 1)));
  }, [delta]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
      // garde une copie côté JS pour le snap
      if (enableSnap) runOnJS(updateLatestY)(e.contentOffset.y);
    },
  });

  function updateLatestY(v) {
    latestYRef.current = v;
  }

  // Header: hauteur animée
  const headerStyle = useAnimatedStyle(() => {
    const h = interpolate(
      y.value,
      [0, delta],
      [maxHeaderHeight + inset.top, minHeaderHeight + inset.top],
      Extrapolation.CLAMP
    );
    return { height: h };
  });

  // Ligne étendue (fade/slide out)
  const expandedRowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, delta * 0.4, delta * 0.8], [1, 0.6, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [0, delta], [0, -18], Extrapolation.CLAMP) }],
  }));

  // Ligne compacte (fade in)
  const collapsedRowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [delta * 0.3, delta * 0.7], [0, 1], Extrapolation.CLAMP),
  }));

  // Shadow au bas du header
  const bottomShadowStyle = Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 6 },
    default: {},
  });

  // SNAP à la fin du scroll (JS)
  const snapToEdge = () => {
    const cur = latestYRef.current;
    if (cur <= 0 || cur >= delta) return;
    const snapDown = 0;
    const snapUp = delta;
    const mid = delta / 2;
    const target = cur < mid ? snapDown : snapUp;
    // @ts-ignore
    listRef.current?.scrollToOffset?.({ offset: target, animated: true });
  };

  const contentPaddingTop = maxHeaderHeight + inset.top;

  return (
    <View style={{ flex: 1, }}>

      {/* HEADER */}
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor, paddingHorizontal: 16, paddingBottom: 10 },
          bottomShadowStyle,
          headerStyle,
        ]}
      >
        {/* Zone étendue */}
        <Animated.View style={[styles.row, expandedRowStyle]}>
          {renderExpanded({ progress })}
        </Animated.View>

        {/* Zone compacte (optionnelle) */}
        {renderCollapsed && (
          <Animated.View style={[styles.row, collapsedRowStyle]}>
            {renderCollapsed({ progress })}
          </Animated.View>
        )}
      </Animated.View>


      <Animated.ScrollView
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: contentPaddingTop }}
        // iOS: ajuste les insets correctement
        {...(Platform.OS === 'ios' ? { contentInsetAdjustmentBehavior: 'never' } : {})}
        // Snap (JS) :
        onMomentumScrollEnd={enableSnap ? snapToEdge : undefined}
        onScrollEndDrag={enableSnap ? snapToEdge : undefined}
        // pass-through props
        {...(listProps)}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    justifyContent: 'flex-end',
  },
  row: {
    gap: 8,
  },
});
