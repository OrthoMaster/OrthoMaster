// // VideoFairPlay_NoAuth.tsx
// import React, { useRef, useState, useCallback } from 'react';
// import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
// import Video, { OnLoadData, OnErrorData } from 'react-native-video';

// const HLS_URL = 'https://d3lrkl4e90agju.cloudfront.net/orthomaster_fairplay_video_010/14249142_3840_2160_24fps_480p.m3u8';
// const FAIRPLAY_CERT_URL = 'https://d37m6zonbu2bpf.cloudfront.net/fairplay.cer';
// const FAIRPLAY_LICENSE_URL = 'https://fps.ezdrm.com/api/licenses/auth?px=061d34'; // ví dụ do EZDRM cung cấp

// export default function VideoFairPlayNoAuth() {
//   const playerRef = useRef<Video>(null);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);

//   // Không gửi x-dt-custom-data
//   const getLicense = useCallback(async (spcBase64: string, _contentId: string) => {
//     // decode base64 -> binary để gửi lên license server
//     const spcBinary = Uint8Array.from(atob(spcBase64), c => c.charCodeAt(0));

//     const res = await fetch(FAIRPLAY_LICENSE_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/octet-stream',
//         // KHÔNG có 'x-dt-custom-data'
//       },
//       body: spcBinary,
//     });

//     if (!res.ok) {
//       const txt = await res.text().catch(() => '');
//       throw new Error(`License error ${res.status}: ${txt}`);
//     }

//     // nhận CKC (binary) -> trả về base64 cho react-native-video
//     const ckcBuffer = await res.arrayBuffer();
//     let binary = '';
//     const bytes = new Uint8Array(ckcBuffer);
//     for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
//     return btoa(binary);
//   }, []);

//   return (
//     <View style={styles.container}>
//       {Platform.OS !== 'ios' ? (
//         <Text>FairPlay chỉ hỗ trợ iOS (Android dùng Widevine).</Text>
//       ) : (
//         <>
//           <Video
//             ref={playerRef}
//             source={{ uri: HLS_URL }}
//             style={styles.video}
//             controls
//             resizeMode="contain"
//             onLoadStart={() => setLoading(true)}
//             onLoad={(_e: OnLoadData) => setLoading(false)}
//             onError={(e: OnErrorData) => {
//               setErr(JSON.stringify(e?.error));
//               setLoading(false);
//             }}
//             drm={{
//               type: 'fairplay',
//               certificateUrl: FAIRPLAY_CERT_URL,
//               licenseServer: FAIRPLAY_LICENSE_URL,
//               getLicense,
//             }}
//             allowsExternalPlayback={false}
//             automaticallyWaitsToMinimizeStalling
//             paused={false}
//           />
//           {loading && (
//             <View style={styles.loader}>
//               <ActivityIndicator />
//               <Text style={styles.loaderText}>Đang tải video…</Text>
//             </View>
//           )}
//           {err && (
//             <View style={styles.errorBox}>
//               <Text style={styles.errorText}>Lỗi phát: {err}</Text>
//             </View>
//           )}
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   video: { width: '100%', height: '100%' },
//   loader: { position: 'absolute', top: 20, right: 20, padding: 8, backgroundColor: '#0008', borderRadius: 8 },
//   loaderText: { color: '#fff', marginTop: 6 },
//   errorBox: { position: 'absolute', bottom: 20, left: 20, right: 20, padding: 10, backgroundColor: '#300', borderRadius: 8 },
//   errorText: { color: '#f99' },
// });
