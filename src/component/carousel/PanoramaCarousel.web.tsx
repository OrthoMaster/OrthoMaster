import React, { useState, useRef, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";

import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

// Responsive breakpoint
const BREAKPOINT_LARGE = 1440;

const Card = ({ data, isCenter, onPress, isVisible = true, screenWidth, screenHeight, isShowThreeCards }) => {
  const CENTER_CARD_HEIGHT = screenHeight * 0.6;
  const CENTER_CARD_WIDTH = CENTER_CARD_HEIGHT * 16 / 9;
  const SIDE_CARD_WIDTH = CENTER_CARD_WIDTH * 0.7;
  const SIDE_CARD_HEIGHT = SIDE_CARD_WIDTH * 9 / 16;

  const cardWidth = isCenter ? CENTER_CARD_WIDTH : SIDE_CARD_WIDTH;
  const cardHeight = isCenter ? CENTER_CARD_HEIGHT : SIDE_CARD_HEIGHT;

  if (!isVisible) return null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          opacity: isCenter ? 1 : 0.5,
          transform: [{ scale: isCenter ? 1 : 0.85 }],
        }
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: data.thumbnail }} style={styles.image} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"]}
        style={styles.gradient}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.authorText, { fontSize: isCenter ? 20 : 14 }]}>
          <Text style={styles.authorName}>{data.expert_names ? data.expert_names : 'OrthoMaster'}</Text>
        </Text>
        <Text style={[styles.title, { fontSize: isCenter ? 30 : 16 }]} numberOfLines={2}>
          {data.title}
        </Text>
        <Text style={[styles.meta, { fontSize: isCenter ? 16 : 12 }]}>{data.duration}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PanoramaCarousel = ({ data, onSelect, initialIndex = 0 }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isScrolling, setIsScrolling] = useState(false);

  // Track screen dimensions
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height
      });
    });

    return () => subscription?.remove();
  }, []);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height - 100;

  // Determine if we show 3 cards or just 1
  const showThreeCards = screenWidth >= BREAKPOINT_LARGE;

  // Card sizes based on current dimensions
  const CENTER_CARD_HEIGHT = screenHeight * 0.6;
  const CENTER_CARD_WIDTH = CENTER_CARD_HEIGHT * 16 / 9;
  const SIDE_CARD_WIDTH = CENTER_CARD_WIDTH * 0.65;
  const CARD_SPACING = 40;

  const getInfiniteData = () => {
    return [
      data[data.length - 1],
      ...data,
      data[0],
      data[1],
      data[2]
    ];
  };

  const infiniteData = getInfiniteData();
  const offset = 2;

  const centerCardIndex = currentIndex + 1;

  // Calculate scroll position
  const getScrollPosition = (targetIndex: number) => {
    let scrollX = 0;

    // Calculate cumulative width up to target
    for (let i = 0; i < targetIndex; i++) {
      scrollX += SIDE_CARD_WIDTH + CARD_SPACING;
    }

    // Center the center card
    scrollX = scrollX - ((screenWidth - 200) / 2) + (CENTER_CARD_WIDTH / 2);

    return Math.max(0, scrollX);
  };

  // Scroll to index
  const scrollToIndex = (index: number, animated: boolean = true) => {
    if (!scrollViewRef.current || !infiniteData || infiniteData.length === 0) return;

    const scrollX = getScrollPosition(index);
    scrollViewRef.current.scrollTo({ x: scrollX, animated });
  };

  // Handle navigation
  const goToPrevious = () => {
    if (isScrolling) return;
    setIsScrolling(true);

    const newDisplayIndex = currentIndex - 1;

    scrollToIndex(offset + newDisplayIndex, true);
    setCurrentIndex(newDisplayIndex);

    setTimeout(() => {
      if (newDisplayIndex < 0) {
        const jumpIndex = data.length - 1;
        setCurrentIndex(jumpIndex);
        scrollToIndex(offset + jumpIndex, false);
      }
      setIsScrolling(false);
    }, 300);
  };

  const goToNext = () => {
    if (isScrolling) return;
    setIsScrolling(true);

    const newDisplayIndex = currentIndex + 1;

    scrollToIndex(offset + newDisplayIndex, true);
    setCurrentIndex(newDisplayIndex);

    setTimeout(() => {
      if (newDisplayIndex >= data.length) {
        const jumpIndex = 0;
        setCurrentIndex(jumpIndex);
        scrollToIndex(offset + jumpIndex, false);
      }
      setIsScrolling(false);
    }, 300);
  };

  // Initial center scroll - rerun when dimensions change
  useEffect(() => {
    if (infiniteData && infiniteData.length > 0) {
      setTimeout(() => {
        scrollToIndex(offset + currentIndex, false);
      }, 100);
    }
  }, [infiniteData.length, dimensions.width]);

  if (!data || data.length === 0) return null;

  const getRealIndex = (idx: number) => {
    return ((idx % data.length) + data.length) % data.length;
  };

  // Determine if card should be visible
  const isCardVisible = (index: number) => {
    if (showThreeCards) {
      return true; // Show all cards
    } else {
      return index === centerCardIndex; // Only show center card
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.carouselWrapper, {
        width: screenWidth - 200,
        height: CENTER_CARD_HEIGHT + 60
      }]}>
        {/* Left Arrow - only show when displaying 3 cards */}
        <TouchableOpacity
          style={[styles.arrowButton, styles.leftArrow]}
          onPress={goToPrevious}
          disabled={isScrolling}
        >
          <Ionicons name="chevron-back" size={30} color={Colors.white} />
        </TouchableOpacity>

        {/* Carousel */}
        <View style={styles.scrollContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={[
              styles.scrollViewContent,
              showThreeCards
              ? { paddingHorizontal: (screenWidth - 200) / 2 - SIDE_CARD_WIDTH / 2 }
              : { paddingLeft:  0}
            ]}
            style={[styles.scrollView, {width: screenWidth - 200}]}
          >
            {infiniteData.map((item, index) => {
              const isCenter = index === centerCardIndex;
              const isVisible = isCardVisible(index);

              return (
                <View
                  key={`${item.id_content}-${index}`}
                  style={[
                    styles.cardWrapper,
                    isVisible && {
                      marginHorizontal: CARD_SPACING / 2,
                      height: CENTER_CARD_HEIGHT,
                    }
                  ]}
                >
                  <Card
                    onPress={() => {
                      if (isCenter) {
                        onSelect(item);
                      } else if (!isScrolling && showThreeCards) {
                        if (index === centerCardIndex + 1) {
                          goToNext();
                        } else if (index === centerCardIndex - 1) {
                          goToPrevious();
                        }
                      }
                    }}
                    isShowThreeCards={showThreeCards}
                    data={item}
                    isCenter={isCenter}
                    isVisible={isVisible}
                    screenWidth={screenWidth - 200}
                    screenHeight={screenHeight}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Arrow - only show when displaying 3 cards */}
        <TouchableOpacity
          style={[styles.arrowButton, styles.rightArrow]}
          onPress={goToNext}
          disabled={isScrolling}
        >
          <Ionicons name="chevron-forward" size={30} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Indicator dots */}
      <View style={styles.indicatorContainer}>
        {data.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (!isScrolling) {
                setCurrentIndex(index);
                scrollToIndex(offset + index, true);
              }
            }}
            style={[
              styles.indicator,
              getRealIndex(currentIndex) === index && styles.indicatorActive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Spacings.md,
    backgroundColor: 'transparent',
  },
  carouselWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  cardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    bottom: Spacings.lg,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: Spacings.lg,
  },
  title: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    fontWeight: "bold",
    textAlign: 'left',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  authorText: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  authorName: {
    color: Colors.primary,
    fontFamily: 'Roboto',
    fontWeight: '500'
  },
  meta: {
    color: Colors.subtext,
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -40 }],
    width: 80,
    height: 80,
    backgroundColor: Colors.red,
    opacity: 0.8,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  leftArrow: {
    left: -40,
    paddingLeft: 20,
  },
  rightArrow: {
    right: -40,
    paddingRight: 20,
  },
  arrowText: {
    fontSize: 56,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 56,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacings.md,
    gap: 12,
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicatorActive: {
    width: 42,
    backgroundColor: '#ffaf31',
  },
});

export default PanoramaCarousel;