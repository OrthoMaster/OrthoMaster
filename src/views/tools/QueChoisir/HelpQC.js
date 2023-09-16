import React, { useEffect } from "react";
import { SafeAreaView, View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "react-query";
import { getS3Image } from "../../../services/S3Service";

export const HelpSection = ({ helpWidth, helpIsActive, onPress, response }) => {
    const currentImg = useQuery(['Qu Choisir', 'response', 'image help', response.id], () => getS3Image(response.help_img))

    return (
        <View style={[styles.helpView, { width: helpWidth, right: helpIsActive ? 0 : helpWidth * -1 }]}>
            <SafeAreaView style={[styles.helpContent]}>
                <Text style={[styles.titleHelpView]}>{response.response}</Text>
                {
                    currentImg.isLoading ?
                        <ActivityIndicator />
                        :
                        <Image
                            source={{ uri: currentImg.data }}
                            style={[styles.image, {flexGrow: response.help_text ? 0.5 : 1}]}
                        />
                }
                {
                    response.help_text &&
                    <ScrollView contentContainerStyle={styles.scrollContent} style={{flex: 1}}>
                        <Text> {response.help_text} </Text>
                    </ScrollView>
                }
                <LinearGradient
                    colors={['#E8764A', '#EC4C70']}
                    style={styles.closeHelp}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity
                        style={{
                            width: '100%', height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center'
                    }}
                        onPress={() => {
                            onPress();
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>Fermer</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 50
    },
    helpView: {
        height: "100%",
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.7,
        shadowRadius: 5,
        position: 'absolute',
        alignItems: 'center',
    },
    helpContent: {
        paddingVertical: 20,
        width: '100%',
        height: '100%',
        display: 'flex'
    },
    titleHelpView: {
        fontSize: 18,
        fontWeight: 600,
        color: '#20123A',
        textAlign: 'center',
        marginBottom: 10
    },
    closeHelp: {
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%', height: 40,
        alignSelf: 'center',
        position: 'absolute',
        bottom: 10
    },
    image: {
        flex: 1,
        borderRadius: 16,
        resizeMode: "contain"
    },
    responseAlign: {
        flexDirection: 'row',
        alignItems: 'center'
    },
})


