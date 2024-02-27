import { useState } from "react"
import { Text, View, StyleSheet, Image, Dimensions } from "react-native"
import { FlipCard } from "../../../component/FlipCard"
import { LinearGradient } from "expo-linear-gradient"
import { PointedText } from "../../../component/PointedText"

import YoutubePlayer from "react-native-youtube-iframe";


export default IntroPage3 = () => {
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
                        style={{ flex: 1, borderRadius: 20, padding: 20 }}
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
                            paddingTop: 50,
                            flex: 1
                        }}>
                            <Text style={{
                                fontSize: 25,
                                fontWeight: 'bold',
                                color: "#ffaf31",
                            }}>En amont</Text>
                            <Text style={{
                                color: "#ffaf31",
                                fontWeight: 'bold',
                                marginBottom: 30
                            }}>d'une prise en charge patient</Text>

                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Formez-vous et informez-vous
                            </PointedText>
                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                À votre rythme
                            </PointedText>
                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Seul(e) ou en équipe
                            </PointedText>
                            <PointedText pointColor={"#FFAF31"} style={{ color: '#fff', fontSize: 16 }}>
                                Monitorez votre progression
                            </PointedText>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            alignItems: 'flex-start',
                            flex: 1
                        }}>
                            <Image
                                source={require('../../../../assets/intro/formation.png')}
                                style={{
                                    width: Dimensions.get("window").width * 0.20,
                                    height: Dimensions.get("window").width * 0.20,
                                    resizeMode: 'contain'
                                }}
                            />
                            <Image
                                source={require('../../../../assets/intro/information.png')}
                                style={{
                                    width: Dimensions.get("window").width * 0.20,
                                    height: Dimensions.get("window").width * 0.20,
                                    resizeMode: 'contain'
                                }}
                            />
                            <Image
                                source={require('../../../../assets/intro/suivi.png')}
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
                        <View style={{ alignSelf: 'flex-start', marginVertical: 50}}>
                            <Text style={{
                                fontSize: 25,
                                fontWeight: 'bold',
                                color: "#ffaf31",
                            }}>En amont</Text>
                            <Text style={{
                                color: "#ffaf31",
                                fontWeight: 'bold',
                                marginBottom: 30
                            }}>d'une prise en charge patient</Text>
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
                                videoId={"eJm7kSisyKE"}
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

const styles = StyleSheet.create({

})