import React from "react";

import { StyleSheet, View, Dimensions, Text, TouchableOpacity, Linking } from "react-native";

export const CertifiedFormationProgress = () => {
    return <View style={styles.container}>
        <Text style={styles.sectionTitle}>Mes formations certifiantes</Text>

        <Text style={{marginVertical: 10}}>Aucun certificat de formation pour le moment.</Text>
        <Text>Comment en avoir un ?</Text>

            <TouchableOpacity style={{
                backgroundColor: "#ffaf31",
                padding: 10,
                borderRadius: 5,
                marginTop: 20
            }}
                onPress={() => {
                    Linking.openURL("https://orthomaster.fr/parcour-certifiant")
                }}
            >
                <Text style={{ color: '#fff' }}>En savoir +</Text>
            </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        width: '100%',
        alignItems: 'center',
        marginBottom: 40
    },
    sectionTitle: {
        marginLeft: 10,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 20,
        color: '#ffaf31'
    },
})