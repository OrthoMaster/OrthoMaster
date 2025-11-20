// MediaSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

interface MediaSkeletonProps {
  numberOfObjects: number;
}

const MediaSkeleton: React.FC<MediaSkeletonProps> = ({
  numberOfObjects = 1,
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
    <View key={index} style={styles.skeletonItem}>
      {/* Image */}
      <Animated.View 
        style={[
          styles.squareBox,
          { opacity }
        ]} 
      />
      
      {/* Text */}
      <View style={styles.textLines}>
        <Animated.View 
          style={[
            styles.lineBox,
            styles.lineBoxLong,
            { opacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.lineBox,
            styles.lineBoxLong,
            { opacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.lineBox,
            styles.lineBoxMedium,
            { opacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.lineBox,
            styles.lineBoxShort,
            { opacity }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: numberOfObjects }).map((_, index) => 
        renderSkeletonItem(index)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacings.md,
  },
  skeletonItem: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: Spacings.md,
  },
  squareBox: {
    flex: 0.8,
    aspectRatio: 3 / 2,
    backgroundColor: Colors.gray,
    borderRadius: 8,
    marginBottom: Spacings.md,
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