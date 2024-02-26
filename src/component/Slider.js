import React, { useState, useEffect } from "react";

import { SafeAreaView, View, Text, StatusBar, Dimensions, ScrollView, StyleSheet, PixelRatio, TouchableOpacity } from "react-native";

export const Slider = ({
    pagesArray = [],
    onQuit,
    customPaginationComponent,
    getCurrentPageIndex,
    isSkipable
}) => {
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
            getCurrentPageIndex(indexOfNextScreen)
        }
    };
    const { currentPage: pageIndex } = sliderState;

    return <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
            {
                isSkipable &&
                <TouchableOpacity style={{
                    alignSelf: 'flex-end',
                    marginRight: 10,
                    padding: 10
                }}
                    onPress={onQuit}>
                    <Text style={{
                        color: "#FFAF31"
                    }}>Passer</Text>
                </TouchableOpacity>
            }
            <ScrollView
                style={{ flex: 1}}
                horizontal={true}
                scrollEventThrottle={16}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                    setSliderPage(event);
                }}
            >
                {
                    pagesArray.map((value, index) => {
                        return <View key={index} style={{ width }}>
                            {value}
                        </View>
                    })
                }

            </ScrollView>
            {
                (sliderState.currentPage + 1 == pagesArray.length) &&
                <TouchableOpacity style={endButtonStyle.container}
                    onPress={onQuit}>
                    <Text style={endButtonStyle.text}>Terminer le tutoriel</Text>
                </TouchableOpacity>
            }
            {
                customPaginationComponent ?
                    customPaginationComponent
                    : <View style={styles.paginationWrapper}>
                        {pagesArray.map((key, index) => (
                            <View style={[styles.paginationBar, { opacity: pageIndex === index ? 1 : 0.4 }]} key={index} />
                        ))}
                    </View>
            }

        </SafeAreaView>
    </>
}

const styles = StyleSheet.create({
    imageStyle: {
        height: PixelRatio.getPixelSizeForLayoutSize(135),
        width: '100%',
    },
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 30,
    },
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    paragraph: {
        fontSize: 17,
    },
    paginationWrapper: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    paginationBar: {
        height: 15,
        width: 15,
        backgroundColor: '#FFAF31',
        borderRadius: 50,
        marginHorizontal: 5
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