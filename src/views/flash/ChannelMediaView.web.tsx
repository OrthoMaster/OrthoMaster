import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchMedias } from "../../services/FlashMediasService";
import { fetchPastEvents } from "../../services/EventsService";
import { IContent } from "../../utils/interfaces";
import SimpleCarousel from "../../component/carousel/SimpleContentCarousel";

import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

interface ReadMoreButtonProps {
  value: string;
  onClick: () => void;
}

const ReadMoreButton: React.FC<ReadMoreButtonProps> = ({ value, onClick }) => {
  return (
    <TouchableOpacity style={styles.readMoreBtn} onPress={onClick}>
      <Text style={styles.readMoreBtnText}>{value}</Text>
    </TouchableOpacity>
  );
};

interface ReadMoreProps {
  children: React.ReactNode;
  numberOfLines: number;
}

const ReadMore: React.FC<ReadMoreProps> = ({ children, numberOfLines }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <View style={styles.readMoreContainer}>
      <Text
        style={styles.description}
        numberOfLines={isExpanded ? undefined : numberOfLines}
      >
        {children}
      </Text>
      <ReadMoreButton
        value={isExpanded ? "Voir moins" : "Lire la suite"}
        onClick={() => setIsExpanded(!isExpanded)}
      />
    </View>
  );
};

// Component Carousel
interface CarouselWithArrowsProps {
  data: IContent[];
  nbElement2Display: number;
  onSelect: (content: IContent) => void;
}

const CarouselWithArrows: React.FC<CarouselWithArrowsProps> = ({
  data,
  nbElement2Display,
  onSelect
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const itemWidth = containerWidth / nbElement2Display;
  const maxScroll = Math.max(0, contentWidth - containerWidth);
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - itemWidth);
    scrollViewRef.current?.scrollTo({ x: newPosition, animated: true });
    setScrollPosition(newPosition);
  };

  const scrollRight = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + itemWidth);
    scrollViewRef.current?.scrollTo({ x: newPosition, animated: true });
    setScrollPosition(newPosition);
  };

  return (
    <View style={styles.carouselContainer}>
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
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
        onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        style={{ marginHorizontal: Spacings.md }}
      >
        <SimpleCarousel
          data={data}
          nbElement2Display={nbElement2Display}
          onSelect={onSelect}
        />
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
  );
};

export interface ChannelMediaViewParams {
  logoUrl: string;
  name: string;
  description: string;
  targetId: number;
  website: string;
}

interface PastEvent {
  id: number;
  edition_year: string;
}

const ChannelMediaView = ({ navigation, route }) => {
  const channelParams = route.params;

  const { data: allMediaFromChannel, isLoading: isLoadingMedia, error: errorMedia } = useQuery({
    queryKey: ['medias-channel'],
    queryFn: () => fetchMedias({ event: channelParams.targetId }),
  });

  const { data: pastEvents, isLoading: isLoadingPastEvent, error: errorPastEvent } = useQuery({
    queryKey: ['past-events'],
    queryFn: () => fetchPastEvents({ eventID: channelParams.targetId }),
  });

  const [eventCarousels, setEventCarousels] = useState<React.ReactNode[]>([]);

  const getEventCarousels = async (): Promise<void> => {
    if (!pastEvents || !allMediaFromChannel) return;

    let carousels: React.ReactNode[] = [];
    for (const pastEventsElem of pastEvents) {
      let contents = allMediaFromChannel.filter(
        (ct: IContent) => ct.id_past_event === pastEventsElem.id
      );

      carousels.push(
        <View key={pastEventsElem.id} style={styles.carouselSection}>
          <View style={styles.carouselTitleContainer}>
            <Text style={styles.carouselTitle}>{pastEventsElem.edition_year}</Text>
          </View>
          <View style={styles.carouselWrapper}>
            <CarouselWithArrows
              data={contents}
              nbElement2Display={2}
              onSelect={(content: IContent) => {
                navigation.push("flash-media-preview", {
                  media: content
                });
              }}
            />
          </View>
        </View>
      );
    }
    setEventCarousels(carousels);
  };

  useEffect(() => {
    if (allMediaFromChannel && pastEvents) {
      getEventCarousels();
    }
  }, [allMediaFromChannel, pastEvents]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: process.env.EXPO_PUBLIC_S3_URL + channelParams.image }}
            style={styles.logo}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{channelParams.name}</Text>
          {channelParams.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(channelParams.website)}
            >
              <Text style={styles.websiteLink}>
                Site web: {channelParams.website}
              </Text>
            </TouchableOpacity>
          )}

          {channelParams.description && (
            <ReadMore numberOfLines={4}>
              {channelParams.description}
            </ReadMore>
          )}
        </View>
      </View>

      <ScrollView style={styles.carouselsContainer}>
        {eventCarousels}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    paddingVertical: Spacings.lg
  },
  backButton: {
    position: 'absolute',
    top: Spacings.lg,
    right: Spacings.lg,
    width: 50,
    height: 50,
    backgroundColor: Colors.red,
    opacity: 0.7,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    gap: Spacings.lg,
    padding: Spacings.lg,
    marginBottom: Spacings.xxl,
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexShrink: 0,
  },
  logo: {
    width: 200,
    height: 200,
    backgroundColor: Colors.grayLight,
    borderRadius: 16,
    resizeMode: 'cover'
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  description: {
    fontSize: 16,
    textAlign: 'justify',
    color: Colors.subtext2,
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  websiteLink: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  readMoreContainer: {
    marginTop: Spacings.md,
    alignItems: 'flex-end',
  },
  readMoreBtn: {
    padding: 5,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  readMoreBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium'
  },
  carouselsContainer: {
  },
  carouselSection: {
    marginBottom: Spacings.lg,
  },

  carouselTitleContainer: {
    alignSelf: 'flex-start',
    marginBottom: Spacings.md,
  },
  carouselTitle: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    backgroundColor: Colors.red,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.xs,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  carouselWrapper: {
    width: '100%',
    minHeight: 170,
  },

  carouselContainer: {
    position: 'relative',
    width: '100%',
  },
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
  },
  leftArrow: {
    left: Spacings.sm,
  },
  rightArrow: {
    right: Spacings.sm,
  },
  arrowText: {
    fontSize: 25,
    color: Colors.white,
    fontWeight: 'bold',
    lineHeight: 25,
  },
});

export default ChannelMediaView;