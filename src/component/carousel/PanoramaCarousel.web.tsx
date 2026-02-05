import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../services/S3Service";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

const CARD_WIDTH = (screenWidth - 6 * 20 - 220) / 5;
const CARD_HEIGHT = CARD_WIDTH / 16 * 9;

const Card = ({ data, onPress }) => {
  const imageUrl = useQuery({
    queryKey: ['contentThumbnail', data.id_content, data.title],
    queryFn: () => getS3Image(`${data.s3_path}/${data.title}/logo.png`)
  })

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: imageUrl.data }} style={styles.image} />
      <LinearGradient 
        colors={["transparent", "transparent", "#000"]}
        style={styles.gradient}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
        <Text style={styles.authorText}>
          par <Text style={styles.authorName}>{data.author}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const PanoramaCarousel = ({ data, onSelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.cardWrapper}>
            <Card 
              onPress={() => onSelect(item)} 
              data={item}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    width: '100%',
  },
  scrollViewContent: {
    // paddingHorizontal: 10,
  },
  cardWrapper: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    bottom: 10,
    zIndex: 1,
    width: '90%',
    paddingHorizontal: 10,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 2,
  },
  authorText: {
    color: '#fff',
    fontSize: 12,
  },
  authorName: {
    color: '#ffaf31',
    fontWeight: 'bold',
  },
});

export default PanoramaCarousel;