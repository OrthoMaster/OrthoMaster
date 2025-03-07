import React, { useState } from "react";
import { View, Text, Image, Dimensions, StyleSheet } from "react-native";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
const { width: screenWidth } = Dimensions.get("window");

const movies = [
  {
    id: "1",
    title: "Stranger Things",
    image: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
  },
  {
    id: "2",
    title: "The Witcher",
    image: "https://image.tmdb.org/t/p/w500/zrPpUlehQaBf8YX2NrVrKK8IEpf.jpg",
  },
  {
    id: "3",
    title: "Dark",
    image: "https://image.tmdb.org/t/p/w500/uAQrHntCccFpvxp75XdQgqexlJd.jpg",
  },
  {
    id: "4",
    title: "Money Heist",
    image: "https://image.tmdb.org/t/p/w500/mo6vQgGHywQmbm5tyN6hL9iR7df.jpg",
  }
];

const StackCarousel = () => {
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
        data={movies}
        scrollAnimationDuration={1000}
        onProgressChange={progress}
        onSnapToItem={(index) => setActiveIndex(index)}
        width={screenWidth}
        height={screenWidth/2}
        pagingEnabled
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
        )}
      />
      <Pagination.Basic
        progress={progress}
        data={movies}
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
    backgroundColor: "#fff",
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

export default StackCarousel;
