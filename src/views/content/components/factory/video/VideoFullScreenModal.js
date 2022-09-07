import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Modal,
  View,
  SafeAreaView,
  StatusBar,
  Image,
  Pressable,
  Dimensions
} from "react-native";

import YoutubePlayer from "react-native-youtube-iframe";

import { VideoControls } from "./VideoControls";


export const VideoFullScreenModal = ({
  videoUrl,
  isVisible,
  onClose,
}) => {
  const videoRef = useRef()
  const [isPlaying, setIsPlaying] = useState(true)

  let dim = Dimensions.get('screen')

  const jumpTime = async (time) => {
    videoRef.current.seekTo(await videoRef.current.getCurrentTime() + time)
  }

  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      supportedOrientations={['portrait', 'landscape']}
    // onRequestClose={() => {
    //   Alert.alert("Modal has been closed.");
    //   setModalVisible(!modalVisible);
    // }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          animated={true}
          backgroundColor="#61dafb"
          barStyle={'light-content'}
        />


        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
          <Pressable
            onPress={() => {
              setIsPlaying(!isPlaying)
            }}
            style={{}}
          >

            <View pointerEvents='none' style={{ alignItems: 'center' }}>
              <YoutubePlayer
                ref={videoRef}
                width={dim.height > dim.width ? dim.width : (dim.height - 60) * 16 / 9}
                height={dim.height > dim.width ? dim.width * 9 / 16 : dim.height - 60}
                videoId={videoUrl}
                initialPlayerParams={{
                  controls: 0,
                  modestbranding: 1
                }}
                play={isPlaying}
              />
              {/* <Text style={{color: '#ffffff'}}>{videoRef.current.getCurrentTime()}</Text> */}
            </View>
          </Pressable>
          <VideoControls
            videoRef={videoRef}
            running={isPlaying}
            theme='light'
            onPlay={() => {
              setIsPlaying(!isPlaying)
            }}
            onJumpBefore={() => {
              jumpTime(-10)
            }}
            onJumpAfter={() => {
              jumpTime(10)
            }}
            onFullScreen={() => {
              onClose()
            }}
          />

        </View>


        <TouchableOpacity style={[styles.closeButton, { top: Dimensions.get('screen').height > Dimensions.get('screen').width ? 30 : 5 }]}
          onPress={() => onClose()}
        >
          <Image
            source={require('../../../../../../assets/navigation/close.png')}
            style={styles.closeButtonImg}
          />
        </TouchableOpacity>

      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'column',
  },
  closeButton: {
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  closeButtonImg: {
    height: '40%',
    width: '40%',
  }
})