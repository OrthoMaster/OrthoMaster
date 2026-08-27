import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { orthomasterShare } from "../../futils";

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SourceVideoCard from '../podcast/components/SourceVideoCard';

import { addTopic, sendError } from '../../services/v2/AuthService';
import { getInfographicById } from '../../services/v2/ContentService';

const { width, height } = Dimensions.get('window');

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_DELAY = 280;

export const InfographicView = ({ navigation, route }) => {
  const infographicId = route.params?.infographicId ?? null;

  const {
    data,
    isLoading: isLoadingInfographic,
    isError: isErrorInfographic,
    refetch: refetchInfographic,
  } = useQuery({
    queryKey: ['infographic', String(infographicId)],
    queryFn: () => getInfographicById(infographicId),
    enabled: !!infographicId,
    retry: 2,
    retryDelay: 2000,
  });

  const infographic = data?.infographic ?? null;
  const hasTopic = !!data?.has_topic;

  const imageUrl = infographic?.image ?? null;
  const title = infographic?.title ?? '';
  const topic = infographic?.topic ?? null;
  const video = infographic?.content ?? null;

  const queryClient = useQueryClient();

  const [liked, setLiked] = useState<boolean>(!!data?.has_like);
  const [subscribed, setSubscribed] = useState<boolean>(hasTopic);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Đồng bộ lại state khi data về từ API (case deeplink)
  useEffect(() => {
    setSubscribed(hasTopic);
  }, [hasTopic]);

  useEffect(() => {
    setLiked(!!data?.has_like);
  }, [data?.has_like]);

  /* ------------------------------------------------------------------ */
  /* Kích thước ảnh hiển thị (để giới hạn vùng kéo khi đã zoom)          */
  /*                                                                     */
  /* Giữ song song state + ref: PanResponder được tạo 1 lần nên closure  */
  /* của nó chỉ thấy giá trị lần render đầu. Ref cho nó đọc giá trị mới. */
  /* ------------------------------------------------------------------ */

  const [containerSize, setContainerSize] = useState({ w: width, h: height });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });

  const containerSizeRef = useRef({ w: width, h: height });
  const imageSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!imageUrl) return;

    let isActive = true;
    Image.getSize(
      imageUrl,
      (w, h) => {
        if (!isActive) return;
        imageSizeRef.current = { w, h };
        setImageSize({ w, h });
      },
      (error) => sendError('infographic-view', error)
    );

    return () => {
      isActive = false;
    };
  }, [imageUrl]);

  /** Kích thước thật của ảnh sau khi fit vào container (resizeMode contain) */
  const getDisplaySize = () => {
    const { w: cw, h: ch } = containerSizeRef.current;
    const img = imageSizeRef.current;

    if (!img.w || !img.h || !cw || !ch) return { w: cw, h: ch };

    const ratio = Math.min(cw / img.w, ch / img.h);
    return { w: img.w * ratio, h: img.h * ratio };
  };

  /** Giới hạn kéo: không cho ảnh rời khỏi khung */
  const clampTranslate = (x: number, y: number, currentScale: number) => {
    const display = getDisplaySize();
    const { w: cw, h: ch } = containerSizeRef.current;

    const maxX = Math.max(0, (display.w * currentScale - cw) / 2);
    const maxY = Math.max(0, (display.h * currentScale - ch) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  /* ------------------------------------------------------------------ */
  /* Gesture: pinch để zoom, kéo để di chuyển, double tap để reset       */
  /* ------------------------------------------------------------------ */

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Giá trị JS song song với Animated.Value, dùng để tính toán trong gesture
  const scaleRef = useRef(1);
  const lastScaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastTranslateRef = useRef({ x: 0, y: 0 });

  const pinchStartDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  const [isZoomed, setIsZoomed] = useState(false);

  const controlsAnim = useRef(new Animated.Value(1)).current;

  /** Mờ header + bottom bar khi đang zoom để không che ảnh */
  useEffect(() => {
    Animated.timing(controlsAnim, {
      toValue: isZoomed ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isZoomed]);

  const getDistance = (touches: any[]) => {
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const applyScale = (value: number) => {
    scaleRef.current = value;
    scale.setValue(value);
  };

  const applyTranslate = (x: number, y: number) => {
    translateRef.current = { x, y };
    translateX.setValue(x);
    translateY.setValue(y);
  };

  const resetZoom = () => {
    lastScaleRef.current = 1;
    lastTranslateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    setIsZoomed(false);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 9 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 70, friction: 9 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 9 }),
    ]).start();
  };

  const zoomTo = (value: number) => {
    lastScaleRef.current = value;
    scaleRef.current = value;
    setIsZoomed(value > MIN_SCALE);

    const clamped = clampTranslate(translateRef.current.x, translateRef.current.y, value);
    lastTranslateRef.current = clamped;
    translateRef.current = clamped;

    Animated.parallel([
      Animated.spring(scale, { toValue: value, useNativeDriver: true, tension: 70, friction: 9 }),
      Animated.spring(translateX, { toValue: clamped.x, useNativeDriver: true, tension: 70, friction: 9 }),
      Animated.spring(translateY, { toValue: clamped.y, useNativeDriver: true, tension: 70, friction: 9 }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Chỉ chiếm gesture khi có 2 ngón (pinch) hoặc ảnh đang zoom (pan)
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches?.length ?? 0;
        if (touches > 1) return true;
        return scaleRef.current > MIN_SCALE && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2);
      },

      onPanResponderGrant: () => {
        pinchStartDistanceRef.current = null;
        lastTranslateRef.current = { ...translateRef.current };
        lastScaleRef.current = scaleRef.current;

        // Double tap
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          lastTapRef.current = 0;
          if (scaleRef.current > MIN_SCALE) {
            resetZoom();
          } else {
            zoomTo(2.5);
          }
          return;
        }
        lastTapRef.current = now;
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches ?? [];

        // Pinch
        if (touches.length >= 2) {
          const distance = getDistance(touches);

          if (pinchStartDistanceRef.current === null) {
            pinchStartDistanceRef.current = distance;
            return;
          }

          const next = Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, lastScaleRef.current * (distance / pinchStartDistanceRef.current))
          );
          applyScale(next);

          const clamped = clampTranslate(
            lastTranslateRef.current.x,
            lastTranslateRef.current.y,
            next
          );
          applyTranslate(clamped.x, clamped.y);
          return;
        }

        // Pan (chỉ khi đã zoom)
        if (scaleRef.current > MIN_SCALE) {
          const clamped = clampTranslate(
            lastTranslateRef.current.x + gestureState.dx,
            lastTranslateRef.current.y + gestureState.dy,
            scaleRef.current
          );
          applyTranslate(clamped.x, clamped.y);
        }
      },

      onPanResponderRelease: () => {
        pinchStartDistanceRef.current = null;

        if (scaleRef.current <= MIN_SCALE + 0.02) {
          resetZoom();
          return;
        }

        lastScaleRef.current = scaleRef.current;
        lastTranslateRef.current = { ...translateRef.current };
        setIsZoomed(true);
      },

      onPanResponderTerminate: () => {
        pinchStartDistanceRef.current = null;
        lastScaleRef.current = scaleRef.current;
        lastTranslateRef.current = { ...translateRef.current };
      },
    })
  ).current;

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */

  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toastMessage) return;

    toastTranslateY.setValue(-100);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(toastTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToastMessage(null));
    }, 2500);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  /* ------------------------------------------------------------------ */
  /* Nav                                                                 */
  /* ------------------------------------------------------------------ */

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  /**
   * Deeplink: stack có thể rỗng -> goBack() sẽ thoát app.
   * Fallback về home cho chắc.
   */
  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'home' }],
      })
    );
  };

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  const handleDownload = async () => {
    if (!imageUrl || isDownloading) return;

    setIsDownloading(true);

    try {
      await Share.share({
        message: title ? `${title}\n${imageUrl}` : imageUrl,
        url: imageUrl, // iOS
      });
    } catch (error) {
      sendError('infographic-view', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    if (!infographic) return;

    const contentId = infographic.id;

    orthomasterShare(
      {
        title,
        message:
          "Voici un contenu intéressant à voir sur OrthoMaster :\n\n" +
          title +
          "\n\n" +
          "https://go.orthomaster.fr/open/infographic/" +
          contentId,
      },
      "infographie",
      contentId
    );
  };

  const handleSubscribeTopic = async () => {
    if (!topic || subscribed) return;

    setSubscribed(true);
    setToastMessage(`Vous suivez le sujet ${topic.name}`);

    try {
      await addTopic(topic.id);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    } catch (error) {
      setSubscribed(false);
      sendError('infographic-view', error);
    }
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);

    try {
      // TODO: brancher l'API ici, ex: await likeInfographic(infographic.id, next)
    } catch (error) {
      setLiked(!next);
      sendError('infographic-view', error);
    }
  };

  const handleOpenSourceVideo = () => {
    if (!video?.id_content) return;
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: { media: video },
    });
  };

  /* ------------------------------------------------------------------ */
  /* States                                                              */
  /* ------------------------------------------------------------------ */

  if (isLoadingInfographic) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!infographic) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <Ionicons name="close" size={30} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="image-outline" size={70} color={Colors.subtext2} />
          <Text style={styles.emptyText}>Cette infographie n'est plus disponible.</Text>
          {isErrorInfographic && (
            <TouchableOpacity onPress={() => refetchInfographic()} style={styles.retryButton}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />

      {/* Ảnh + gesture: chiếm toàn màn hình, header và bottom bar nổi lên trên */}
      <View
        style={styles.imageContainer}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          containerSizeRef.current = { w, h };
          setContainerSize({ w, h });
        }}
        {...panResponder.panHandlers}
      >
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            resizeMode="contain"
            style={[
              styles.image,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
              },
            ]}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={80} color={Colors.subtext2} />
          </View>
        )}
      </View>

      {/* Header: close bên trái, title + topic canh giữa */}
      <Animated.View style={[styles.headerLayer, { opacity: controlsAnim }]} pointerEvents="box-none">
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none">
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons name="close" size={30} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTexts} pointerEvents="none">
              {!!title && (
                <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
              )}

              {!!topic?.name && (
                <View style={styles.topicBadge}>
                  <Text style={styles.topicText} numberOfLines={1}>{topic.name}</Text>
                </View>
              )}
            </View>

            {/* Slot phải: giữ title canh giữa thật sự */}
            {isZoomed ? (
              <TouchableOpacity onPress={resetZoom} style={styles.iconButton}>
                <Ionicons name="contract-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Toast */}
      {!!toastMessage && (
        <SafeAreaView style={styles.toastLayer} edges={['top']} pointerEvents="none">
          <Animated.View
            style={[
              styles.toastContainer,
              {
                transform: [{ translateY: toastTranslateY }],
                opacity: toastOpacity,
              },
            ]}
          >
            <Ionicons name="notifications" size={20} color={Colors.primary} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        </SafeAreaView>
      )}

      {/* Bottom actions: trong suốt, mờ dần khi zoom */}
      <Animated.View
        style={[styles.bottomLayer, { opacity: controlsAnim }]}
        pointerEvents={isZoomed ? 'none' : 'box-none'}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <View style={styles.bottomContent}>
            <SourceVideoCard video={video} onPress={handleOpenSourceVideo} />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleDownload}
                disabled={isDownloading}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Télécharger l'image"
              >
                <View style={styles.actionIconWrap}>
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="download-outline" size={22} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.actionLabel}>Télécharger</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Partager"
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                </View>
                <Text style={styles.actionLabel}>Partager</Text>
              </TouchableOpacity>

              {!!topic && (
                <TouchableOpacity
                  onPress={handleSubscribeTopic}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    subscribed
                      ? `Vous suivez le sujet ${topic.name}`
                      : `Suivre le sujet ${topic.name}`
                  }
                >
                  <View style={[styles.actionIconWrap, subscribed && styles.actionIconWrapActive]}>
                    <Ionicons
                      name={subscribed ? 'notifications' : 'notifications-outline'}
                      size={22}
                      color={subscribed ? Colors.primary : Colors.white}
                    />
                  </View>
                  <Text style={[styles.actionLabel, subscribed && styles.actionLabelActive]}>
                    Suivre
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleLike}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <View style={[styles.actionIconWrap, liked && styles.actionIconWrapActive]}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? Colors.primary : Colors.white}
                  />
                </View>
                <Text style={[styles.actionLabel, liked && styles.actionLabelActive]}>
                  J'aime
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
    marginBottom: 150,
  },
  emptyText: {
    color: Colors.subtext2,
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingHorizontal: Spacings.xl,
  },
  retryButton: {
    marginTop: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Ảnh ---- */
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Header ---- */
  headerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacings.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: 12,
    gap: Spacings.sm,
  },
  headerTexts: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 20,
  },
  topicBadge: {
    maxWidth: '100%',
    marginTop: 4,
    paddingHorizontal: Spacings.md,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  /* ---- Toast ---- */
  toastLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toastContainer: {
    marginTop: 70,
    marginHorizontal: Spacings.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },

  /* ---- Bottom actions ---- */
  bottomLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacings.xxl,
  },
  bottomContent: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacings.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  actionIconWrapActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
  },
  actionLabelActive: {
    color: Colors.primary,
  },
});

export default InfographicView;