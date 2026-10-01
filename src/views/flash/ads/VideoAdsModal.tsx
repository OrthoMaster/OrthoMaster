import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFeed, recordImpression, recordView, VideoAd, contactAds } from '../../../services/v2/VideoAdService';

const { width: SCREEN_W } = Dimensions.get('window');
const SKIP_AFTER_SECONDS = 30;
const IS_WEB = Platform.OS === 'web';
const WEB_CONTENT_MAX_W = 720;

if (IS_WEB && typeof document !== 'undefined') {
  const STYLE_ID = '__video_ads_modal_style__';
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.innerHTML = `
            [data-video-ads-frame] video {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                display: block;
            }
            [data-video-ads-thumb] video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block;
            }
        `;
    document.head.appendChild(styleEl);
  }
}

type Props = {
  enabled: boolean;
  onClose: () => void;
  grantAccess: () => void;
  contentId?: number;
};

const VideoAdsModal: React.FC<Props> = ({ enabled, onClose, grantAccess, contentId }) => {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoAd[]>([]);
  const [selected, setSelected] = useState<VideoAd | null>(null);
  // Tập id các video đã contact xong trong phiên modal hiện tại
  const [contactedIds, setContactedIds] = useState<Set<number>>(new Set());

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      setSelected(null);
      setVideos([]);
      setContactedIds(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);

    getFeed(contentId)
      .then((data) => {
        if (cancelled) return;

        if (!data || data.length === 0) {
          setLoading(false);
          grantAccess();
          return;
        }

        setVideos(data);
        setLoading(false);

        data.forEach((v) => {
          recordImpression(v.id, contentId ? { content_id: contentId } : {})
            .catch(() => { /* silent */ });
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        grantAccess();
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (selected) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selected]);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const markContacted = (videoId: number) => {
    setContactedIds(prev => {
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });
  };

  if (!enabled) return null;

  return (
    <Modal
      visible={enabled}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.backdrop} edges={['bottom', 'top', 'left', 'right']}>
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : selected ? (
            <Animated.View
              style={[
                styles.playerWrap,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <VideoAdPlayer
                video={selected}
                contentId={contentId}
                onSkip={grantAccess}
                onContinue={grantAccess}
                onBack={() => setSelected(null)}
                alreadyContacted={contactedIds.has(selected.id)}
                onContacted={() => markContacted(selected.id)}
              />
            </Animated.View>
          ) : (
            <VideoGrid videos={videos} onSelect={setSelected} />
          )}
        </View>

        {!selected && !loading && (
          <TouchableOpacity
            onPress={handleClose}
            style={styles.floatingCloseBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        )}

        {!selected && !loading && !IS_WEB && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
            >
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const VideoGrid: React.FC<{
  videos: VideoAd[];
  onSelect: (v: VideoAd) => void;
}> = ({ videos, onSelect }) => {
  if (videos.length === 0) {
    return (
      <Text style={styles.emptyText}>Aucune vidéo disponible.</Text>
    );
  }

  return (
    <View>
      <Text style={styles.gridTopTitle}>Pour accéder au contenu, merci de sélectionner
        une communication parmi le choix suivant :</Text>
      <View style={styles.grid}>
        {videos.slice(0, 4).map((v) => (
          <Pressable
            key={v.id}
            style={styles.gridItem}
            onPress={() => onSelect(v)}
          >
            <View
              style={styles.gridThumbWrap}
              {...(IS_WEB ? { dataSet: { videoAdsThumb: 'true' } } : {})}
            >
              {v.thumbnail_url ? (
                <Image
                  source={{ uri: v.thumbnail_url }}
                  style={styles.gridThumb}
                  resizeMode="cover"
                />
              ) : (
                <Video
                  source={{ uri: v.video_url }}
                  style={styles.gridThumb}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isMuted
                  positionMillis={0}
                />
              )}
              <View style={styles.gridPlayOverlay}>
                <Ionicons name="play" size={32} color="#fff" />
              </View>
            </View>
            {v.ads_company?.name ? (
              <Text style={styles.gridCompany} numberOfLines={1}>
                {v.ads_company.name}
              </Text>
            ) : null}
            <Text style={styles.gridTitle} numberOfLines={2}>
              {v.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const VideoAdPlayer: React.FC<{
  video: VideoAd;
  contentId?: number;
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
  alreadyContacted: boolean;
  onContacted: () => void;
}> = ({ video, contentId, onSkip, onContinue, onBack, alreadyContacted, onContacted }) => {
  const videoRef = useRef<Video>(null);

  const [elapsed, setElapsed] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const reportedRef = useRef(false);
  // Ref đồng bộ với state finished, vì handleContactConfirm là callback
  // closure tại thời điểm hiện ra modal, có thể không thấy state mới.
  const finishedRef = useRef(false);

  const skipThreshold = durationSec > 0
    ? Math.min(SKIP_AFTER_SECONDS, Math.floor(durationSec))
    : SKIP_AFTER_SECONDS;

  const canSkip = elapsed >= skipThreshold;
  const remainingToSkip = Math.max(0, skipThreshold - Math.floor(elapsed));

  const [hasStarted, setHasStarted] = useState(false);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.isPlaying && !hasStarted) {
      setHasStarted(true);
    }

    if (status.durationMillis && durationSec === 0) {
      setDurationSec(status.durationMillis / 1000);
    }
    if (status.positionMillis != null) {
      setElapsed(status.positionMillis / 1000);
    }
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish && !finished) {
      setFinished(true);
      finishedRef.current = true;
      reportView(true);
    }
  }, [durationSec, finished, hasStarted]);

  const reportView = (completed: boolean) => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    recordView(video.id, {
      is_completed: completed,
      ...(contentId ? { content_id: contentId } : {}),
    }).catch(() => { /* silent */ });
  };

  // Mở modal xác nhận. Video vẫn chạy nền (không pause).
  const handleContactAds = () => {
    if (alreadyContacted) return;
    setShowContactConfirm(true);
  };

  const handleContactConfirm = () => {
    setShowContactConfirm(false);
    onContacted(); // disable button ngay (do parent quản lý)

    contactAds(video.id, {
      is_contacted: true,
      ...(contentId ? { content_id: contentId } : {}),
    }).catch(() => { /* silent */ });

    if (finishedRef.current) {
      onContinue();
    }
  };

  const handleContactCancel = () => {
    setShowContactConfirm(false);
  };

  useEffect(() => {
    return () => {
      if (!reportedRef.current && elapsed > 0) {
        reportView(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    reportView(false);
    onSkip();
  };

  const handleContinue = () => {
    onContinue();
  };

  const togglePlay = async () => {
    if (finished) return;
    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
    } catch {
      /* silent */
    }
  };

  return (
    <View style={styles.playerContainer}>
      {video.ads_company?.name ? (
        <Text style={styles.gridCompany} numberOfLines={1}>
          {video.ads_company.name}
        </Text>
      ) : null}
      <Text style={styles.playerTitle} numberOfLines={2}>
        {video.title}
      </Text>

      <View
        style={styles.videoBox}
        {...(IS_WEB ? { dataSet: { videoAdsFrame: 'true' } } : {})}
      >
        <Video
          ref={videoRef}
          source={{ uri: video.video_url }}
          style={styles.videoEl}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls={false}
          onPlaybackStatusUpdate={onPlaybackStatus}
        />

        <Pressable
          onPress={togglePlay}
          style={styles.videoPressOverlay}
        >
          {!isPlaying && !finished && (
            <View style={styles.playOverlayCircle} pointerEvents="none">
              {hasStarted ? (
                <Ionicons name="play" size={36} color="#fff" />
              ) : (
                <ActivityIndicator size="large" color="#fff" />
              )}
            </View>
          )}
        </Pressable>

        <View style={styles.skipWrap} pointerEvents="box-none">
          {finished ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleContinue}
            >
              <Text style={styles.skipBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : canSkip ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
            >
              <Text style={styles.skipBtnText}>Passer</Text>
              <Ionicons name="play-skip-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownLabel}>
              <Text style={styles.countdownText}>
                Passer dans {remainingToSkip}s
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactBtn, alreadyContacted && styles.contactBtnDisabled]}
          onPress={handleContactAds}
          disabled={alreadyContacted}
        >
          <Ionicons
            name="heart"
            size={34}
            color={alreadyContacted ? '#888' : '#e53935'}
          />
          <Text style={[
            styles.contactBtnText,
            alreadyContacted && styles.contactBtnTextDisabled,
          ]}>
            {alreadyContacted
              ? 'Annonceur contacté'
              : "Ça m'intéresse,\nContactez-moi !"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal xác nhận - video phía sau vẫn chạy bình thường */}
      <ContactConfirmModal
        visible={showContactConfirm}
        onCancel={handleContactCancel}
        onConfirm={handleContactConfirm}
      />
    </View>
  );
};

// ===================================================================
// Modal xác nhận chia sẻ thông tin
// ===================================================================
const ContactConfirmModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={confirmStyles.backdrop}>
        <View style={confirmStyles.card}>
          <Text style={confirmStyles.title}>Vous voulez en savoir plus...</Text>

          <Text style={confirmStyles.body}>
            Nous faisons savoir à l’annonceur que sa solution vous intéresse.{'\n'}
            Voici les informations que nous lui faisons parvenir :
          </Text>

          <View style={confirmStyles.bulletList}>
            <Text style={confirmStyles.bullet}>•  Nom, Prénom, Métier</Text>
            <Text style={confirmStyles.bullet}>•  Email</Text>
          </View>

          <View style={confirmStyles.btnRow}>
            <TouchableOpacity
              style={[confirmStyles.btn, confirmStyles.cancelBtn]}
              onPress={onCancel}
            >
              <Text style={confirmStyles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[confirmStyles.btn, confirmStyles.confirmBtn]}
              onPress={onConfirm}
            >
              <Text style={confirmStyles.confirmText}>Je confirme</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ===================================================================
// Styles
// ===================================================================
const GRID_GAP_COL = 12;
const GRID_GAP_ROW = 24;
const GRID_PADDING = 16;

const CONTENT_W = IS_WEB
  ? Math.min(SCREEN_W, WEB_CONTENT_MAX_W)
  : SCREEN_W;

const GRID_ITEM_W = (CONTENT_W - GRID_PADDING * 2 - GRID_GAP_COL) / 2;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
  },

  floatingCloseBtn: {
    position: 'absolute',
    top: 50,
    right: IS_WEB
      ? Math.max(16, (SCREEN_W - CONTENT_W) / 2 + 16)
      : 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GRID_PADDING,
  },
  gridTopTitle: {
    color: '#bbb',
    fontSize: IS_WEB ? 14 : 15,
    fontFamily: 'Poppins-Regular',
    marginBottom: IS_WEB ? 16 : 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP_COL,
    rowGap: GRID_GAP_ROW,
    justifyContent: 'center',
  },
  gridItem: {
    width: GRID_ITEM_W,
  },
  gridCompany: {
    color: '#bbb',
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: '500',
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
    lineHeight: 16,
  },
  gridThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
  },
  gridPlayOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  footer: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  closeBtn: {
    width: '100%',
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },

  emptyText: {
    color: '#bbb',
    fontSize: 14,
  },

  playerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  playerContainer: {
    width: '100%',
    alignItems: 'stretch',
  },
  playerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  videoBox: {
    width: '100%',
    height: ((CONTENT_W - GRID_PADDING * 2) * 9) / 16,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  videoEl: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },

  videoPressOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  countdownLabel: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  countdownText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
  },
  skipBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 20,
  },
  backBtn: {
    width: 48,
    backgroundColor: '#444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f5b5b5',
    borderWidth: 1,
    borderColor: '#f5b5b5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contactBtnDisabled: {
    backgroundColor: '#3a3a3a',
    borderColor: '#3a3a3a',
  },
  contactBtnText: {
    color: '#c62828',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  contactBtnTextDisabled: {
    color: '#888',
  },
});

const confirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins-Medium',
    color: '#222',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#444',
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 6,
  },
  bullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#444',
    lineHeight: 22,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#eee',
  },
  cancelText: {
    color: '#444',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  confirmBtn: {
    backgroundColor: '#1899D6',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});

export default VideoAdsModal;