import { useState } from "react"
import { Text, View, Image, Dimensions } from "react-native"
import { FlipCard } from "../../../component/FlipCard"
import { LinearGradient } from "expo-linear-gradient"
import { PointedText } from "../../../component/PointedText"

import YoutubePlayer from "react-native-youtube-iframe";

export default IntroPage4 = () => {
    const [isPlaying, setIsPlaying] = useState(false)
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
            width: "95%", height: "95%"
        }}>
            <FlipCard
                onFlip={() => {
                    if (isPlaying == false) {
                        setTimeout(()=>{
                            setIsPlaying(true)
                        }, 1000)
                    }
                }}
                frontComponent={
                    <LinearGradient
                        colors={['#3F70A7', '#162754']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ flex: 1, borderRadius: 20, padding: 30, justifyContent: 'space-around' }}
                    >
                        <Image
                            source={require('../../../../assets/logo-text-white.png')}
                            style={{
                                height: '5%', width: '100%',
                                resizeMode: 'contain',
                                position: 'absolute',
                                top: 10,
                                alignSelf: 'center',
                            }}
                        />
                        <View style={{
                        }}>
                            <Text style={{
                                fontSize: 25,
                                fontWeight: 'bold',
                                color: "#ffaf31",
                            }}>Pendant</Text>
                            <Text style={{
                                color: "#ffaf31",
                                fontWeight: 'bold',
                                marginBottom: 30
                            }}>votre prise en charge patient</Text>


                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Trouvez rapidement les solutions adaptées à chaque besoin
                            </PointedText>
                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Les bonnes méthodologies pour gagner du temps / qualité
                            </PointedText>
                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Supports d’information patient pour plus d’adhésion et d’observance
                            </PointedText>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                        }}>
                            <Image
                                source={require('../../../../assets/intro/loupe.png')}
                                style={{
                                    width: Dimensions.get("window").width * 0.20,
                                    height: Dimensions.get("window").width * 0.20,
                                    resizeMode: 'contain'
                                }}
                            />
                            <Image
                                source={require('../../../../assets/intro/sablier.png')}
                                style={{
                                    width: Dimensions.get("window").width * 0.20,
                                    height: Dimensions.get("window").width * 0.20,
                                    resizeMode: 'contain'
                                }}
                            />
                            <Image
                                source={require('../../../../assets/intro/ampoule.png')}
                                style={{
                                    width: Dimensions.get("window").width * 0.20,
                                    height: Dimensions.get("window").width * 0.20,
                                    resizeMode: 'contain'
                                }}
                            />
                        </View>
                    </LinearGradient>
                }
                backComponent={
                    <View style={{
                        backgroundColor: '#181818',
                        flex: 1, borderRadius: 20,
                        alignItems: 'center',
                        padding: 10
                    }}>
                        <View style={{ alignSelf: 'flex-start', marginVertical: 50 }}>
                            <Text style={{
                                fontSize: 25,
                                fontWeight: 'bold',
                                color: "#ffaf31",
                            }}>Pendant</Text>
                            <Text style={{
                                color: "#ffaf31",
                                fontWeight: 'bold',
                                marginBottom: 30
                            }}>votre prise en charge patient</Text>
                        </View>
                        <View style={{
                            height: "40%", width: '100%'
                        }}>
                            <YoutubePlayer
                                webViewProps={{
                                    androidLayerType: 'none',
                                    androidHardwareAccelerationDisabled: false
                                }}
                                width={"100%"}
                                height={"100%"}
                                play={isPlaying}
                                videoId={"uuGYEYeqkhg"}
                                initialPlayerParams={{
                                    modestbranding: 1
                                }}

                            />
                        </View>

                    </View>
                }
            />
        </View>
    </View>
}