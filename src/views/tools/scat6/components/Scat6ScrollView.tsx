import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ScrollViewProps, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Spacings from '../../../../../constants/Spacings';
import { SCAT } from '../scat6Theme';

/** Marge sous laquelle on considère le bas atteint (évite un bouton pour quelques pixels). */
const END_TOLERANCE = 24;

interface Props extends ScrollViewProps {
  /** Décalage du bouton depuis le bas (au-dessus de la barre d'onglets ou d'actions). */
  arrowBottom?: number;
}

/**
 * ScrollView des écrans SCAT6 : sur le web la barre de défilement est discrète, et une page longue
 * ne se voit pas comme telle. Tant qu'il reste du contenu plus bas, une flèche ronde en bas à droite
 * l'indique ; un clic descend d'environ une hauteur d'écran.
 */
export const Scat6ScrollView = forwardRef<ScrollView, Props>(({ arrowBottom = Spacings.lg, onScroll, onLayout, onContentSizeChange, children, ...props }, ref) => {
  const inner = useRef<ScrollView>(null);
  useImperativeHandle(ref, () => inner.current as ScrollView);

  // Refs en parallèle : le clic lit les dernières mesures sans attendre un rendu.
  const metrics = useRef({ offset: 0, layout: 0, content: 0 });
  const [hasMore, setHasMore] = useState(false);

  const update = () => {
    const { offset, layout, content } = metrics.current;
    const more = layout > 0 && content - layout - offset > END_TOLERANCE;
    setHasMore((prev) => (prev === more ? prev : more));
  };

  const scrollDown = () => {
    const { offset, layout, content } = metrics.current;
    const y = Math.min(content - layout, offset + layout * 0.8);
    inner.current?.scrollTo({ y, animated: true });
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        {...props}
        ref={inner}
        scrollEventThrottle={64}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          metrics.current.offset = e.nativeEvent.contentOffset.y;
          update();
          onScroll?.(e);
        }}
        onLayout={(e) => {
          metrics.current.layout = e.nativeEvent.layout.height;
          update();
          onLayout?.(e);
        }}
        onContentSizeChange={(w, h) => {
          metrics.current.content = h;
          update();
          onContentSizeChange?.(w, h);
        }}
      >
        {children}
      </ScrollView>
      {hasMore && (
        <Pressable
          style={({ hovered }: any) => [styles.arrow, { bottom: arrowBottom }, hovered && styles.arrowHover]}
          onPress={scrollDown}
          accessibilityRole="button"
          accessibilityLabel="Faire défiler vers le bas"
        >
          <Ionicons name="arrow-down" size={22} color={SCAT.card} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    right: Spacings.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SCAT.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#12203A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  arrowHover: {
    backgroundColor: SCAT.blueDark,
  },
});
