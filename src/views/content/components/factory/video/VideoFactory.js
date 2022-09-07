import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    View,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";

import { VideoControls } from './VideoControls';
import { VideoFullScreenModal } from './VideoFullScreenModal';

export const VideoFactory = ({ video }) => {
    //const [isPlaying, setIsPlaying] = useState(false)
    //const playerRef = useRef()
    //const [isFullScreen, setIsFullScreen] = useState(false)

    // const jumpTime = async (time) => {
    //     playerRef.current.seekTo(await playerRef.current.getCurrentTime() + time)
    // }

    //   const togglePlaying = useCallback(() => {
    //     setIsPlaying((prev) => !prev);
    //   }, []);

    //   useEffect(() => {
    //   console.log('video isPlaying: ', isPlaying);
    // }, [isPlaying])
    

    return <View
        style={styles.container}

    >
        <View>
            <YoutubePlayer
                    //ref={playerRef}
                    height={Dimensions.get('screen').width * 9 / 16}
                    videoId={video.attributes['src']}
                    initialPlayerParams={{
                        modestbranding: 1
                    }}
                    forceAndroidAutoplay
                    //play={isPlaying}
                    //onChangeState={(e)=>console.log(e)}
                    //webViewStyle={ {androidLayerType:  Platform.OS==="android" && Platform.Version<=22 ? "hardware" : "none"} }
                />
                {/* <Text style={{color: '#ffffff'}}>{playerRef.current.getCurrentTime()}</Text> */}
                <TouchableOpacity 
                pointerEvents='none'
                style={{
                width: Dimensions.get('screen').width / 6,
                height: Dimensions.get('screen').width / 7,
                position: 'absolute',
                alignSelf: 'flex-end',
            }}/>
            </View>
        {/* <VideoControls
            videoRef={playerRef}
            running={isPlaying}
            theme={'dark'}
            onPlay={togglePlaying}
            onJumpBefore={() => {
                jumpTime(-10)
            }}
            onJumpAfter={() => {
                jumpTime(10)
            }}
            onFullScreen={async() => {
                setIsFullScreen(true)
                setIsPlaying(false)
            }}
        /> */}
{/* 
        {
            isFullScreen ?
                <VideoFullScreenModal
                    videoUrl={video.attributes['src']}
                    visible={isFullScreen}
                    onClose={() => setIsFullScreen(false)}
                    isRunning={isPlaying}
                />
                : null
        } */}


    </View>
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        width: '100%',
        marginTop: 10,
    }
})