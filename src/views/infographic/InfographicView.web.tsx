import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SourceVideoCard from '../podcast/components/SourceVideoCard';

import { sendError } from '../../services/v2/AuthService';
import { toggleTopic, toggleFavourite } from '../../services/v2/FavouriteService';
import { getInfographicById } from '../../services/v2/ContentService';
import useDebouncedToggle from '../../hooks/useDebouncedToggle';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.4;
const WHEEL_STEP = 0.2;
const NARROW_BREAKPOINT = 900;
const IMAGE_PADDING = Spacings.xl;

export const InfographicView = ({ navigation, route }) => {
  const infographicId = route.params?.infographicId ?? null;
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < NARROW_BREAKPOINT;

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

  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* Kích thước ảnh hiển thị                                             */
  /*                                                                     */
  /* Giữ song song state + ref: PanResponder được tạo 1 lần nên closure  */
  /* của nó chỉ thấy giá trị lần render đầu. Ref cho nó đọc giá trị mới. */
  /* ------------------------------------------------------------------ */

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });

  const containerSizeRef = useRef({ w: 0, h: 0 });
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

  const getDisplaySize = () => {
    const { w: cw, h: ch } = containerSizeRef.current;
    const img = imageSizeRef.current;

    if (!img.w || !img.h || !cw || !ch) return { w: cw, h: ch };

    const ratio = Math.min(cw / img.w, ch / img.h);
    return { w: img.w * ratio, h: img.h * ratio };
  };

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
  /* Zoom: molette + boutons + double clic. Pan: glisser à la souris     */
  /* ------------------------------------------------------------------ */

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastTranslateRef = useRef({ x: 0, y: 0 });
  const lastClickRef = useRef(0);

  const [isZoomed, setIsZoomed] = useState(false);

  const imageAreaRef = useRef<View>(null);

  const applyTranslate = (x: number, y: number) => {
    translateRef.current = { x, y };
    translateX.setValue(x);
    translateY.setValue(y);
  };

  /** Đặt scale mới, kéo ảnh về trong biên và cập nhật cờ isZoomed */
  const setScale = (value: number, animated = true) => {
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
    scaleRef.current = next;
    setIsZoomed(next > MIN_SCALE);

    const clamped = clampTranslate(translateRef.current.x, translateRef.current.y, next);
    translateRef.current = clamped;
    lastTranslateRef.current = clamped;

    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: next, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.spring(translateX, { toValue: clamped.x, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.spring(translateY, { toValue: clamped.y, useNativeDriver: true, tension: 80, friction: 10 }),
      ]).start();
    } else {
      scale.setValue(next);
      translateX.setValue(clamped.x);
      translateY.setValue(clamped.y);
    }
  };

  const zoomIn = () => setScale(scaleRef.current + ZOOM_STEP);
  const zoomOut = () => setScale(scaleRef.current - ZOOM_STEP);
  const resetZoom = () => {
    translateRef.current = { x: 0, y: 0 };
    lastTranslateRef.current = { x: 0, y: 0 };
    setScale(MIN_SCALE);
  };

  /** Molette de la souris: react-native-web expose le noeud DOM via la ref */
  useEffect(() => {
    const node: any = imageAreaRef.current;
    if (!node || typeof node.addEventListener !== 'function') return;

    const onWheel = (event: WheelEvent) => {
      if (!event.deltaY) return;
      event.preventDefault();

      const direction = event.deltaY > 0 ? -1 : 1;
      setScale(scaleRef.current + direction * WHEEL_STEP, false);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return (
          scaleRef.current > MIN_SCALE &&
          (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2)
        );
      },

      onPanResponderGrant: () => {
        lastTranslateRef.current = { ...translateRef.current };

        // Double clic pour zoomer / dézoomer
        const now = Date.now();
        if (now - lastClickRef.current < 300) {
          lastClickRef.current = 0;
          if (scaleRef.current > MIN_SCALE) {
            resetZoom();
          } else {
            setScale(2.5);
          }
          return;
        }
        lastClickRef.current = now;
      },

      onPanResponderMove: (_evt, gestureState) => {
        if (scaleRef.current <= MIN_SCALE) return;

        const clamped = clampTranslate(
          lastTranslateRef.current.x + gestureState.dx,
          lastTranslateRef.current.y + gestureState.dy,
          scaleRef.current
        );
        applyTranslate(clamped.x, clamped.y);
      },

      onPanResponderRelease: () => {
        lastTranslateRef.current = { ...translateRef.current };
      },

      onPanResponderTerminate: () => {
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
      Animated.spring(toastTranslateY, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
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

  /** Web: télécharger le fichier si le CORS le permet, sinon ouvrir l'image */
  const handleDownload = async () => {
    if (!imageUrl || isDownloading) return;

    setIsDownloading(true);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const extension = imageUrl.split('.').pop()?.split('?')[0] ?? 'jpg';
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${title || 'infographie'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // CORS bloqué: l'onglet reste la solution de repli
      window.open(imageUrl, '_blank', 'noopener');
    } finally {
      setIsDownloading(false);
    }
  };

  /** Web: partage natif si disponible, sinon copie du lien */
  const handleShare = async () => {
    if (!infographic) return;

    const contentId = infographic.id;
    const link = `https://go.orthomaster.fr/open/infographic/${contentId}`;
    const message =
      "Voici un contenu intéressant à voir sur OrthoMaster :\n\n" + title + "\n\n" + link;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: message, url: link });
        return;
      }

      await navigator.clipboard.writeText(link);
      setToastMessage('Lien copié dans le presse-papiers');
    } catch (error) {
      // L'utilisateur a annulé le partage natif: rien à signaler
    }
  };

  /* ---------------- Suivi du sujet et favori ---------------- */

  const [subscribed, toggleSubscribed] = useDebouncedToggle(
    hasTopic,
    async () => {
      if (!topic) return false;

      const ok = await toggleTopic(topic.id);

      if (ok) {
        await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
      }

      return ok;
    },
    { tag: 'infographic-view' }
  );

  const [liked, toggleLiked] = useDebouncedToggle(
    !!data?.has_like,
    async () => {
      if (!infographic?.id) return false;

      return await toggleFavourite(infographic.id, 'infographic');
    },
    { tag: 'infographic-view' }
  );
  
  const handleSubscribeTopic = () => {
    if (!topic) return;
    toggleSubscribed();
  };

  const handleLike = () => {
    if (!infographic?.id) return;
    toggleLiked();
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
      <View style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!infographic) {
    return (
      <View style={styles.root}>
        <View style={styles.closeLayer}>
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <Ionicons name="close" size={22} color={Colors.white} />
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
      </View>
    );
  }

  const renderAction = (
    key: string,
    icon: any,
    label: string,
    onPress: () => void,
    options: { active?: boolean; loading?: boolean } = {}
  ) => {
    const { active = false, loading = false } = options;

    return (
      <TouchableOpacity
        key={key}
        onPress={onPress}
        disabled={loading}
        style={[styles.actionButton, active && styles.actionButtonActive]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Ionicons name={icon} size={20} color={active ? Colors.primary : Colors.white} />
        )}
        <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />

      {/* Zone image */}
      <View
        ref={imageAreaRef}
        style={[styles.imageArea, isZoomed && styles.imageAreaZoomed]}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          // onLayout inclut le padding, l'image n'occupe que l'intérieur
          const size = {
            w: Math.max(0, w - IMAGE_PADDING * 2),
            h: Math.max(0, h - IMAGE_PADDING * 2),
          };
          containerSizeRef.current = size;
          setContainerSize(size);
        }}
        {...panResponder.panHandlers}
      >
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            resizeMode="contain"
            style={[
              styles.image,
              { transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={80} color={Colors.subtext2} />
          </View>
        )}
      </View>

      {/* Close en haut à gauche */}
      <View style={styles.closeLayer} pointerEvents="box-none">
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Contrôles de zoom en haut à droite */}
      <View style={styles.zoomLayer} pointerEvents="box-none">
        <TouchableOpacity onPress={zoomOut} style={styles.zoomButton} disabled={!isZoomed}>
          <Ionicons name="remove" size={18} color={isZoomed ? Colors.white : Colors.subtext2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={resetZoom} style={styles.zoomButton} disabled={!isZoomed}>
          <Ionicons name="contract-outline" size={16} color={isZoomed ? Colors.white : Colors.subtext2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
          <Ionicons name="add" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {!!toastMessage && (
        <View style={styles.toastLayer} pointerEvents="none">
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
        </View>
      )}

      {/* Bandeau bas: fond noir plein, 2 colonnes */}
      <View style={[styles.bottomBar, isNarrow && styles.bottomBarNarrow]}>
        <View style={styles.bottomLeft}>
          {!!title && (
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
          )}

          {!!topic?.name && (
            <View style={styles.topicBadge}>
              <Text style={styles.topicText} numberOfLines={1}>{topic.name}</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            {renderAction('download', 'download-outline', 'Télécharger', handleDownload, {
              loading: isDownloading,
            })}
            {renderAction('share', 'share-social-outline', 'Partager', handleShare)}
            {!!topic &&
              renderAction(
                'follow',
                subscribed ? 'notifications' : 'notifications-outline',
                'Suivre',
                handleSubscribeTopic,
                { active: subscribed }
              )}
            {renderAction('like', liked ? 'heart' : 'heart-outline', "Sauvegarder", handleLike, {
              active: liked,
            })}
          </View>
        </View>

        {!!video && (
          <View style={[styles.bottomRight, isNarrow && styles.bottomRightNarrow]}>
            <SourceVideoCard video={video} onPress={handleOpenSourceVideo} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
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

  /* ---- Zone image ---- */
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: IMAGE_PADDING,
    // @ts-ignore - propriété web
    cursor: 'zoom-in',
    userSelect: 'none',
  },
  imageAreaZoomed: {
    // @ts-ignore - propriété web
    cursor: 'grab',
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

  /* ---- Overlays ---- */
  closeLayer: {
    position: 'absolute',
    top: Spacings.lg,
    left: Spacings.lg,
    zIndex: 9999
  },
  zoomLayer: {
    position: 'absolute',
    top: Spacings.lg,
    right: Spacings.lg,
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  /* ---- Toast ---- */
  toastLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastContainer: {
    marginTop: Spacings.lg,
    maxWidth: 420,
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
  },

  /* ---- Bandeau bas ---- */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxl,
    backgroundColor: '#000',
    paddingHorizontal: Spacings.xl,
    paddingVertical: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomBarNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacings.md,
  },
  bottomLeft: {
    flex: 1,
    minWidth: 0,
  },
  bottomRight: {
    width: 340,
    // compense le marginBottom de la variante compact de SourceVideoCard
    marginBottom: -Spacings.md,
  },
  bottomRightNarrow: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacings.xs,
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
    marginTop: Spacings.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.md,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    // @ts-ignore - propriété web
    cursor: 'pointer',
  },
  actionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  actionLabelActive: {
    color: Colors.primary,
  },
});

export default InfographicView;