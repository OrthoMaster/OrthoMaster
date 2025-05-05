import React from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
const { width: screenWidth } = Dimensions.get("window");


export type CarouselItem = {
  key: string;
  content: React.ReactNode;
};

type CustomCarouselProps = {
  items: CarouselItem[];
  widthPercent?: number; // 1 = full width
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
    <View style={{height, marginVertical: 5}}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any , index: number) => index.toString()}
        style={{width: screenWidth * widthPercent}}
        renderItem={({ item }) => {
          
          return <View style={[styles.slide, {marginHorizontal: cardSpacing}]}>
            {item.content}
          </View>
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleAdaptiveCarousel;
