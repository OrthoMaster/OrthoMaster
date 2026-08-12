import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Pressable,
  StatusBar,
  ScrollView,
  GestureResponderEvent,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView, VideoPlayer as ExpoVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { fetchVideoAccess } from '../../../services/v2/ContentService';
import { useVideoTracking } from '../../../hooks/useVideoTracking';

import Colors from "../../../../constants/Colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─── Types & Constants ────────────────────────────────────────────────────────

type VideoData = {
  title: string;
  url: string;
  highlights: { id: number; time: number; label: string }[];
  subtitles: string[];
};

export type VideoPlayerProps = {
  videoCode?: string;
  navigation?: any;
  embedWidth?: number;
  showChapters?: boolean;
  trackingId?: number | null;
};

const LANG_LABELS: { [key: string]: string } = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
};

const AUTO_HIDE_MS = 3500;
const TOOLTIP_WIDTH = 110;
const TOOLTIP_BG = 'rgba(14,14,18,0.8)';
const COOKIE_REFRESH_MS = 13 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function parseVTT(vttText: string) {
  const cues: { start: number; end: number; text: string }[] = [];
  const text = vttText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  for (const block of text.split(/\n\n+/)) {
    const lines = block.trim().split('\n');
    const tsIdx = lines.findIndex(l => l.includes('-->'));
    if (tsIdx === -1) continue;
    const match = lines[tsIdx].match(
      /(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3})/
    );
    if (!match) continue;
    const textContent = lines
      .slice(tsIdx + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!textContent) continue;
    cues.push({ start: toSec(match[1]), end: toSec(match[2]), text: textContent });
  }
  if (cues.length > 0 && cues[0].start > 60) {
    const off = cues[0].start;
    return cues.map(c => ({ ...c, start: c.start - off, end: c.end - off }));
  }
  return cues;
}

function toSec(t: string) {
  const p = t.replace(',', '.').split(':');
  return p.length === 3
    ? parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2])
    : parseFloat(p[0]) * 60 + parseFloat(p[1]);
}

function getSubtitleUrl(videoUrl: string, lang: string) {
  return `${videoUrl.substring(0, videoUrl.lastIndexOf('/'))}/subtitles/${lang}/${lang}.vtt`;
}

function getTooltipTranslateX(pos: number): number {
  if (pos < 0.25) return 0;
  if (pos > 0.75) return -TOOLTIP_WIDTH;
  return -TOOLTIP_WIDTH / 2;
}

function getArrowLeft(pos: number): number {
  return Math.max(8, Math.min(TOOLTIP_WIDTH - 8, -getTooltipTranslateX(pos)));
}

// ─── EmbeddedSommaire ─────────────────────────────────────────────────────────

const EmbeddedSommaire = ({
  highlights,
  currentTime,
  duration,
  onSeek,
}: {
  highlights: VideoData['highlights'];
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}) => {
  if (highlights.length === 0) return null;

  return (
    <View style={sommaireStyles.wrapper}>
      <View style={sommaireStyles.header}>
        <Ionicons name="list" size={12} color={Colors.white} />
        <Text style={sommaireStyles.headerLabel}>Chapitres</Text>
      </View>

      {highlights.map((h, i) => {
        const isActive =
          currentTime >= h.time &&
          (i === highlights.length - 1 || currentTime < highlights[i + 1].time);
        const isPassed = !isActive && currentTime > h.time;
        const progressRatio = duration > 0 ? Math.min(h.time / duration, 1) : 0;

        return (
          <TouchableOpacity
            key={h.id}
            style={[sommaireStyles.row, isActive && sommaireStyles.rowActive]}
            onPress={() => onSeek(h.time)}
            activeOpacity={0.6}
          >
            {/* Left accent bar */}
            <View style={[sommaireStyles.accentBar, isActive && sommaireStyles.accentBarActive]} />

            {/* Index bubble */}
            <View style={[
              sommaireStyles.indexBubble,
              isPassed && sommaireStyles.indexBubblePassed,
              isActive && sommaireStyles.indexBubbleActive,
            ]}>
              {isPassed && !isActive ? (
                <Ionicons name="checkmark" size={9} color="#fff" />
              ) : (
                <Text style={[
                  sommaireStyles.indexText,
                  (isPassed || isActive) && sommaireStyles.indexTextLight,
                ]}>
                  {i + 1}
                </Text>
              )}
            </View>

            {/* Label + time */}
            <View style={sommaireStyles.rowBody}>
              <Text style={sommaireStyles.rowTime}>{formatTime(h.time)}</Text>
              <Text
                style={[sommaireStyles.rowLabel, isActive && sommaireStyles.rowLabelActive]}
                numberOfLines={1}
              >
                {h.label}
              </Text>
            </View>

            {/* Mini progress indicator */}
            <View style={sommaireStyles.miniBar}>
              <View style={[
                sommaireStyles.miniBarFill,
                {
                  width: `${progressRatio * 100}%` as any,
                  backgroundColor: isActive ? '#E50914' : isPassed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                },
              ]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── SubtitlePanel ────────────────────────────────────────────────────────────

const SubtitlePanel = ({
  langs, selectedLang, onSelect, visible, onClose,
}: {
  langs: string[];
  selectedLang: string | null;
  onSelect: (l: string | null) => void;
  visible: boolean;
  onClose: () => void;
}) => {
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <Animated.View
        style={[styles.panel, {
          opacity: fade,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Sous-titres</Text>
        </View>
        {[null, ...langs].map((lang, i) => {
          const active = selectedLang === lang;
          return (
            <TouchableOpacity
              key={lang ?? '__off'}
              style={[styles.panelRow, i === langs.length && { borderBottomWidth: 0 }]}
              onPress={() => { onSelect(lang); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkDot, active && styles.checkDotActive]}>
                {active && <View style={styles.checkDotInner} />}
              </View>
              <Text style={[styles.panelRowText, active && styles.panelRowTextActive]}>
                {lang === null ? 'Désactivé' : (LANG_LABELS[lang] || lang.toUpperCase())}
              </Text>
              {active && lang !== null && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIF</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
};

// ─── HighlightsPanel ──────────────────────────────────────────────────────────

const HighlightsPanel = ({
  visible, onClose, currentTime, duration, onSeek, highlights,
}: {
  visible: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
  highlights: VideoData['highlights'];
}) => {
  const translateX = useRef(new Animated.Value(300)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: visible ? 0 : 300, useNativeDriver: true, tension: 65, friction: 12 }),
      Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <Animated.View style={[styles.highlightsPanel, { opacity: fade, transform: [{ translateX }] }]}>
        <View style={styles.highlightsPanelHeader}>
          <Text style={styles.highlightsPanelTitle}>Chapitres</Text>
          <TouchableOpacity onPress={onClose} style={styles.highlightsPanelClose}>
            <Ionicons name="close" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.highlightsPanelDivider} />
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {highlights.map((h, i) => {
            const active =
              currentTime >= h.time &&
              (i === highlights.length - 1 || currentTime < highlights[i + 1].time);
            const passed = currentTime > h.time;
            const progress = duration > 0 ? Math.min((h.time / duration) * 100, 100) : 0;
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.highlightItem, active && styles.highlightItemActive]}
                onPress={() => onSeek(h.time)}
                activeOpacity={0.75}
              >
                <View style={styles.highlightItemLeft}>
                  <View style={[styles.hlIndexDot, passed && styles.hlIndexDotPassed, active && styles.hlIndexDotActive]}>
                    <Text style={[styles.hlIndexText, (passed || active) && { color: '#fff' }]}>{i + 1}</Text>
                  </View>
                </View>
                <View style={styles.highlightItemBody}>
                  <Text style={[styles.highlightItemLabel, active && styles.highlightItemLabelActive]}>
                    {h.label}
                  </Text>
                  <Text style={styles.highlightItemTime}>{formatTime(h.time)}</Text>
                </View>
                <View style={styles.hlMiniBar}>
                  <View style={[styles.hlMiniBarFill, {
                    width: `${progress}%` as any,
                    backgroundColor: active ? '#E50914' : 'rgba(255,255,255,0.25)',
                  }]} />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 16 }} />
        </ScrollView>
      </Animated.View>
    </>
  );
};

// ─── VideoProgressBar ─────────────────────────────────────────────────────────

const VideoProgressBar = ({
  currentTime, duration, onSeek, highlights,
}: {
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
  highlights: VideoData['highlights'];
}) => {
  const [barWidth, setBarWidth] = useState(1);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const isDragging = useRef(false);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const seekFromRatio = useCallback(
    (x: number, width: number) => {
      onSeek(Math.max(0, Math.min(1, x / width)) * duration);
    },
    [duration, onSeek]
  );

  const handleBarPress = (e: GestureResponderEvent) =>
    seekFromRatio(e.nativeEvent.locationX, barWidth);

  const nativeDragProps = Platform.OS !== 'web' ? {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      isDragging.current = true;
      seekFromRatio(e.nativeEvent.locationX, barWidth);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      if (!isDragging.current) return;
      seekFromRatio(e.nativeEvent.locationX, barWidth);
    },
    onResponderRelease: () => { isDragging.current = false; },
    onResponderTerminate: () => { isDragging.current = false; },
  } : {};

  const handleWebMouseDown = useCallback((e: any) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    seekFromRatio(e.clientX - rect.left, rect.width);
    const onMouseMove = (ev: MouseEvent) => seekFromRatio(ev.clientX - rect.left, rect.width);
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [seekFromRatio]);

  const webTrackProps: any = Platform.OS === 'web' ? { onMouseDown: handleWebMouseDown } : {};

  return (
    <View style={styles.progressWrapper}>
      {Platform.OS === 'web' && highlights.map(h => {
        const pos = duration > 0 ? h.time / duration : 0;
        return (
          <View
            key={h.id}
            // @ts-ignore
            pointerEvents="none"
            style={[styles.highlightTooltip, {
              left: `${pos * 100}%` as any,
              opacity: hoveredDot === h.id ? 1 : 0,
              transform: [{ translateX: getTooltipTranslateX(pos) }],
            }]}
          >
            <View style={styles.tooltipBubble}>
              <Text style={styles.tooltipLabel}>{h.label}</Text>
              <Text style={styles.tooltipTime}>{formatTime(h.time)}</Text>
            </View>
            <View style={[styles.tooltipArrow, { left: getArrowLeft(pos) }]} />
          </View>
        );
      })}

      <View
        style={styles.progressTrackHitArea}
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
        {...nativeDragProps}
        {...webTrackProps}
      >
        {Platform.OS !== 'web' && (
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBarPress} />
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          {highlights.map(h => {
            const pos = duration > 0 ? h.time / duration : 0;
            const dotProps: any = Platform.OS === 'web'
              ? { onMouseEnter: () => setHoveredDot(h.id), onMouseLeave: () => setHoveredDot(null) }
              : {};
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.hlDot, { left: `${pos * 100}%` as any }]}
                onPress={() => onSeek(h.time)}
                activeOpacity={0.8}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
                {...dotProps}
              />
            );
          })}
          <View style={[styles.progressThumb, { left: `${progress * 100}%` as any }]} />
        </View>
      </View>
    </View>
  );
};

// ─── CorePlayer ───────────────────────────────────────────────────────────────

type CorePlayerProps = {
  player: ExpoVideoPlayer;
  videoData: VideoData;
  videoWidth: number;
  videoHeight: number;
  selectedLang: string | null;
  onSelectedLangChange: (lang: string | null) => void;
  webSubtitleData: { [lang: string]: { start: number; end: number; text: string }[] };
  isFullscreen: boolean;
  isActive: boolean;
  seekOnActive?: number;
  hasError: boolean;
  onVideoError: () => void;
  onRetry: () => void;
  onRequestFullscreen: () => void;
  onExitFullscreen: () => void;
  navigation?: any;
};

const CorePlayer = ({
  player,
  videoData,
  videoWidth,
  videoHeight,
  selectedLang,
  onSelectedLangChange,
  webSubtitleData,
  isFullscreen,
  isActive,
  seekOnActive,
  hasError,
  onVideoError,
  onRetry,
  onRequestFullscreen,
  onExitFullscreen,
}: CorePlayerProps) => {
  const { title: VIDEO_TITLE, highlights: HIGHLIGHTS } = videoData;

  const subtitleLangs = videoData.subtitles;

  // ── Playback state ────────────────────────────────────────────────────────
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setDuration(player.duration ?? 0);
    }, 300);
    return () => clearInterval(id);
  }, [player]);

  // ── Web subtitle text sync ────────────────────────────────────────────────
  const [webCurrentText, setWebCurrentText] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setWebCurrentText('');
      return;
    }
    if (!selectedLang || !webSubtitleData[selectedLang]) {
      setWebCurrentText('');
      return;
    }
    const cues = webSubtitleData[selectedLang];
    const active = cues.find(c => currentTime >= c.start && currentTime <= c.end);
    setWebCurrentText(active?.text ?? '');
  }, [currentTime, selectedLang, webSubtitleData]);

  // ── Seek to saved position when this view becomes active ─────────────────
  useEffect(() => {
    if (!isActive || seekOnActive == null || seekOnActive <= 0) return;
    const t = setTimeout(() => {
      player.currentTime = seekOnActive;
      player.play();
    }, 80);
    return () => clearTimeout(t);
  }, [isActive]);

  // ── Web 403 / network error detection ────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || !isActive) return;

    let videoEl: HTMLVideoElement | null = null;
    const handleError = () => {
      const err = (videoEl as HTMLVideoElement).error;
      if (err && (err.code === MediaError.MEDIA_ERR_NETWORK || err.code === MediaError.MEDIA_ERR_DECODE)) {
        onVideoError();
      }
    };
    const poll = setInterval(() => {
      const el = document.querySelector('video') as HTMLVideoElement | null;
      if (!el) return;
      clearInterval(poll);
      videoEl = el;
      el.addEventListener('error', handleError);
    }, 200);

    return () => {
      clearInterval(poll);
      if (videoEl) videoEl.removeEventListener('error', handleError);
    };
  }, [isActive, onVideoError]);

  // ── Panel state ───────────────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(isFullscreen);

  useEffect(() => {
    setHighlightsOpen(isFullscreen);
    setPanelOpen(false);
  }, [isFullscreen]);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const controlsFade = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const subtitleBottom = useRef(new Animated.Value(130)).current;

  const showControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsVisible(true);
    Animated.parallel([
      Animated.timing(controlsFade, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(subtitleBottom, { toValue: 130, duration: 150, useNativeDriver: false }),
    ]).start();
  }, [controlsFade, subtitleBottom]);

  const scheduleHide = useCallback(() => {
    if (panelOpen || highlightsOpen) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(controlsFade, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(subtitleBottom, { toValue: 28, duration: 600, useNativeDriver: false }),
      ]).start(() => setControlsVisible(false));
    }, AUTO_HIDE_MS);
  }, [controlsFade, subtitleBottom, panelOpen, highlightsOpen]);

  const bringControls = useCallback(() => {
    showControls();
    scheduleHide();
  }, [showControls, scheduleHide]);

  useEffect(() => {
    bringControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  useEffect(() => {
    if (panelOpen || highlightsOpen) {
      showControls();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      scheduleHide();
    }
  }, [panelOpen, highlightsOpen]);

  const webContainerProps: any = Platform.OS === 'web'
    ? { onMouseEnter: bringControls, onMouseLeave: () => scheduleHide(), onMouseMove: bringControls }
    : {};

  const togglePlay = () => {
    if (isPlaying) player.pause(); else player.play();
    bringControls();
  };

  const seekBy = (delta: number) => {
    player.currentTime = Math.max(0, Math.min(duration, (player.currentTime ?? 0) + delta));
    bringControls();
  };

  return (
    <View style={styles.playerRoot} {...webContainerProps}>
      {isActive ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <VideoView
            player={player}
            style={[StyleSheet.absoluteFill, { width: videoWidth, height: isFullscreen ? screenHeight : videoHeight }]}
            nativeControls={false}
            contentFit="contain"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {webCurrentText !== '' && (
        <Animated.View
          style={[styles.subtitleOverlay, { bottom: subtitleBottom }]}
          pointerEvents="none"
        >
          <Text style={[styles.subtitleText, { fontSize: isFullscreen ? 20 : 16 }]}>{webCurrentText}</Text>
        </Animated.View>
      )}

      {Platform.OS !== 'web' && (
        <Pressable style={StyleSheet.absoluteFill} onPress={bringControls} />
      )}

      <Animated.View
        style={[styles.controlsOverlay, { opacity: controlsFade }]}
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
      >
        <View style={styles.topGradient} pointerEvents="none" />
        <View style={styles.bottomGradient} pointerEvents="none" />

        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {isFullscreen && (
              <TouchableOpacity style={styles.iconBtn} onPress={onExitFullscreen} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.videoTitle} numberOfLines={1}>{VIDEO_TITLE}</Text>
          </View>

          <View style={styles.topBarRight}>
            {subtitleLangs.length > 0 && (
              <TouchableOpacity
                style={[styles.ccButton, selectedLang !== null && styles.ccButtonActive]}
                onPress={() => { setPanelOpen(v => !v); setHighlightsOpen(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.ccText, selectedLang !== null && styles.ccTextActive]}>CC</Text>
                {selectedLang !== null && <View style={styles.activeDot} />}
              </TouchableOpacity>
            )}

            {isFullscreen ? (
              <TouchableOpacity
                style={[styles.hlListBtn, highlightsOpen && styles.hlListBtnActive]}
                onPress={() => { setHighlightsOpen(v => !v); setPanelOpen(false); }}
                activeOpacity={0.8}
              >
                <Ionicons name="list" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.hlListBtn} onPress={onRequestFullscreen} activeOpacity={0.8}>
                <Ionicons name="expand" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomBar}>
          <VideoProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={t => { player.currentTime = t; bringControls(); }}
            highlights={HIGHLIGHTS}
          />
          <View style={styles.playbackRow}>
            <TouchableOpacity style={styles.seekBtn} onPress={() => seekBy(-10)} activeOpacity={0.75}>
              <Ionicons name="play-back" size={22} color="rgba(255,255,255,0.9)" />
              <Text style={styles.seekBtnLabel}>10</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlay} activeOpacity={0.85}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#fff"
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.seekBtn} onPress={() => seekBy(10)} activeOpacity={0.75}>
              <Ionicons name="play-forward" size={22} color="rgba(255,255,255,0.9)" />
              <Text style={styles.seekBtnLabel}>10</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.subtitlePanelAnchor} pointerEvents="box-none">
        <SubtitlePanel
          langs={subtitleLangs}
          selectedLang={selectedLang}
          onSelect={onSelectedLangChange}
          visible={panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      </View>

      {isFullscreen && (
        <View style={styles.highlightsPanelAnchor} pointerEvents="box-none">
          <HighlightsPanel
            visible={highlightsOpen}
            onClose={() => setHighlightsOpen(false)}
            currentTime={currentTime}
            duration={duration}
            onSeek={t => { player.currentTime = t; bringControls(); }}
            highlights={HIGHLIGHTS}
          />
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="lock-closed-outline" size={28} color="#E50914" />
            </View>
            <Text style={styles.errorTitle}>Session expirée</Text>
            <Text style={styles.errorBody}>
              Votre accès à cette vidéo a expiré.{'\n'}
              Appuyez sur le bouton ci-dessous pour continuer.
            </Text>
            <TouchableOpacity style={styles.errorRetryBtn} onPress={onRetry} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.errorRetryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── VideoPlayerReady ─────────────────────────────────────────────────────────

type VideoPlayerReadyProps = {
  videoCode: string;
  videoData: VideoData;
  embedWidth: number;
  embedHeight: number;
  navigation?: any;
  showChapters?: boolean;
  trackingId?: number | null;
};

const VideoPlayerReady = ({
  videoCode, videoData, embedWidth, embedHeight, navigation, showChapters = true, trackingId
}: VideoPlayerReadyProps) => {
  const player = useVideoPlayer(videoData.url, p => { p.play(); });

  useVideoTracking(trackingId ?? null, player);

  const [fullscreen, setFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(
    videoData.subtitles.length > 0 ? videoData.subtitles[0] : null
  );
  const [webSubtitleData, setWebSubtitleData] = useState<{
    [lang: string]: { start: number; end: number; text: string }[];
  }>({});

  // ── currentTime cho EmbeddedSommaire ─────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setDuration(player.duration ?? 0);
    }, 300);
    return () => clearInterval(id);
  }, [player]);

  const pendingSeekRef = useRef<number>(0);

  const openFullscreen = useCallback(() => {
    pendingSeekRef.current = player.currentTime ?? 0;
    setFullscreen(true);
  }, [player]);

  const closeFullscreen = useCallback(() => {
    pendingSeekRef.current = player.currentTime ?? 0;
    setFullscreen(false);
  }, [player]);

  // ── Cookie refresh ────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = setInterval(() => {
      fetchVideoAccess(videoCode).catch(() => { });
    }, COOKIE_REFRESH_MS);
    return () => clearInterval(id);
  }, [videoCode]);

  // ── Retry after 403 ───────────────────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await fetchVideoAccess(videoCode);
      const resumeAt = player.currentTime ?? 0;
      player.replace({ uri: videoData.url });
      setTimeout(() => {
        player.currentTime = resumeAt;
        player.play();
      }, 300);
      setHasError(false);
    } catch {
    } finally {
      setRetrying(false);
    }
  }, [videoCode, player, videoData.url]);

  // ── Fetch subtitles (web only) ────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (async () => {
      const result: typeof webSubtitleData = {};
      for (const lang of videoData.subtitles) {
        try {
          const res = await fetch(getSubtitleUrl(videoData.url, lang), {
            credentials: 'include',
          });
          if (res.ok) result[lang] = parseVTT(await res.text());
        } catch { }
      }
      setWebSubtitleData(result);
    })();
  }, []);

  const sharedProps = {
    player,
    videoData,
    selectedLang,
    onSelectedLangChange: setSelectedLang,
    webSubtitleData,
    hasError,
    onVideoError: () => setHasError(true),
    onRetry: handleRetry,
    navigation,
  };

  return (
    <>
      {/* Subtitle bar */}
      {videoData.subtitles.length > 0 && (
        <View style={styles.subtitleBar}>
          <Text style={styles.subtitleBarLabel}>{videoData.subtitles.length > 1 ? 'Sous-titres disponibles' : 'Sous-titre disponible'} :</Text>
          <View style={styles.subtitlePills}>
            {videoData.subtitles.map((s, i) => (
              <Text key={i} style={styles.subtitlePillText}>{LANG_LABELS[s]}{i < videoData.subtitles.length - 1 ? ', ' : ''}</Text>
            ))}
          </View>
        </View>
      )}

      {/* ── Embedded player ─────────────────────────────────────────────── */}
      <View style={{ width: embedWidth, height: embedHeight, overflow: 'hidden' }}>
        <CorePlayer
          {...sharedProps}
          videoWidth={embedWidth}
          videoHeight={embedHeight}
          isFullscreen={false}
          isActive={!fullscreen}
          seekOnActive={pendingSeekRef.current}
          onRequestFullscreen={openFullscreen}
          onExitFullscreen={() => { }}
        />
      </View>

      {/* ── Sommaire sous le player (mode embedded uniquement) ──────────── */}
      {showChapters && !fullscreen && (
        <EmbeddedSommaire
          highlights={videoData.highlights}
          currentTime={currentTime}
          duration={duration}
          onSeek={t => { player.currentTime = t; player.play(); }}
        />
      )}

      {/* ── Fullscreen modal ─────────────────────────────────────────────── */}
      <Modal
        visible={fullscreen}
        animationType="fade"
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar hidden />
          <CorePlayer
            {...sharedProps}
            videoWidth={screenWidth}
            videoHeight={screenHeight}
            isFullscreen={true}
            isActive={fullscreen}
            seekOnActive={pendingSeekRef.current}
            onRequestFullscreen={() => { }}
            onExitFullscreen={closeFullscreen}
          />
        </View>
      </Modal>

      {retrying && (
        <View style={[StyleSheet.absoluteFillObject, styles.retryingOverlay]}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.retryingText}>Reconnexion…</Text>
        </View>
      )}
    </>
  );
};

// ─── VideoPlayer (public) ─────────────────────────────────────────────────────

export const VideoPlayer = ({ videoCode, navigation, embedWidth, showChapters = true, trackingId }: VideoPlayerProps) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  const resolvedCode = videoCode;
  const width = embedWidth ?? (Dimensions.get('window').width - 48);
  const height = Math.round(width * 9 / 16);

  useEffect(() => {
    fetchVideoAccess(resolvedCode).then(data => {
      setVideoData(data);
      setLoading(false);
    });
  }, [resolvedCode]);

  if (loading || !videoData) {
    return (
      <View style={{ width, height, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <VideoPlayerReady
      videoCode={resolvedCode}
      videoData={videoData}
      embedWidth={width}
      embedHeight={height}
      navigation={navigation}
      showChapters={showChapters}
      trackingId={trackingId}
    />
  );
};

// ─── VideoPlayerScreen (backward-compat alias) ────────────────────────────────

export const VideoPlayerScreen = ({ navigation }: { navigation?: any }) => (
  <Modal
    visible
    animationType="fade"
    statusBarTranslucent
    supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
  >
    <View style={styles.fullscreenContainer}>
      <StatusBar hidden />
      <VideoPlayer navigation={navigation} />
    </View>
  </Modal>
);

// ─── Sommaire Styles ──────────────────────────────────────────────────────────

const sommaireStyles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10, 10, 14, 0.9)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerLabel: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingRight: 16,
    paddingLeft: 12,
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 2,
    overflow: 'hidden',
  },
  rowActive: {
    backgroundColor: 'rgba(229,9,20,0.07)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  accentBarActive: {
    backgroundColor: '#E50914',
  },
  indexBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexBubblePassed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  indexBubbleActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  indexText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
  },
  indexTextLight: {
    color: '#fff',
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
    marginBottom: 3,
  },
  rowLabelActive: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
  },
  rowTime: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  miniBar: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    pointerEvents: 'box-none' as any,
    backgroundImage:
      Platform.OS === 'web'
        ? 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.75) 100%)'
        : undefined,
  } as any,
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '60%',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ccButton: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ccButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.75)',
  },
  ccText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.8,
  },
  ccTextActive: { color: '#fff' },
  activeDot: {
    position: 'absolute',
    top: -4, right: -4,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  hlListBtn: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hlListBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.75)',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  playPauseBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  seekBtnLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  progressWrapper: { paddingTop: 8 },
  progressTrackHitArea: { height: 28, justifyContent: 'center' },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: '#E50914',
    borderRadius: 2,
    zIndex: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    marginLeft: -7,
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#E50914',
    shadowColor: '#E50914',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 5,
  },
  hlDot: {
    position: 'absolute',
    top: -4,
    marginLeft: -4,
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    zIndex: 2,
  },
  highlightTooltip: {
    position: 'absolute',
    bottom: 30,
    pointerEvents: 'none' as any,
  },
  tooltipBubble: {
    backgroundColor: TOOLTIP_BG,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: TOOLTIP_WIDTH,
  },
  tooltipLabel: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tooltipTime: {
    color: '#E8C97A',
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0, height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: TOOLTIP_BG,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Poppins-Regular' },
  subtitleOverlay: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  subtitleText: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 4,
    fontSize: 15,
    fontFamily: 'Roboto',
    textAlign: 'center',
    overflow: 'hidden',
  },
  subtitlePanelAnchor: {
    position: 'absolute',
    top: 56, right: 60,
    zIndex: 200,
  },
  panel: {
    width: 210,
    backgroundColor: TOOLTIP_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  panelHeader: { paddingHorizontal: 16, paddingTop: 14 },
  panelTitle: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  checkDot: {
    width: 16, height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotActive: { borderColor: '#E50914' },
  checkDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E50914' },
  panelRowText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'Poppins-Regular', flex: 1 },
  panelRowTextActive: { color: '#fff', fontFamily: 'Poppins-Medium' },
  activeBadge: {
    backgroundColor: 'rgba(229,9,20,0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.4)',
  },
  activeBadgeText: { color: '#E50914', fontSize: 9, fontFamily: 'Poppins-Medium', letterSpacing: 0.8 },
  highlightsPanelAnchor: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 260,
    zIndex: 200,
  },
  highlightsPanel: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(10,10,14,0.96)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  highlightsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  highlightsPanelTitle: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  highlightsPanelClose: { padding: 4 },
  highlightsPanelDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  highlightItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  highlightItemActive: { backgroundColor: 'rgba(229,9,20,0.08)' },
  highlightItemLeft: { position: 'absolute', left: 14, top: 14 },
  hlIndexDot: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hlIndexDotPassed: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' },
  hlIndexDotActive: { backgroundColor: '#E50914', borderColor: '#E50914' },
  hlIndexText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'Poppins-Medium' },
  highlightItemBody: { paddingLeft: 32 },
  highlightItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins-Regular' },
  highlightItemLabelActive: { color: '#fff', fontFamily: 'Poppins-Medium' },
  highlightItemTime: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Poppins-Regular', marginTop: 2 },
  hlMiniBar: {
    marginTop: 8,
    marginLeft: 32,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  hlMiniBarFill: { height: '100%', borderRadius: 1 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },
  errorCard: {
    backgroundColor: 'rgba(18,18,22,0.97)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    maxWidth: 300,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 24,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,9,20,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(229,9,20,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
  },
  errorBody: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
    backgroundColor: '#E50914',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
  },
  errorRetryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.3,
  },
  retryingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 600,
  },
  retryingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },

  subtitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subtitleBarLabel: {
    color: Colors.gray,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginRight: 2,
  },
  subtitlePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  subtitlePillText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});