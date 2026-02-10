import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

export const AuthHome = ({ navigation }) => {
  const [showButtons, setShowButtons] = useState(false);
  const slideAnim = useRef(new Animated.Value(200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSource = Platform.OS !== 'android'
    ? require('../../../assets/v2_images/intro.mp4')
    : { uri: 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/intro-video/intro.mp4' };
  const videoUrl = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/intro-video/intro.mp4';

  const player = Platform.OS !== 'web' ? useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.play();
  }) : null;

  useEffect(() => {
    // Auto-play for web
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.play().catch(err => {});
    }

    const timeout = setTimeout(() => {
      setShowButtons(true);
    }, Platform.OS === 'ios' ? 8000 : 9000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (showButtons) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showButtons]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.wrapper}>
      {Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          muted
          playsInline
          autoPlay
          loop={false}
        />
      ) : (
        <VideoView
          style={styles.video}
          player={player}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="cover"
          allowsVideoFrameAnalysis={false}
          requiresLinearPlayback={true}
          pointerEvents="none"
        />
      )}

      {showButtons && (
        <Animated.View
          style={[
            styles.bottomView,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <TouchableOpacity
            style={[Styles.btnPrimary, { width: '70%' }]}
            onPress={() => navigation.navigate('auth-home')}
            activeOpacity={0.8}
          >
            <Text style={Styles.btnPrimaryText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[Styles.btnWhite,
            { width: '70%', marginTop: Spacings.md, backgroundColor: '#000' }]}
            onPress={() => Platform.OS !== 'web' ? navigation.navigate('register') : window.open('https://auth.orthomaster.fr', '_blank')}
          >
            <Text style={Styles.btnWhiteText}>Créer un compte</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingBottom: Platform.OS !== 'web' ? 0 : Spacings.xxxl, 
  },
  wrapper: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bottomView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: Spacings.lg,
    paddingBottom: Spacings.xxxl,
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    fontSize: 32,
    marginTop: Spacings.md
  },
});