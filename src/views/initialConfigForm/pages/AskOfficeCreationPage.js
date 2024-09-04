import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default AskOfficeCreationPage = ({ onCreateOffice, onSkip }) => {
    return <View style={{ flex: 1 }}>
        <Text style={{
            textAlign: 'center',
            marginTop: 200,
            fontSize: 20,
            fontWeight: 'bold'
        }}>Vous représentez une structure professionnelle ?</Text>
        <Text style={[styles.subText, {marginTop: 50}]}>Créez votre espace-pro sur OrthoMaster</Text>
        <Text style={styles.subText}>pour gérer votre équipe et bien plus encore.</Text>
        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#ffaf31' }]}
                onPress={() => onCreateOffice()}
            >
                <Text>Je renseigne mon espace-pro</Text>
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
    },
    subText: {
        fontSize: 16,
        textAlign: 'center',
    }
})