// TestVideoPlayer.tsx
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useEvent } from 'expo';
import {
  useVideoPlayer,
  VideoView,
  type VideoSource,
  type DRMOptions,
} from 'expo-video';

const HLS_URL =
  'https://d3lrkl4e90agju.cloudfront.net/orthomaster_fairplay_video_010/14249142_3840_2160_24fps_480p.m3u8';
const FAIRPLAY_CERT_URL =
  'https://d37m6zonbu2bpf.cloudfront.net/fairplay.cer';
const FAIRPLAY_LICENSE_URL =
  'https://fps.ezdrm.com/api/licenses/auth?px=061d34';

export default function TestVideoPlayer() {
  // Chỉ cấu hình DRM trên iOS (FairPlay chỉ có trên iOS/tvOS)
  const drm: DRMOptions | undefined = useMemo(() => {
    if (Platform.OS !== 'ios') return undefined;
    return {
      type: 'fairplay',
      certificateUrl: FAIRPLAY_CERT_URL,
      licenseServer: FAIRPLAY_LICENSE_URL,
      // Nếu EZDRM của bạn yêu cầu header (token, v.v.) cho request CKC thì thêm ở đây:
      headers: {
        // 'Authorization': 'Bearer <token>',
        'Content-Type': 'application/octet-stream', // đa số FairPlay license servers yêu cầu
      },
      // Nếu cần bạn có thể truyền contentId riêng cho asset:
      // contentId: '<your-fps-asset-id-or-custom-id>',
    };
  }, []);

  const source: VideoSource = useMemo(
    () => ({
      uri: HLS_URL,
      contentType: 'hls', // rõ ràng chỉ định HLS
      drm,
      // DRM HLS trên iOS không cache: theo docs cache DRM bị vô hiệu. :contentReference[oaicite:1]{index=1}
      // useCaching: false, // (mặc định là false)
      metadata: {
        title: 'FairPlay Test',
        artist: 'EZDRM + CloudFront',
      },
    }),
    [drm]
  );

  const player = useVideoPlayer(source, (p) => {
    p.muted = false;
    p.loop = false;
    p.play(); // tự động play khi sẵn sàng
  });

  // Bắt sự kiện để hiển thị trạng thái/ lỗi
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined as any,
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  return (
    <View style={styles.root}>
      <View style={styles.videoBox}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls
          allowsPictureInPicture
          onFirstFrameRender={() => {
            // có thể ẩn poster/loader nếu bạn thêm
          }}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.h1}>FairPlay HLS (EZDRM)</Text>
        <Text>Platform: {Platform.OS}</Text>
        <Text>Player status: {status}</Text>
        <Text>Playing: {String(!!isPlaying)}</Text>
        {error ? (
          <Text style={styles.err}>
            Error: {error.message ?? JSON.stringify(error)}
          </Text>
        ) : null}
        {Platform.OS !== 'ios' ? (
          <Text style={styles.note}>
            Lưu ý: FairPlay chỉ chạy trên iOS/tvOS. Trên Android, stream này sẽ
            không play (hãy dùng Widevine nếu cần).
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  videoBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111' },
  info: { padding: 12 },
  h1: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  err: { color: '#ff6b6b', marginTop: 6 },
  note: { color: '#bbb', marginTop: 6 },
});
