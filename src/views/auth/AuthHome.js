import React, { useState, useEffect } from "react";

import {
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    Dimensions,
    Linking,
    Image
} from "react-native";





export const AuthHome = ({ navigation }) => {
    const [indicatorIndex, setIndicatorIndex] = useState(0)

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={require("../../../assets/logo-text-orange.png")}
                style={{
                    height: "10%",
                    width: "50%",
                    resizeMode: "contain",
                }}
            />
            <Image
                source={require("../../../assets/auth/mockup.png")}
                style={{
                    height: "40%", width: "70%",
                    resizeMode: 'contain',
                }}
            />
            <View style={{ width: "90%", paddingVertical: 30 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFAF31' }}>
                    OrthoMaster optimise
                </Text>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFAF31' }}>
                    votre délivrance orthopédique
                </Text>
                <Text style={{ fontSize: 18 }}>
                    pour un parcours patient
                </Text>
                <Text style={{ fontSize: 18 }}>
                    plus efficace, profitable et bénéfique
                </Text>
            </View>
            <TouchableOpacity style={[styles.button,
            {
                backgroundColor: '#FFAF31'
            }]}
                onPress={() => {
                    navigation.navigate('auth-home')
                }}
            >
                <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flex: 1
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
        marginHorizontal: 10,
        borderRadius: 5,
        position: 'absolute',
        bottom: 100,
        height: 60,
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold'
    }
})
