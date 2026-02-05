import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";

export type CarouselItem = {
  key: string;
  content: React.ReactNode;
};

type CustomCarouselProps = {
  items: CarouselItem[];
  widthPercent?: number; // 1 = full width (không dùng nữa cho web)
  height?: number;
  cardSpacing?: number;
};

const SimpleAdaptiveCarousel: React.FC<CustomCarouselProps> = ({
  items,
  widthPercent = 1,
  height = 200,
  cardSpacing = 5
}) => {
  return (
    <View style={{ height, marginVertical: 5 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}
      >
        {items.map((item, index) => (
          <View 
            key={index} 
            style={[styles.slide, { marginHorizontal: cardSpacing }]}
          >
            {item.content}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  slide: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleAdaptiveCarousel;