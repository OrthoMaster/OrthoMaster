import React, { useState, useEffect } from "react";
import { Platform, View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../services/S3Service";

const CARD_WIDTH = 300;

const Card = ({ data, onSelect }) => {
  // Global CSS Scroll bar
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'global-scrollbar-styles';

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
        /* Scrollbar thin và neutral cho cả light/dark mode */
        ::-webkit-scrollbar {
          width: 8px;  /* Scrollbar dọc */
          height: 8px; /* Scrollbar ngang */
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(128, 128, 128, 0.1); /* Gray nhạt, trong suốt */
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(128, 128, 128, 0.4); /* Gray trung bình */
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(128, 128, 128, 0.6); /* Đậm hơn khi hover */
          background-clip: padding-box;
        }
        
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(128, 128, 128, 0.4) rgba(128, 128, 128, 0.1);
        }
      `;
        document.head.appendChild(style);
      }
    }
  }, []);


  const imageUrl = useQuery({
    queryKey: ['contentThumbnail', data.id_content, data.title],
    queryFn: () => getS3Image(`${data.s3_path}/${data.title}/logo.png`)
  })

  const [imgDimensions, setImgDimensions] = useState({
    width: CARD_WIDTH,
    height: CARD_WIDTH * (9 / 16)
  })

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onSelect}
      onLayout={(event: LayoutChangeEvent) => {
        setImgDimensions({
          width: CARD_WIDTH,
          height: CARD_WIDTH * (9 / 16)
        })
      }}
    >
      <Image
        source={{ uri: imageUrl.data }}
        style={[styles.image, {
          width: imgDimensions.width,
          height: imgDimensions.height
        }]}
      />

      <Text style={styles.authorText}>{data.author}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {data.title}
      </Text>
    </TouchableOpacity>
  )
}

const SimpleCarousel = ({ data, onSelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}
        {...(Platform.OS === 'web' && { className: 'dark-scrollbar' } as any)}
      >
        {data.map((item, index) => (
          <Card
            key={index}
            data={item}
            onSelect={() => onSelect(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: '100%',
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 50,
  },
  scrollViewContent: {
  },
  scrollView: {
    paddingBottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: 220,
    marginRight: 20,
    borderRadius: 5,
    alignItems: "flex-start",
    justifyContent: 'flex-start',
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 5,
    backgroundColor: '#000'
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontFamily: 'Poppins-Medium'
  },
  authorText: {
    marginTop: 15,
    color: "#ffaf31",
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 12
  }
});

export default SimpleCarousel;