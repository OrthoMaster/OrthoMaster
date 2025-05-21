import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions, Image, ViewStyle, StyleProp } from "react-native";
import { constructVASTObjectWithUrlFromAdButler } from "../../../utils/vastParser";
import { IVASTObject } from "../../../utils/interfaces";
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { hmsToMilliseconds } from "../../../futils";
import { useEventListener, useEvent } from "expo";
const { width: screenWidth, height } = Dimensions.get("screen")


type AdServingModalMediaAccessProps = {
    enabled: boolean
    onClose: () => void;
    grantAccess: () => void;
}

type AdCardProps = {
    vastObj: IVASTObject,
    onSelect: (vast: IVASTObject) => void
}


const DisplayAdModal = ({ vast, onClose, onEnd }) => {

    const player = useVideoPlayer(vast?.linearMedia?.mediaFiles[0], player => {
        player.loop = false;
        player.currentTime = 0;
        player.play();
        player.timeUpdateEventInterval = 1;
    });
    const [currentTime, setCurrentTime] = useState(0); // en ms
    const [duration, setDuration] = useState(0); // en ms

    const width = useSharedValue(screenWidth / 3);
    const height = useSharedValue((screenWidth / 3) * 9 / 16);
    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    useEffect(() => {
        if (vast) {
            width.value = withSpring(screenWidth * 0.9, { duration: 2000, dampingRatio: 1 });
            height.value = withSpring((screenWidth * 0.9) * 9 / 16, { duration: 2000, dampingRatio: 1 });
        }
    }, [vast])

    useEffect(() => {
        setDuration(hmsToMilliseconds(vast.linearMedia.duration))
    }, []);

    useEventListener(player, "timeUpdate", (payload) => {
        setCurrentTime(Math.round(payload.currentTime) * 1000);
    });
    useEventListener(player, "playToEnd", () => {
        onEnd();
    });



    return <Modal animationType="slide"
        transparent={true}
        visible={vast !== null}
    >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.9)" }}>
            <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 10, color: '#fff' }}>{vast?.adTitle}</Text>
            <Animated.View style={{
                width,
                height,
            }}>
                <VideoView
                    style={{
                        width: "100%",
                        height: "100%"
                    }}
                    contentFit="contain"
                    player={player}
                    allowsFullscreen={false}
                    allowsPictureInPicture={false}
                    allowsVideoFrameAnalysis={false}
                    nativeControls={false}
                    showsTimecodes={true}
                />
                <View style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    padding: 5,

                }}>
                    <Text style={{
                        color: "#fff",
                        fontWeight: 'bold',
                        fontSize: 12,
                    }}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
                </View>
            </Animated.View>
            <TouchableOpacity style={{
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 50,
                width: 100,
                height: 100,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
            }} onPress={() => {
                onClose()
                player.currentTime = 0
                player.pause()
            }}>
                <Text style={{ fontSize: 12, color: "#fff", fontWeight: 'bold', textAlign: 'center' }}>ça m'intéresse</Text>
            </TouchableOpacity>
        </View>
    </Modal>
}

const AdCard: React.FC<AdCardProps> = ({ vastObj, onSelect }) => {
    const dummyPlayer = useVideoPlayer(vastObj.linearMedia.mediaFiles[0], dummyPlayer => {
        dummyPlayer.loop = false;
        dummyPlayer.muted = true;
        dummyPlayer.pause()
    });

    return <TouchableOpacity style={styles.buttonAdsContainer}
        onPress={() => {
            onSelect(vastObj)
        }}
    >
        <View style={{
            width: "100%",
            height: "100%",
        }}>
            <VideoView
                style={{
                    width: "100%",
                    height: "100%"
                }}
                contentFit="contain"
                player={dummyPlayer}
            />
        </View>
    </TouchableOpacity>
}

export const AdServingModalMediaAccess: React.FC<AdServingModalMediaAccessProps> = ({ enabled, onClose, grantAccess }) => {

    //const VAST_URL = "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&place=0&_abdk[Job Function]=pharmacien"
    // const VAST_URL = 'https://statics.dmcdn.net/h/html/vast/simple-inline.xml';

    const [vastArray, setvastArray] = useState<IVASTObject[]>([])
    const [selectedVAST, setSelectedVAST] = useState<IVASTObject>(null)



    useEffect(() => {
        constructVASTObjectWithUrlFromAdButler("VAST_URL")
            .then((vastObject: IVASTObject) => {
                setvastArray([vastObject])
            });

    }, [])

    if (vastArray.length > 0)
        return (
            <Modal animationType="slide"
                transparent={true}
                visible={enabled}
                onRequestClose={() => {
                    onClose()
                }}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Accès au média</Text>
                        <Text style={{ fontSize: 16, marginBottom: 20 }}>Afin de pouvoir accéder à ce contenu, veuillez séléctionnez une annonce à visionner.</Text>
                        <View style={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            backgroundColor: 'red',
                            justifyContent: 'center',
                        }}>
                            <AdCard vastObj={vastArray[0]}
                                onSelect={(vastObj) => {
                                    setSelectedVAST(vastObj)
                                }}
                            />
                            <AdCard vastObj={vastArray[0]}
                                onSelect={(vastObj) => {
                                    setSelectedVAST(vastObj)

                                }}
                            /><AdCard vastObj={vastArray[0]}
                                onSelect={(vastObj) => {
                                    setSelectedVAST(vastObj)

                                }}
                            />

                        </View>
                        <TouchableOpacity style={{
                            backgroundColor: '#ffaf31',
                            alignSelf: 'center',
                            paddingVertical: 5, paddingHorizontal: 15,
                            borderRadius: 5,
                            marginTop: 20,
                        }} onPress={onClose}>
                            <Text style={{ fontSize: 16, color: "#fff", fontWeight: 'bold' }}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {
                    selectedVAST &&
                    <DisplayAdModal
                        vast={selectedVAST}
                        onClose={() => {
                            setSelectedVAST(null)
                        }}
                        onEnd={() => {
                            setSelectedVAST(null)
                            grantAccess()
                        }}
                    />
                }
            </Modal>
        )
}



const styles = StyleSheet.create({
    buttonAdsContainer: {
        backgroundColor: "#f1F1F1",
        width: screenWidth / 3,
        height: (screenWidth / 3) * 9 / 16,
        margin: 5,
    }
})