import React, { useState } from "react";

import {
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    Dimensions,
    Linking
} from "react-native";

import { Page1, Page2, Page3 } from "./Pages";

import Carousel from "react-native-snap-carousel";

export const AuthHome = ({navigation}) => {
    const [indicatorIndex, setIndicatorIndex] = useState(0)
    const pages = [<Page1 />, <Page2 />, <Page3 />]

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={'default'} />
            <Carousel
                data={pages}
                renderItem={item => pages[indicatorIndex]}
                sliderWidth={Dimensions.get('screen').width}
                itemWidth={Dimensions.get('screen').width}
                onSnapToItem={(e) => setIndicatorIndex(e)}
            />
            <View style={styles.carouselIndicatorContainer}>
                {
                    pages.map((element, index) => (
                        <View
                            key={index}
                            style={[styles.carouselIndicator, {
                                backgroundColor: indicatorIndex == index ? '#E75A08' : '#828392',
                            }]} />
                    ))
                }
            </View>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={[styles.button,
                {
                    backgroundColor: '#828392'
                }]}
                onPress={()=>{
                    navigation.navigate('auth-home')
                }}
                >
                    <Text style={styles.buttonText}>Se connecter</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, {
                    backgroundColor: '#E75A08'
                }]}
                onPress={()=>{
                    Linking.canOpenURL("https://www.orthomaster.fr/contact").then(supported => {
                        if (supported) {
                          Linking.openURL("https://www.orthomaster.fr/contact");
                        } else {
                          console.log("Don't know how to open URI: www.orthomaster.fr");
                        }
                      });
                }}
                >
                    <Text style={styles.buttonText}>S'inscrire</Text>
                </TouchableOpacity>
            </View>
            
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    carouselIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '15%'
    },
    carouselIndicator: {
        width: 10,
        height: 10,
        borderRadius: 10
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 90
    },
    button: {
        backgroundColor: 'red',
        flex: 1,
        marginHorizontal: 10,
        marginTop: 30,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        fontSize: 18,
        color: '#ffffff'
    }
})