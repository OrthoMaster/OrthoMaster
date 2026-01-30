import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
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

  const videoSource = require('../../../assets/v2_images/intro.mp4');
  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowButtons(true);
    }, 8000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Animation when showButtons = true
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
            onPress={() => navigation.navigate('register')}
          >
            <Text style={[Styles.btnWhiteText, {}]}>
              Créer un compte
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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