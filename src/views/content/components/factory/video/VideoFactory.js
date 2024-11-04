import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    View,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Text
} from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";

import { VideoControls } from './VideoControls';
import { VideoFullScreenModal } from './VideoFullScreenModal';
import AntDesign from '@expo/vector-icons/AntDesign';

const SummaryVideoFactory = ({ summary, onSelectChapter }) => {

    return <View style={{ alignItems: 'center', marginTop: 30 }}>
        <Text style={styles.sectionHeaderText}>
            Accès direct
        </Text>
        <Text style={[styles.sectionSubHeaderText,{marginVertical: 20}]}>
            Temps forts de la vidéo
        </Text>
        <View style={{ width: "60%" }}>
            {
                summary.children.map((value, index) => {
                    return <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            paddingVertical: 5,
                            marginVertical: 2,
                            paddingLeft: 5,
                            backgroundColor: '#fff',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        key={index}
                        onPress={() => onSelectChapter(parseInt(value.attributes.time))}>
                        <View style={{ flex: 3 }}>
                            <Text style={{ fontSize: 15 }}>• {value.value}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <AntDesign name="playcircleo" size={18} color="#F38B8B" />
                        </View>
                    </TouchableOpacity>
                })
            }
        </View>
    </View>
}

export const VideoFactory = ({ video }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const playerRef = useRef()
    const [isFullScreen, setIsFullScreen] = useState(false)
    const videoSummary = video.children.length > 0 && video.children.find(item => item.name === "summary")

    const jumpTime = async (time) => {
        playerRef.current.seekTo(await playerRef.current.getCurrentTime() + time)
    }

    const togglePlaying = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);


    return <View style={{}}>
        <Pressable
            style={styles.container}
            onPress={() => {
                setIsPlaying(!isPlaying);
            }}>
            <View pointerEvents={'none'}>
                <YoutubePlayer
                    webViewProps={{
                        androidLayerType: 'none',
                        androidHardwareAccelerationDisabled: false
                    }}
                    ref={playerRef}
                    height={Dimensions.get('screen').width * 9 / 16}
                    videoId={video.attributes['src']}
                    initialPlayerParams={{
                        modestbranding: 1,
                        controls: 0,
                    }}
                    play={isPlaying}
                    onChangeState={event => {
                        if (event === 'paused') {
                            setIsPlaying(false);
                        }
                    }}
                />
            </View>
            <VideoControls
                //videoRef={playerRef}
                running={isPlaying}
                theme={'dark'}
                onPlay={togglePlaying}
                onJumpBefore={() => {
                    jumpTime(-10)
                }}
                onJumpAfter={() => {
                    jumpTime(10)
                }}
                onFullScreen={async () => {
                    setIsFullScreen(true)
                    //setIsPlaying(false)
                }}
            />

            {
                isFullScreen ?
                    <VideoFullScreenModal
                        videoUrl={video.attributes['src']}
                        visible={isFullScreen}
                        videoRef={playerRef}
                        onClose={() => setIsFullScreen(false)}
                        isRunning={isPlaying}
                    />
                    : null
            }


        </Pressable>
        {
            videoSummary &&
            <SummaryVideoFactory
                summary={videoSummary}
                onSelectChapter={(timeCode) => playerRef.current.seekTo(timeCode)}
            />
        }
    </View>


}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        width: '100%',
        marginTop: 10,
    },
    sectionHeaderText: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#fff',
        backgroundColor: "#F38B8B",
        fontSize: 40,
        width: '100%',
        paddingTop: 5, paddingLeft: 5
    },
    sectionSubHeaderText: {
        color: "#F38B8B",
        fontSize: 18
    }
})
