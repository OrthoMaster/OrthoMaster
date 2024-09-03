import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default AskOfficeCreationPage = ({ onCreateOffice, onSkip }) => {
    return <View style={{ flex: 1 }}>
        <Text style={{
            textAlign: 'center',
            marginTop: 100
        }}>Vous êtes responsable d'une entreprise. Associez la à OrthoMaster pour gérer votre équipe</Text>
        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#ffaf31' }]}
                onPress={() => onCreateOffice()}
            >
                <Text>Je renseigne mon entreprise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#F1F1F1' }]}
                onPress={() => onSkip()}
            >
                <Text>Passer</Text>
            </TouchableOpacity>
        </View>
    </View>
}

const styles = StyleSheet.create({
    button: {
        width: "90%",
        borderRadius: 5,
        paddingVertical: 20,
        alignItems: 'center',
        alignSelf: 'center',
        marginVertical: 5
    },
    buttonsContainer: {
        position: 'absolute',
        bottom: 20, left: 0, right: 0
    }
})