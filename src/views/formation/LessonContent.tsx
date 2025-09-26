/**
 * @author Francis
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

import { useQuery } from "@tanstack/react-query";
import { getLessonContent } from "../../services/LessonService";
import ParagraphBlock from "./components/ParagraphBlock";
import ImageBlock from "./components/ImageBlock";
import QuizSelectBlock from "./components/QuizSelectBlock";

const HEADER_HEIGHT = 120;
const SCROLL_THRESHOLD = 5;

// TypeScript interfaces
interface Block {
  id: string;
  type: string;
  data: any;
  tunes?: any;
}

interface RouteParams {
  lessonTitle: string;
  formationName: string;
}

type ScrollDirection = 'up' | 'down' | null;

export const LessonContent = ({ navigation, route }) => {
  const LIMIT = 10;
  const { lessonTitle, formationName } = route.params;

  // State management for pagination
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1]));

  // Handle scrolls
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 3, HEADER_HEIGHT],
    outputRange: [0.9, 0.95, 1],
    extrapolate: 'clamp',
  });

  // Handle scroll direction changes
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      const diff = value - lastScrollY;
      // Fix scroll down to reload of scroll view
      if (value <= 0) {
        setScrollDirection('up');
      }

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (newDirection !== scrollDirection) {
          setScrollDirection(newDirection);
          animateHeader(newDirection, value);
        }
        setLastScrollY(value);
      }
    });

    return () => scrollY.removeListener(listenerId);
  }, [lastScrollY, scrollDirection, scrollY]);

  const animateHeader = (direction: ScrollDirection, scrollValue: number): void => {
    const shouldHideHeader = direction === 'down' && scrollValue > 20;
    const toValue = shouldHideHeader ? -HEADER_HEIGHT : 0;
    const opacityValue = shouldHideHeader ? 0.3 : 1;
    const scaleValue = shouldHideHeader ? 0.95 : 1;

    Animated.parallel([
      Animated.spring(headerTranslateY, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(headerOpacity, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: scaleValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  // Get first data
  const lessonId = 1;
  const { data, isLoading, error } = useQuery({
    queryKey: ['lessonContent', lessonId, 1, 5],
    queryFn: () => getLessonContent({
      id: lessonId,
      page: 1,
      limit: LIMIT
    }),
    enabled: !!lessonId,
  });

  // Handle successful data load
  useEffect(() => {
    if (data?.success) {
      setAllBlocks(data.content.blocks);
      setHasMore(data.pagination.hasMore);
      setCurrentPage(2); // Next page to load
    }
  }, [data]);

  // Load more function
  const loadMore = async (): Promise<void> => {
    if (loadingMore || !hasMore || loadedPages.has(currentPage)) {
      return;
    }

    try {
      setLoadingMore(true);
      const result = await getLessonContent({
        id: lessonId,
        page: currentPage,
        limit: LIMIT
      });

      if (result?.success) {
        setAllBlocks(prev => [...prev, ...result.content.blocks]);
        setHasMore(result.pagination.hasMore);
        setLoadedPages(prev => new Set([...prev, currentPage]));
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more content:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Block renderer function
  const renderBlock = (block: Block, index: number) => {
    // Heading
    if (block.type === 'header' && block.data.text) {
      return <View key={`${block.id}_${index}`} style={blockStyles.headerBlock}>
        <Text style={blockStyles[`heading${block.data.level}`]}>{block.data.text}</Text>
      </View>
    }

    // Paragraph
    if (block.type === 'paragraph' && block.data.text) {
      // Text
      if (!block.tunes.textVariant || block.tunes.textVariant === '') {
        return <View key={`${block.id}_${index}`} style={blockStyles.paragraphBlock}>
          <ParagraphBlock style={blockStyles.paragraph} htmlContent={block.data.text} />
        </View>
      }

      // Call-out / In Box
      if (block.tunes.textVariant === 'call-out') {
        return <View key={`${block.id}_${index}`} style={blockStyles.calloutBlock}>
          <ParagraphBlock style={blockStyles.calloutText} htmlContent={block.data.text} />
        </View>
      }
    }

    // Image
    if (block.type === 'image') {
      return <View key={`${block.id}_${index}`} style={blockStyles.imageBlock}>
        <ImageBlock
          source={block.data.file.url}
          fullWidth={block.data.withBackground === false}
          title={block.data.caption} />
      </View>
    }

    // Quiz - type: select
    if (block.type === 'quizSelect') {
      return <View key={`${block.id}_${index}`}>
        <QuizSelectBlock multiSelect={block.data.multiSelect}
          question={block.data.question}
          answers={block.data.answers}
          correctAnswers={block.data.correctAnswers}
        />
      </View>
    }

    return (
      <View key={`${block.id}_${index}`} style={styles.blockContainer}>
        <Text style={styles.blockText}>
          Block ID: {block.id} (Type: {block.type})
        </Text>
      </View>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const paddingToBottom = 100;

        // Check if user scrolled near bottom
        if (contentOffset.y + layoutMeasurement.height + paddingToBottom >= contentSize.height) {
          loadMore();
        }
      }
    }
  );

  // Handle close modal
  const closeScreen = (): void => {
    navigation.goBack();
  };

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.grayLight} />
      </View>
    );
  };

  // Show loading for initial load
  if (isLoading) {
    return (
      <SafeAreaView style={[Styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải nội dung...</Text>
      </SafeAreaView>
    );
  }

  // Show error
  if (error) {
    return (
      <SafeAreaView style={[Styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Có lỗi xảy ra khi tải nội dung</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={Styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Enhanced Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: Colors.white,
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ],
            opacity: Animated.multiply(headerOpacity, headerBackgroundOpacity),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={closeScreen}>
            <Feather name="chevron-left" size={24} color={Colors.text}></Feather>
          </TouchableOpacity>
          <View>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.headerSubTitle}>
              {formationName}
            </Text>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.headerTitle}>
              {lessonTitle}
            </Text>
          </View>
        </View>

        {/* Header bottom border with animation */}
        <Animated.View
          style={[
            styles.headerBorder,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 80, 120],
                outputRange: [0, 0.5, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Render all blocks */}
        {allBlocks.map((block: Block, index: number) => renderBlock(block, index))}

        {/* Loading footer */}
        {renderFooter()}

        {/* End indicator */}
        {!hasMore && allBlocks.length > 0 && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>Đã hiển thị hết nội dung</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const blockStyles = StyleSheet.create({
  headerBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.md,
    marginTop: Spacings.lg,
  },
  heading1: {
    fontSize: 26,
    fontWeight: '500',
    color: Colors.text,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.text,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.text,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
  },
  paragraphBlock: {
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.md,
  },
  paragraph: {
    textAlign: 'justify',
    fontSize: 14,
    color: Colors.text,
  },
  calloutBlock: {
    marginTop: Spacings.xs,
    marginBottom: Spacings.lg,
    padding: Spacings.lg,
    backgroundColor: Colors.black
  },
  calloutText: {
    textAlign: 'justify',
    fontSize: 14,
    color: Colors.white,
  },
  imageBlock: {
    marginBottom: Spacings.lg,
  },
})

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: Colors.gray,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    height: HEADER_HEIGHT
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xxxl,
    paddingBottom: Spacings.md,
  },
  headerSubTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    textAlign: 'right',
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '600',
    textAlign: 'right',
    color: Colors.text,
  },
  headerBorder: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: HEADER_HEIGHT - Spacings.xxl,
    paddingBottom: Spacings.lg,
    // paddingHorizontal: Spacings.lg,
  },

  // Block styles
  blockContainer: {

  },
  blockText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Roboto',
    height: 200
  },

  // Loading and error styles
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: Spacings.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacings.sm,
    fontSize: 14,
    color: Colors.subtext,
    fontFamily: 'Roboto',
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  endContainer: {
    paddingVertical: Spacings.lg,
    alignItems: 'center',
  },
  endText: {
    fontSize: 14,
    color: Colors.subtext,
  },
});