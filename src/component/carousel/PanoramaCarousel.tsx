import React, { useState, useEffect } from "react";
import { View, Text, Image, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../services/S3Service";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
const { width: screenWidth } = Dimensions.get("window");


const Card = ({ data, onPress }) => {
  const imageUrl = useQuery({
    queryKey: ['contentThumbnail', data.id_content, data.title],
    queryFn: () => getS3Image(`${data.s3_path}/${data.title}/logo.png`)
  })

  return <TouchableOpacity style={styles.card}
    onPress={onPress}
  >
    <Image source={{ uri: imageUrl.data }} style={styles.image} />
    <LinearGradient colors={["transparent", "transparent", "#000"]}
      style={{
        width: '100%', height: '100%',
        position: 'absolute'
      }}
    />
    <View style={{
      position: 'absolute',
      bottom: 10,
      zIndex: 1,
      width: '90%'
    }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14, textAlign: 'left' }}>{data.title}</Text>
      <Text style={{ color: '#fff' }}>par <Text style={{ color: '#ffaf31', fontWeight: 'bold', textAlign: 'left' }}>{data.author}</Text></Text>
    </View>
  </TouchableOpacity>
}



const PanoramaCarousel = ({ data, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = React.useRef(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <Carousel
        ref={ref}
        loop
        autoPlay
        autoPlayInterval={3000}
        data={data}
        scrollAnimationDuration={1000}
        onProgressChange={progress}
        onSnapToItem={(index) => setActiveIndex(index)}
        width={screenWidth}
        height={screenWidth / 2}
        pagingEnabled
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        renderItem={({ item }) => {
          return <Card onPress={() => { onSelect(item) }} data={item} />
        }

          //   (
          //   
          // )
        }
      />
      <Pagination.Basic
        progress={progress}
        data={data}
        dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
        containerStyle={{ gap: 5, marginTop: 10 }}
        onPress={onPressPagination}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
    elevation: 5,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
});

export default PanoramaCarousel;
