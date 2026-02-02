import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ScrollView } from 'react-native';
import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

interface MediaSkeletonProps {
  numberOfObjects?: number;
  horizontal?: boolean;
}

const MediaSkeleton: React.FC<MediaSkeletonProps> = ({
  numberOfObjects = 1,
  horizontal = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeletonItem = (index: number) => (
    <View
      key={index}
      style={[
        styles.skeletonItem,
        horizontal ? styles.skeletonItemHorizontal : styles.skeletonItemVertical
      ]}
    >
      {/* Image */}
      <Animated.View
        style={[
          styles.squareBox,
          horizontal ? { width: 100, height: 80 } : { flex: 0.8, aspectRatio: 3 / 2 },
          { opacity }
        ]}
      />

      {/* Text */}
      <View style={styles.textLines}>
        <Animated.View style={[styles.lineBox, styles.lineBoxLong, { opacity }]} />
        <Animated.View style={[styles.lineBox, styles.lineBoxLong, { opacity }]} />
        <Animated.View style={[styles.lineBox, styles.lineBoxMedium, { opacity }]} />
        {!horizontal && (
          <Animated.View style={[styles.lineBox, styles.lineBoxShort, { opacity }]} />
        )}
      </View>
    </View>
  );

  const ContainerWrapper = horizontal ? ScrollView : View;
  const wrapperProps = horizontal ? { horizontal: true, showsHorizontalScrollIndicator: false } : {};

  return (
    <ContainerWrapper
      {...wrapperProps}
      style={[styles.container, horizontal && styles.containerHorizontal]}
    >
      {Array.from({ length: numberOfObjects }).map((_, index) =>
        renderSkeletonItem(index)
      )}
    </ContainerWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacings.md,
  },
  containerHorizontal: {
    flexDirection: 'row',
  },
  skeletonItem: {
    flexDirection: 'row',
  },
  skeletonItemVertical: {
    marginBottom: Spacings.md,
  },
  skeletonItemHorizontal: {
    marginRight: Spacings.md,
    width: 280,
  },
  squareBox: {
    flex: 0.8,
    aspectRatio: 3 / 2,
    backgroundColor: Colors.gray,
    borderRadius: 8,
  },
  textLines: {
    flex: 1.2,
    gap: Spacings.xxs,
    paddingLeft: Spacings.md,
  },
  lineBox: {
    height: 16,
    backgroundColor: Colors.gray,
    borderRadius: 4,
  },
  lineBoxLong: {
    width: '100%',
  },
  lineBoxMedium: {
    width: '80%',
  },
  lineBoxShort: {
    width: '60%',
  },
});

export default MediaSkeleton;