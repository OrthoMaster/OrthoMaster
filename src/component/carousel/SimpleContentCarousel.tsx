import React from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity, Platform } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

const CARD_WIDTH = isTablet ? 300 : 200;

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';


const Card = ({ data, onSelect, nbElement2Display }) => {
  return (
    <TouchableOpacity style={[styles.card, { width: CARD_WIDTH }]} onPress={onSelect}>
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{ uri: data.thumbnail }}
          style={[styles.image, { width: CARD_WIDTH, height: CARD_WIDTH * 9 / 16 }]}
        />
        {!!data.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{data.duration}</Text>
          </View>
        )}
      </View>

      <Text style={styles.subTitle} numberOfLines={1}>
        {data.expert_names ? data.expert_names : 'OrthoMaster'}
      </Text>
      <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
    </TouchableOpacity>
  );
};

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
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
    width: "100%",
    fontFamily: 'Poppins-Medium',
    minHeight: 30,
  },
  subTitle: {
    color: Colors.primary,
    fontSize: 12,
    letterSpacing: 0.3,
    fontFamily: 'Roboto',
    fontWeight: '400',
    width: "100%",
    marginBottom: Spacings.xxxs,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginBottom: Spacings.sm,
  },
  durationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: Colors.white,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});

export default SimpleCarousel;
