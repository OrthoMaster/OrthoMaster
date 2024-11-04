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
  Dimensions,
  Platform
} from "react-native";

import YoutubePlayer from "react-native-youtube-iframe";

import { VideoControls } from "./VideoControls";


export const VideoFullScreenModal = ({
  videoUrl,
  isVisible,
  onClose,
  videoRef,
  isRunning
}) => {
  const [isPlaying, setIsPlaying] = useState(isRunning)
  const refPlayerFS = useRef()
  const [currentTime, setCurrentTime] = useState(-1)

  let dim = Dimensions.get('screen')

  const getCurTime = async () => {
    return await videoRef.current.getCurrentTime()
  }

  useEffect(() => {
    getCurTime()
      .then(time => {
        setCurrentTime(Math.round(time))
        setIsPlaying(true)
      })
  }, [refPlayerFS])


  const jumpTime = async (time) => {
    refPlayerFS.current.seekTo(await refPlayerFS.current.getCurrentTime() + time)
  }

  return (
    <Modal
      animationType="slide"
      visible={isVisible}
    // onRequestClose={() => {
    //   Alert.alert("Modal has been closed.");
    //   setModalVisible(!modalVisible);
    // }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          animated={true}
          backgroundColor="#000000"
          barStyle={'light-content'}
        />


        <View style={styles.displayerContainer}>

          {/* <View style={{ width: 300, height: 200, backgroundColor: 'yellow' }} /> */}


          <Pressable
            onPress={() => {
              setIsPlaying(!isPlaying)
            }}
            style={{
              // transform: [{ rotateZ:'90deg' }],
            }}
          >

            <View pointerEvents='none' style={{
              alignItems: 'center',
            }}>
              {
                currentTime > -1 &&
                <YoutubePlayer
                  ref={refPlayerFS}
                  width={dim.height * 0.7}
                  height={dim.height * 0.7 * 9 / 16}
                  videoId={videoUrl}
                  initialPlayerParams={{
                    controls: 0,
                    modestbranding: 1,
                    start: currentTime
                  }}
                  play={isPlaying}
                />
              }
            </View>
          </Pressable>
          <VideoControls
            videoRef={refPlayerFS}
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
            style={{
              width: dim.width,
            }}
          />

        </View>


        <TouchableOpacity style={[styles.closeButton, {
          top: dim.height * 0.8
        }]}
          onPress={() => onClose()}
        >
          <Image
            source={require('../../../../../../assets/navigation/close.png')}
            style={styles.closeButtonImg}
          />
        </TouchableOpacity>

      </SafeAreaView >
    </Modal >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center'

  },
  displayerContainer: {
    alignSelf: 'center',
    transform: [{ rotateZ: '90deg' }],
    alignItems: 'center',
    // width: Dimensions.get('screen').height * 0.8,
    // height: (Dimensions.get('screen').height * 0.8) * 9 / 16,
  },
  closeButton: {
    height: 50,
    width: 50,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    alignSelf: 'flex-end'
  },
  closeButtonImg: {
    height: '40%',
    width: '40%',
  }
})