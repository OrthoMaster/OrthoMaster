import React, { useState, useEffect, useRef } from "react";
import { Platform, View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../services/S3Service";

import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const CARD_WIDTH = 300;
const CARD_MARGIN = 20;

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
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{ uri: data.thumbnail }}
          style={[styles.image, {
            width: imgDimensions.width,
            height: imgDimensions.height
          }]}
        />
        {!!data.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{data.duration}</Text>
          </View>
        )}
      </View>

      <Text style={styles.authorText}>{data.expert_names ? data.expert_names : 'OrthoMaster'}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {data.title}
      </Text>
    </TouchableOpacity>
  )
}

const SimpleCarousel = ({ data, onSelect }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Tính toán scroll
  const scrollDistance = CARD_WIDTH + CARD_MARGIN;
  const maxScroll = Math.max(0, contentWidth - containerWidth);
  const canScrollLeft = scrollPosition > 5;
  const canScrollRight = scrollPosition < maxScroll - 5;

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - scrollDistance);
    scrollViewRef.current?.scrollTo({ x: newPosition, animated: true });
  };

  const scrollRight = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + scrollDistance);
    scrollViewRef.current?.scrollTo({ x: newPosition, animated: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.carouselWrapper}>
        {canScrollLeft && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.leftArrow]}
            onPress={scrollLeft}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          onContentSizeChange={(width) => setContentWidth(width)}
          onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
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

        {canScrollRight && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.rightArrow]}
            onPress={scrollRight}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    paddingLeft: Spacings.md,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.md,
  },
  carouselWrapper: {
    position: 'relative',
    flex: 1,
  },
  scrollViewContent: {
  },
  scrollView: {
    paddingBottom: Spacings.md,
  },
  card: {
    width: CARD_WIDTH,
    height: 240,
    marginRight: CARD_MARGIN,
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
    marginTop: Spacings.sm,
    color: Colors.primary,
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 12
  },
  // Arrow styles
  arrowButton: {
    position: 'absolute',
    top: '30%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    backgroundColor: Colors.red,
    opacity: 0.9,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } as any),
  },
  leftArrow: {
    left: Spacings.sm,
  },
  rightArrow: {
    right: Spacings.md,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  durationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: Colors.white,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
});

export default SimpleCarousel;