import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, StatusBar, Dimensions, ScrollView, StyleSheet, PixelRatio, TouchableOpacity } from "react-native";
import { useAsyncStorage } from "../../hooks/useAsyncStorage";

import IntroPage1 from "./pages/IntroPage1";
import IntroPage2 from "./pages/IntroPage2";
import IntroPage3 from "./pages/IntroPage3";
import IntroPage4 from "./pages/IntroPage4";
import IntroPage5 from "./pages/IntroPage5";
import IntroPage6 from "./pages/IntroPage6";



export const IntroView = ({ navigation, onClose }) => {
    const [introHasBeenDisplayed, setIntroDisplayed] = useAsyncStorage('intro-slider-displayed', false)
    const [sliderState, setSliderState] = useState({ currentPage: 0 });
    const { width, height } = Dimensions.get('window');

    const setSliderPage = (event) => {
        const { currentPage } = sliderState;
        const { x } = event.nativeEvent.contentOffset;
        const indexOfNextScreen = Math.floor(x / width);
        if (indexOfNextScreen !== currentPage) {
            setSliderState({
                ...sliderState,
                currentPage: indexOfNextScreen,
            });
        }
    };
    const { currentPage: pageIndex } = sliderState;

    return <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                horizontal={true}
                scrollEventThrottle={16}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                    setSliderPage(event);
                }}
            >
                <View style={{ width }}>
                    <IntroPage1 />
                </View>
                <View style={{ width }}>
                    <IntroPage2 />
                </View>
                <View style={{ width }}>
                    <IntroPage3 />
                </View>
                <View style={{ width }}>
                    <IntroPage4 />
                </View>
                <View style={{ width }}>
                    <IntroPage5 />
                </View>
                <View style={{ width }}>
                    <IntroPage6 />
                    <TouchableOpacity style={endButtonStyle.container}
                        onPress={() => {
                            setIntroDisplayed(true)
                            onClose()
                        }}>
                        <Text style={endButtonStyle.text}>Terminer le tutoriel</Text>
                    </TouchableOpacity>

                </View>


            </ScrollView>
            <View style={styles.paginationWrapper}>
                {Array.from(Array(6).keys()).map((key, index) => (
                    <View
                        style={[index >= 2 && index <= 4 ? styles.paginationBarNumber : styles.paginationBar,
                        {
                            opacity: pageIndex === index ? 1 : 0.4,
                        }]}
                        key={index + key} >
                        {
                            (index >= 2 && index <= 4) &&
                            <Text style={{
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>{index - 1}</Text>
                        }
                    </View>
                ))}
            </View>
        </SafeAreaView>
    </>
}

const styles = StyleSheet.create({
    paginationWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        height: 100,
    },
    paginationBar: {
        height: 15,
        width: 15,
        backgroundColor: '#162754',
        borderRadius: 50,
        marginHorizontal: 5
    },
    paginationBarNumber: {
        height: 30,
        width: 30,
        backgroundColor: '#162754',
        borderRadius: 50,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

const endButtonStyle = StyleSheet.create({
    container: {
        backgroundColor: '#FFAF31',
        padding: 10,
        alignItems: 'center',
        width: "50%",
        alignSelf: 'center',
        borderRadius: 5,
        shadowOpacity: 0.3,
        shadowOffset: {
            width: 2, height: 2
        },
        marginBottom: 10
    },
    text: {
        color: "#fff",
        fontWeight: 'bold'
    }
})