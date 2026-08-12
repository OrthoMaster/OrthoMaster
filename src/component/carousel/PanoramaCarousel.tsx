import React, { useState } from "react";
import { View, Text, Image, Dimensions, StyleSheet, TouchableOpacity, Platform } from "react-native";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
const { width: screenWidth } = Dimensions.get("window");
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const Card = ({ data, onPress }) => {
  return <TouchableOpacity style={styles.card}
    onPress={onPress}
  >
    <Image source={{ uri: data.thumbnail }} style={styles.image} />
    <LinearGradient colors={["transparent", 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }}
    />
    <View style={{
      position: 'absolute',
      bottom: isTablet ? Spacings.lg : Spacings.md,
      left: isTablet ? Spacings.lg : Spacings.md,
      width: '70%'
    }}>
      <Text style={{ color: Colors.primary, fontFamily: 'Roboto', fontWeight: '500', fontSize: isTablet ? 18 : 16, textAlign: 'left' }}>{data.expert_names ? data.expert_names : 'OrthoMaster'}</Text>
      <Text style={{ color: Colors.white, fontFamily: 'Poppins-Medium', fontSize: isTablet ? 24 : 18, textAlign: 'left' }}>{data.title}</Text>
      <Text style={{ color: Colors.subtext, fontFamily: 'Roboto', fontSize: isTablet ? 15 : 13, textAlign: 'left', marginTop: Spacings.xs }}>{data.duration}</Text>
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
