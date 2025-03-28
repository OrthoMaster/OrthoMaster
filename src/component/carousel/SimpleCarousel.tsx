import React from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useQuery } from "react-query";
import { getS3Image } from "../../services/S3Service";
const { width: screenWidth } = Dimensions.get("window");


const Card = ({ data, onSelect, nbElement2Display }) => {
  const imageUrl = useQuery(['contentThumbnail', data.id_content, data.title], () => getS3Image(`${data.s3_path}/${data.title}/logo.png`))


  // return <TouchableOpacity style={[styles.card, {width: screenWidth / nbElement2Display}]} //TODO design netflix
  return <TouchableOpacity style={[styles.card, { width: screenWidth / nbElement2Display }]}
    onPress={onSelect}
  >
    <Image source={{ uri: imageUrl.data }} style={styles.image} />
    <Text style={styles.title} >
      {data.title}
    </Text>
    <View style={{
      // display: 'flex',
      // flexDirection: 'row',
      // flexWrap: 'wrap',
      width: '100%',
      paddingLeft: 5
    }}>
      <Text style={{
        color: "#ffaf31",
        fontWeight: 'bold',
        fontSize: 10
      }}>{data.author}</Text>
      <Text  style={{
        color: "#000",
        fontStyle: 'italic',
        fontSize: 10,
      }}>⏱️{data.duration}</Text>
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
        keyExtractor={(item: any , index: number) => index.toString()}

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
    backgroundColor: "#FFF",
    paddingVertical: 5,
  },
  listContainer: {
    paddingHorizontal: 2, // Ajoute du padding pour éviter que les films collent aux bords
  },
  card: {
    // height: 100, //TODO netflix
    maxHeight: 200,
    marginHorizontal: 2, // Espacement entre les films
    borderRadius: 5,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: 'flex-start'
  },
  // image: {
  //   width: "100%",       //TODO netflix
  //   height: 140,
  //   borderRadius: 10,
  // },
  image: {
    width: "100%",
    height: "60%",
    borderRadius: 10,
    resizeMode: 'contain',
  },
  title: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
    marginTop: 5,
    width: "100%",
    paddingHorizontal: 5
  },
});

export default SimpleCarousel;
