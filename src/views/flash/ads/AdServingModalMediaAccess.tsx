import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from "expo";
import AntDesign from '@expo/vector-icons/AntDesign';

import { hmsToMilliseconds } from "../../../futils";
import { IVASTObject } from "../../../utils/interfaces";
import { constructVASTObjectWithUrlFromAdButler, saveVastEvent } from "../../../utils/vastTools";


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

const InterestModal = ({ visible, onClose }) => {

    return <Modal animationType="slide"
        transparent={true}
        visible={visible}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.9)" }}>
            <View style={{ width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20 }}>
                <Text style={{ fontWeight: 'bold' }}>Vous êtes sur le point d'avertir l'annonceur de votre intéressement.</Text>
                <Text>(Un email contenant vos coordonées l'avertira de votre intéret)</Text>

                <View style={{
                    display: 'flex', flexDirection: 'row',
                    width: '100%',
                    marginTop: 20
                }}>
                    <TouchableOpacity style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5
                    }}>
                        <Text style={{
                            color: '#fff',
                            backgroundColor: '#ffaf31',
                            width: '100%', paddingVertical: 20,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            borderRadius: 5
                        }}>Marquer mon intéret</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5
                    }}
                        onPress={onClose}
                    >
                        <Text style={{
                            color: '#fff',
                            backgroundColor: '#8E8E8E',
                            width: '100%', paddingVertical: 20,
                            textAlign: 'center',
                            borderRadius: 5
                        }}>En fait non</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
}

const DisplayAdModal = ({ vast, onAccess }) => {
    const player = useVideoPlayer(vast?.linearMedia?.mediaFiles[0], player => {
        player.loop = false;
        player.currentTime = 0;
        player.timeUpdateEventInterval = 1;
    });
    const [savedEvents, setSavedEvents] = useState([])
    const [currentTime, setCurrentTime] = useState(0); // en ms
    const [duration, setDuration] = useState(0); // en ms
    const [isComplete, setIsComplete] = useState(false)
    const [showInterestModal, setShowInterestModal] = useState(false)

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
            setDuration(hmsToMilliseconds(vast.linearMedia.duration))
            player.play()
            console.log("[ EVENT ] : start");
            console.log("[ EVENT ] : impression");
            setSavedEvents(["start", "impression"])

            width.value = withSpring(screenWidth * 0.9, { duration: 2000, dampingRatio: 1 });
            height.value = withSpring((screenWidth * 0.9) * 9 / 16, { duration: 2000, dampingRatio: 1 });
        }
    }, [vast])

    useEventListener(player, "timeUpdate", (payload) => {
        const curT = Math.round(payload.currentTime) * 1000
        const videoProgress = curT / duration

        switch (true) {
            case (videoProgress >= 0.25 && videoProgress < 0.5 && !savedEvents.includes("FirstQuartile")):

                setSavedEvents([...savedEvents, "FirstQuartile"])
                console.log("[ EVENT ] : FirstQuartile");
                break;
            case (videoProgress >= 0.5 && videoProgress < 0.75 && !savedEvents.includes("MidPoint")):
                setSavedEvents([...savedEvents, "MidPoint"])
                console.log("[ EVENT ] : MidPoint");
                break;
            case (videoProgress >= 0.75 && !savedEvents.includes("ThirdQuartile")):
                setSavedEvents([...savedEvents, "ThirdQuartile"])
                console.log("[ EVENT ] : ThirdQuartile");
                break;
            default:
                break;
        }

        setCurrentTime(curT);
    });
    useEventListener(player, "playToEnd", () => {
        console.log("[ EVENT ] : complete");
        setSavedEvents([...savedEvents, "complete"])
        setIsComplete(true)
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
                        height: "100%",
                    }}
                    contentFit="contain"
                    player={player}
                    allowsFullscreen={false}
                    allowsPictureInPicture={false}
                    allowsVideoFrameAnalysis={false}
                    nativeControls={false}
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
                backgroundColor: '#2DE485',
                alignSelf: 'center',
                borderRadius: 10,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 15, paddingHorizontal: 30
            }} onPress={() => {
                // onClose() // remove
                //TODO open interest modal
                console.log("[ EVENT ] : ClickTracking");
                setSavedEvents([...savedEvents, "ClickTracking"])

                player.pause() // if interested modal open
                setShowInterestModal(true)
            }}>
                <Text style={{ fontSize: 12, color: "#000", fontWeight: 'bold', textAlign: 'center' }}>Je suis interessé</Text>
            </TouchableOpacity>
            {
                isComplete &&
                <TouchableOpacity style={{
                    backgroundColor: '#ffaf31',
                    padding: 10,
                    borderWidth: 2,
                    borderColor: "#fff",
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    bottom: 100
                }}
                    onPress={onAccess}
                >
                    <Text style={{
                        color: "#fff",
                        fontWeight: "bold"
                    }}>Accéder au contenu</Text>
                    <AntDesign style={{ marginLeft: 15 }} name="arrowright" size={24} color="#fff" />
                </TouchableOpacity>
            }
        </View>
        <InterestModal visible={showInterestModal} onClose={() => {
            if (!isComplete)
                player.play()
            setShowInterestModal(false)
        }} />
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
                        onAccess={() => {
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