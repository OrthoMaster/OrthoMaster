import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Text, ScrollView, Button, Alert, Platform } from 'react-native';
import { useEventListener } from 'expo';
import { useState, useEffect, useRef } from 'react';

export const DebugScreen = () => {
  const [logs, setLogs] = useState([]);
  const scrollViewRef = useRef(null);

  const addLog = (msg, type = 'info') => {
    const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(log);
    setLogs(prev => {
      const newLogs = [...prev, { msg: log, type }];
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return newLogs;
    });
  };

  
  const videoUrl = 'https://d3lrkl4e90agju.cloudfront.net/orthomaster_fairplay_video_010/14249142_3840_2160_24fps.m3u8'
  const licenseServer = 'https://fps.ezdrm.com/api/licenses/<your-account-id>';
  const certificateUrl = 'https://yourcdn.com/fairplay.cer';
  
  const rootUrl = 'https://d3lrkl4e90agju.cloudfront.net/8f68ca48-572c-49b9-b311-2bf7d90115f3';
  // FIX: Dùng useRef thay vì useState để tránh re-render
  const cacheBypass = useRef(Date.now()).current;
  const cloudFrontUrl = `${rootUrl}/master.m3u8?v=${cacheBypass}`;

  const testAllFiles = async () => {
    addLog('🔍 Starting comprehensive test...', 'info');
    addLog(`📱 Platform: ${Platform.OS}`, 'info');
    addLog(`🔄 Cache bypass: ${cacheBypass}`, 'info');

    // Tạo timestamp mới cho mỗi test
    const ts = Date.now();

    const files = [
      { name: 'Master Playlist', url: `${rootUrl}/master.m3u8?v=${ts}` },
      { name: 'Encryption Key', url: `${rootUrl}/keys/e0ce607e-0e18-4b08-8edc-7081cac60242.key?v=${ts}` },
      { name: '480p Playlist', url: `${rootUrl}/480p/playlist.m3u8?v=${ts}` },
    ];

    for (const file of files) {
      addLog(`\n📄 Testing: ${file.name}`, 'info');

      try {
        const startTime = Date.now();
        const response = await fetch(file.url);
        const loadTime = Date.now() - startTime;

        addLog(`  ✓ Status: ${response.status} (${loadTime}ms)`, response.ok ? 'success' : 'error');
        
        // Check cache status
        const cacheStatus = response.headers.get('x-cache');
        if (cacheStatus) {
          const isMiss = cacheStatus.includes('Miss');
          addLog(`  ${isMiss ? '✓' : '⚠'} Cache: ${cacheStatus}`, isMiss ? 'success' : 'warning');
        }
        
        addLog(`  ✓ Content-Type: ${response.headers.get('content-type')}`, 'info');

        // Test CORS
        const corsLower = response.headers.get('access-control-allow-origin');
        const corsUpper = response.headers.get('Access-Control-Allow-Origin');
        const corsAny = corsLower || corsUpper;

        if (corsAny) {
          addLog(`  ✓ CORS: ${corsAny}`, 'success');
        } else {
          addLog(`  ✗ CORS: MISSING! (cached)`, 'error');
          // List all headers để debug
          try {
            let headerCount = 0;
            response.headers.forEach((value, key) => {
              addLog(`    ${key}: ${value}`, 'info');
              headerCount++;
            });
          } catch (e) {
            addLog(`  ℹ Cannot enumerate headers`, 'warning');
          }
        }

        if (file.name === '480p Playlist') {
          const text = await response.text();
          addLog(`  ✓ Playlist size: ${text.length} chars`, 'info');

          // Check encryption
          const hasEncryption = text.includes('#EXT-X-KEY');
          addLog(`  ${hasEncryption ? '🔐' : 'ℹ️'} Encryption: ${hasEncryption ? 'YES' : 'NO'}`, hasEncryption ? 'warning' : 'info');
          
          if (hasEncryption) {
            const keyLine = text.split('\n').find(line => line.includes('#EXT-X-KEY'));
            addLog(`  🔑 Key: ${keyLine}`, 'info');
          }

          // Parse playlist
          const lines = text.split('\n');
          const hasHeader = lines[0]?.includes('#EXTM3U');
          addLog(`  ${hasHeader ? '✓' : '✗'} HLS header: ${hasHeader ? 'valid' : 'MISSING!'}`, hasHeader ? 'success' : 'error');

          // Count segments
          const segments = text.match(/\.(ts|m4s)\b/g);
          if (segments) {
            addLog(`  ✓ Found ${segments.length} video segments`, 'success');

            // Test first segment
            const segmentMatch = text.match(/^[^#\n].+\.(ts|m4s)$/m);
            if (segmentMatch) {
              const segmentName = segmentMatch[0].trim();
              const segmentUrl = segmentName.startsWith('http')
                ? segmentName
                : `${rootUrl}/480p/${segmentName}?v=${ts}`;

              addLog(`  📦 Testing first segment: ${segmentName}`, 'info');

              try {
                const segStart = Date.now();
                const segResponse = await fetch(segmentUrl, { method: 'HEAD' });
                const segTime = Date.now() - segStart;

                if (segResponse.ok) {
                  const segSize = segResponse.headers.get('content-length');
                  addLog(`    ✓ Segment OK: ${segResponse.status} (${segTime}ms, ${segSize} bytes)`, 'success');

                  const segCors = segResponse.headers.get('access-control-allow-origin');
                  addLog(`    ${segCors ? '✓' : '⚠'} Segment CORS: ${segCors || 'not found'}`, segCors ? 'success' : 'warning');
                } else {
                  addLog(`    ✗ Segment failed: ${segResponse.status}`, 'error');
                }
              } catch (segError) {
                addLog(`    ✗ Segment error: ${segError.message}`, 'error');
              }
            }
          } else {
            addLog(`  ✗ No segments found in playlist!`, 'error');
          }
        }

        if (file.name === 'Master Playlist') {
          const text = await response.text();
          addLog(`  ✓ Master playlist size: ${text.length} chars`, 'info');
          addLog(`  📄 Content:`, 'info');
          text.split('\n').forEach(line => {
            if (line.trim()) addLog(`    ${line}`, 'info');
          });
        }

      } catch (error) {
        addLog(`  ✗ ERROR: ${error.message}`, 'error');
        if (error.stack) {
          addLog(`  Stack: ${error.stack.split('\n')[0]}`, 'error');
        }
      }
    }

    addLog('\n✅ Test complete!', 'success');
  };

  // Video source - TẠM THỜI BỎ DRM
  const videoSource = {
    uri: cloudFrontUrl,
    // Comment DRM config để test playback trước
    // drm: {
    //   type: 'fairplay',
    //   certificateUrl: 'https://cms.orthomaster.fr/api/fairplay/certificate',
    //   licenseServerUrl: 'https://cms.orthomaster.fr/api/fairplay/license',
    //   getLicense: async (spc) => {
    //     const res = await fetch('https://cms.orthomaster.fr/api/fairplay/license', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/octet-stream' },
    //       body: spc,
    //     });
    //     if (!res.ok) throw new Error('FairPlay license failed');
    //     return res.arrayBuffer();
    //   }
    // }
  };

  const player = useVideoPlayer(videoSource, (player) => {
    addLog('🎬 Video player initialized', 'info');
    addLog(`  URI: ${cloudFrontUrl}`, 'info');
  });

  useEventListener(player, 'statusChange', ({ status, error, oldStatus }) => {
    if (oldStatus) {
      addLog(`📊 Status: ${oldStatus} → ${status}`, status === 'error' ? 'error' : 'info');
    } else {
      addLog(`📊 Status: ${status}`, status === 'error' ? 'error' : 'info');
    }

    if (error) {
      addLog(`\n❌ PLAYBACK ERROR DETECTED`, 'error');
      addLog(`  Message: ${error.message || 'No message'}`, 'error');
      addLog(`  Code: ${error.code || 'No code'}`, 'error');

      if (error.localizedDescription) {
        addLog(`  iOS Description: ${error.localizedDescription}`, 'error');
      }
      if (error.domain) {
        addLog(`  iOS Domain: ${error.domain}`, 'error');
      }

      const errorStr = JSON.stringify(error, null, 2);
      addLog(`  Full Error:\n${errorStr}`, 'error');

      Alert.alert(
        'Playback Error',
        `${error.message || 'Unknown error'}\n\nCode: ${error.code || 'N/A'}\n\nCheck logs for details`,
        [{ text: 'OK' }]
      );
    }
  });

  useEventListener(player, 'sourceLoad', (payload) => {
    addLog('\n🎉 SOURCE LOADED SUCCESSFULLY!', 'success');
    addLog(`  Duration: ${payload.duration?.toFixed(2)}s`, 'success');
    addLog(`  Video tracks: ${payload.availableVideoTracks?.length || 0}`, 'info');
    addLog(`  Audio tracks: ${payload.availableAudioTracks?.length || 0}`, 'info');

    if (payload.availableVideoTracks?.length > 0) {
      payload.availableVideoTracks.forEach((track, i) => {
        addLog(`    Track ${i}: ${track.width}x${track.height}`, 'info');
      });
    }
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    addLog(`${isPlaying ? '▶️' : '⏸️'} Playing: ${isPlaying}`, isPlaying ? 'success' : 'info');
  });

  useEffect(() => {
    addLog('🚀 Component mounted', 'info');
    testAllFiles();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 HLS Playback Debug</Text>

      <View style={styles.buttons}>
        <Button title="🔍 Test" onPress={testAllFiles} />
        <Button
          title="▶️ Play"
          onPress={() => {
            addLog('\n▶️ Play button pressed', 'info');
            player.play();
          }}
        />
        <Button
          title="⏸️ Pause"
          onPress={() => {
            addLog('⏸️ Pause button pressed', 'info');
            player.pause();
          }}
        />
        <Button title="🗑️ Clear" onPress={() => setLogs([])} />
      </View>

      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        onVideoFirstFrame={() => {
          addLog('\n🎉🎉🎉 FIRST FRAME RENDERED! 🎉🎉🎉', 'success');
          addLog('Video is playing successfully!', 'success');
          Alert.alert('Success! 🎉', 'Video is playing!');
        }}
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Status: {player.status} | Playing: {player.playing ? 'Yes' : 'No'}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.logContainer}
        contentContainerStyle={styles.logContent}
      >
        {logs.map((log, i) => (
          <Text
            key={i}
            style={[
              styles.log,
              log.type === 'error' && styles.errorLog,
              log.type === 'success' && styles.successLog,
              log.type === 'warning' && styles.warningLog,
            ]}
          >
            {log.msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

// styles không đổi...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#111',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: '#111',
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  statusBar: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  statusText: {
    color: '#0f0',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  logContent: {
    padding: 10,
  },
  log: {
    color: '#888',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 3,
    lineHeight: 14,
  },
  errorLog: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  successLog: {
    color: '#00ff00',
    fontWeight: 'bold',
  },
  warningLog: {
    color: '#ffaa00',
  },
});

export default DebugScreen;