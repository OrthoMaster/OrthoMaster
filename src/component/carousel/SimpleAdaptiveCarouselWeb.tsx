import React from "react";
import { TouchableOpacity, ScrollView, StyleSheet, Image, Text } from "react-native";
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { NavigationProp } from '@react-navigation/native';

export type CarouselItem = {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  image?: string;
  website?: string;
};

type CustomCarouselProps = {
  navigation: NavigationProp<any>; 
  items: CarouselItem[];
  height?: number;
  cardSpacing?: number;
};

const SimpleAdaptiveCarousel: React.FC<CustomCarouselProps> = ({
  items,
  height = 200,
  navigation
}) => {

  const handleOpenEvent = (item: CarouselItem) => {
    const params = {
      channelType: 'event',
      name: item.name,
      logoUrl: item.logo_url,
      image: item.image,
      description: item.description,
      targetId: item.id,
      website: item.website
    }
    navigation.navigate("flash-media-channel", params)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.scrollViewContent}
      style={styles.scrollView}
    >
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.slide}
          onPress={() => { handleOpenEvent(item) }}
        >
          <Image
            source={{ uri: process.env.EXPO_PUBLIC_S3_URL + item.image }}
            style={[styles.image, { width: height, height: height }]}
            resizeMode="cover" />
          <Text style={[styles.name, { width: height, fontSize: item.name.length > 20 ? 13 : 16 }]}
            numberOfLines={3} ellipsizeMode="middle">{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginLeft: Spacings.sm,
    paddingVertical: Spacings.md
  },
  scrollViewContent: {
    gap: Spacings.md,
  },
  slide: {
    overflow: 'hidden',
  },
  image: {
    borderRadius: 16,
    resizeMode: 'cover'
  },
  name: {
    marginTop: Spacings.md,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  }
});

export default SimpleAdaptiveCarousel;