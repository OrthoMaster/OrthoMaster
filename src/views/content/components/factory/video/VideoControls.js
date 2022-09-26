import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image
} from "react-native";

export const VideoControls = ({
    running,
    onPlay,
    onJumpBefore,
    onJumpAfter,
    onFullScreen,
    theme,
    style
}) => {

    return (
        <View style={[styles.container, style]}>
            <View style={styles.videoControls}>
                <TouchableOpacity
                    style={styles.buttonVideoControl}
                    onPress={() => onJumpBefore()}
                >
                    <Image
                        source={
                            theme == 'dark' ?
                                require('../../../../../../assets/video/previous-black.png')
                                : require('../../../../../../assets/video/previous-white.png')
                        }
                        style={[styles.buttonImg, { width: '30%', height: '30%' }]}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonVideoControl}
                    onPress={() => {
                        onPlay()
                    }}
                >
                    <Image
                        source={
                            theme == 'dark' ?
                            running ? require('../../../../../../assets/video/pause-black.png') : require('../../../../../../assets/video/play-black.png')
                        :running ? require('../../../../../../assets/video/pause-white.png') : require('../../../../../../assets/video/play-white.png')
                        }
                        style={[styles.buttonImg, { width: '40%', height: '40%' }]}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonVideoControl}
                    onPress={() => onJumpAfter()}
                >
                    <Image
                        source={
                            theme == 'dark' ?
                            require('../../../../../../assets/video/next-black.png')
                            : require('../../../../../../assets/video/next-white.png')
                        }
                        style={[styles.buttonImg, { width: '30%', height: '30%' }]}
                    />
                </TouchableOpacity>

            </View>
            <TouchableOpacity
                style={[styles.button, {
                }]}
                onPress={() => onFullScreen()}
            >
                <Image
                    source={
                        theme == 'dark' ?
                        require('../../../../../../assets/video/fullscreen-black.png')
                        : require('../../../../../../assets/video/fullscreen-white.png')
                    }
                    style={[styles.buttonImg, { width: '40%', height: '40%' }]}
                />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 50,
    },
    videoControls: {
        height: '100%',
        width: '40%',
        flexDirection: 'row',
        alignSelf: 'center',
        flex: 1,
        justifyContent: 'center'
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '10%'
    },
    buttonVideoControl: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '20%'
    },
    buttonImg: {
        resizeMode: 'contain'
    }
})