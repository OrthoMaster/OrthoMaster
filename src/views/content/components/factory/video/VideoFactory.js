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

import { useVideoPlayer, VideoView } from 'expo-video';

import { useQuery } from "@tanstack/react-query";
import { getCdnContentAccessUrl } from '../../../../../services/ContentService';




const SummaryVideoFactory = ({ summary, onSelectChapter }) => {

    return <View style={{ alignItems: 'center', marginTop: 30 }}>
        <Text style={styles.sectionHeaderText}>
            Accès direct
        </Text>
        <Text style={[styles.sectionSubHeaderText, { marginVertical: 20 }]}>
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

const DefaultPlayer = ({ videoUrl, seekTo }) => {

    const player = useVideoPlayer(videoUrl, player => {
        player.loop = true;
        player.play();
    });

    useEffect(() => {
        player.currentTime = seekTo
    }, [seekTo])



    return <VideoView
        style={{
            width: "100%",
            height: Dimensions.get('screen').width * 9 / 16,
            marginTop: 10
        }}
        contentFit="contain"
        player={player}
        nativeControls={true}
        allowsFullscreen
        allowsPictureInPicture
    />
}

const MyYoutubePlayer = ({ videoId, seekTo }) => {

    const [isPlaying, setIsPlaying] = useState(false)
    const playerRef = useRef(null)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [key, setKey] = useState(0); // Ajoutez une clé unique pour le rechargement

    const jumpTime = async (time) => {
        playerRef.current.seekTo(await playerRef.current.getCurrentTime() + time)
    }

    const togglePlaying = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    useEffect(() => {
        setKey((prev) => prev + 1); // Incrémentez la clé pour recréer le composant
    
    }, [])
    
    useEffect(() => {
        playerRef.current.seekTo(seekTo)
    }, [seekTo])

    return <Pressable
        style={styles.container}
        onPress={() => {
            setIsPlaying(!isPlaying);
        }}>
        <View pointerEvents={'none'}>
            <YoutubePlayer
            key={key}
                webViewProps={{
                    androidLayerType: 'none',
                    androidHardwareAccelerationDisabled: false
                }}
                ref={playerRef}
                height={Dimensions.get('screen').width * 9 / 16}
                videoId={videoId}
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
            }}
        />

        {
            isFullScreen ?
                <VideoFullScreenModal
                    videoUrl={videoId}
                    visible={isFullScreen}
                    videoRef={playerRef}
                    onClose={() => setIsFullScreen(false)}
                    isRunning={isPlaying}
                />
                : null
        }


    </Pressable>
}

export const VideoFactory = ({ video, contentInfos }) => {
    const videoSummary = video.children.length > 0 && video.children.find(item => item.name === "summary")
    const [videoSeekTo, setVideoSeekTo] = useState(0)
    const videoUrl = useQuery({
        queryKey: ['video', video.attributes['src']],
        queryFn: () => getCdnContentAccessUrl(contentInfos.aws_object_path + video.attributes['src']),
        enabled: contentInfos.aws_object_path !== null
    })


    return <View style={{}}>
        {
            contentInfos.aws_object_path ?
                <DefaultPlayer videoUrl={videoUrl.data} seekTo={videoSeekTo} />
                :
                <MyYoutubePlayer videoId={video.attributes['src']} seekTo={videoSeekTo} />
        }

        {
            videoSummary &&
            <SummaryVideoFactory
                summary={videoSummary}
                onSelectChapter={(timeCode) => setVideoSeekTo(timeCode)}
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
