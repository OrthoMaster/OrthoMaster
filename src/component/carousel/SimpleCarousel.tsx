import React from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from "react-native";

const { width: screenWidth } = Dimensions.get("window");



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
        keyExtractor={(item) => item.id}

        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, {width: screenWidth / nbElement2Display}]}
            onPress={()=>onSelect(item)}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 5,
  },
  listContainer: {
    paddingHorizontal: 2, // Ajoute du padding pour éviter que les films collent aux bords
  },
  card: {
    height: 100,
    marginHorizontal: 2, // Espacement entre les films
    borderRadius: 5,
    backgroundColor: "gray",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 10,
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
    width: "100%",
  },
});

export default SimpleCarousel;
