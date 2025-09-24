import React from "react";

import {
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Image
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export const AuthHome = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ alignItems: 'center' }}>
                <Image
                    source={require("../../../assets/logo-text-orange.png")}
                    style={{
                        height: 100,
                        width: 200,
                        resizeMode: "contain",
                    }}
                />
                <Image
                    source={require("../../../assets/auth/mockup.png")}
                    style={{
                        height: 250, width: 250,
                        resizeMode: 'contain',
                    }}
                />
            </View>
            <Text style={{ paddingHorizontal: 30, marginTop: 30, fontSize: 22, fontWeight: 'bold', color: '#FFAF31', marginBottom: 5 }}>
                OrthoMaster optimise{'\n'}votre délivrance orthopédique
            </Text>
            <Text style={{ paddingHorizontal: 30, fontSize: 18 }}>
                pour un parcours patient{'\n'}plus efficace, profitable et bénéfique
            </Text>
            <View style={{
                alignItems: 'center',
                position: 'absolute',
                bottom: 50,
                width: '100%',
                paddingHorizontal: 30
            }}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#FFAF31' }]}
                    onPress={() => navigation.navigate('auth-home')}
                >
                    <Text style={styles.buttonText}>Se connecter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#DEDEDE' }]}
                    onPress={() => Linking.openURL("https://espace.orthomaster.fr/inscription")}
                >
                    <Text style={[styles.buttonText, { color: '#555555' }]}>S'inscrire</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
    },
    button: {
        width: '100%',
        borderRadius: 5,
        marginBottom: 16,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold'
    }
})
