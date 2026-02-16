import React, { useState } from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity, Platform, LayoutChangeEvent } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../services/S3Service";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

const CARD_WIDTH = isTablet ? 300 : 200;

import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';


const Card = ({ data, onSelect, nbElement2Display }) => {
  const imageUrl = useQuery({
    queryKey: ['contentThumbnail', data.id_content, data.title],
    queryFn: () => getS3Image(`${data.s3_path}/${data.title}/logo.png`)
  })

  // return <TouchableOpacity style={[styles.card, {width: screenWidth / nbElement2Display}]}
  return <TouchableOpacity style={[styles.card, { width: CARD_WIDTH }]}
    onPress={onSelect}
  >
    <Image source={{ uri: imageUrl.data }}
      style={[styles.image, {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 9 / 16
      }]} />

    {data.author &&
      <Text style={styles.subTitle}>{data.author}</Text>
    }
    <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
  </TouchableOpacity>
}

const SimpleCarousel = ({
  data,
  nbElement2Display,
  onSelect
}) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={"fast"}
        nestedScrollEnabled={true}
        keyExtractor={(item: any, index: number) => index.toString()}
        renderItem={({ item }) => (
          <Card data={item} nbElement2Display={nbElement2Display} onSelect={() => {
            onSelect(item)
          }} />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  listContainer: {
    paddingHorizontal: Spacings.sm,
  },
  card: {
    marginRight: Spacings.md,
    borderRadius: 6,
    backgroundColor: "none",
    alignItems: "center",
    justifyContent: 'flex-start',
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 6,
    backgroundColor: Colors.gray,
    marginBottom: Spacings.sm,
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    width: "100%",
    fontFamily: 'Poppins-Medium',
    minHeight: 30,
  },
  subTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    width: "100%",
    marginBottom: Spacings.xxxs,
  }
});

export default SimpleCarousel;
