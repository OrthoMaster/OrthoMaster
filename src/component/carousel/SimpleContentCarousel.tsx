import React, { useState } from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity, NativeSyntheticEvent, LayoutChangeEvent } from "react-native";
import { useQuery } from "react-query";
import { getS3Image } from "../../services/S3Service";
const { width: screenWidth } = Dimensions.get("window");


const Card = ({ data, onSelect, nbElement2Display }) => {
  const imageUrl = useQuery(['contentThumbnail', data.id_content, data.title], () => getS3Image(`${data.s3_path}/${data.title}/logo.png`))
  const [imgDimensions, setImgDimensions] = useState({
    width: 0,
    height: 0
  })


  // return <TouchableOpacity style={[styles.card, {width: screenWidth / nbElement2Display}]} //TODO design netflix
  return <TouchableOpacity style={[styles.card, { width: screenWidth / nbElement2Display }]}
    onPress={onSelect}
    onLayout={(event: LayoutChangeEvent) => {
      setImgDimensions({
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.width * (9 / 16)
      })

    }}
  >
    <Image source={{ uri: imageUrl.data }} style={[styles.image, {
      width: imgDimensions.width,
      height: imgDimensions.height
    }]} />
    <Text style={styles.title} numberOfLines={2} >
      {data.title}
    </Text>
    <View style={{
      width: '100%',
      paddingLeft: 5
    }}>
      <Text style={{
        color: "#ffaf31",
        fontWeight: 'bold',
        fontSize: 10
      }}>{data.author}</Text>

    </View>
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
    height: '100%'
  },
  listContainer: {
    paddingHorizontal: 2, // Ajoute du padding pour éviter que les films collent aux bords
  },
  card: {
    maxHeight: "100%",
    marginHorizontal: 5, // Espacement entre les films
    borderRadius: 5,
    backgroundColor: "none",
    alignItems: "center",
    justifyContent: 'flex-start',
  },

  image: {
    width: "100%",
    height: "60%",
    resizeMode: 'contain',
    borderRadius: 5,
    backgroundColor: '#000'
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
    marginTop: 5,
    width: "100%",
    paddingHorizontal: 5
  },
});

export default SimpleCarousel;
