import React, {useEffect, useState} from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Button,
    Platform,
    Linking
} from "react-native";


export const AlertVersion = ({isVisible, onClose}) => {
    return (
        <Modal
            animationType="slide"
            visible={isVisible}
            transparent={true}
            onRequestClose={() => {
                console.log("alerte close request");
                onClose()
            }}
            onShow={()=>{console.log("alert version");}}
        >
            <View style={styles.centeredContainer}>
                <View style={styles.modalContainer}>
                    <Text style={styles.textPrimary}>📣 Mise à jour 📣</Text>
                    <Text style={styles.textSecondary}>Une nouvelle version de votre application OrthoMaster est désormait disponible.</Text>
                    <TouchableOpacity
                        style={styles.majButton}
                        onPress={()=>{
                            switch (Platform.OS) {
                                case 'ios':
                                    Linking.openURL('https://apps.apple.com/us/app/orthomaster/id1644851864');
                                    break;
                                case 'android':
                                    Linking.openURL('https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster&pli=1');
                                    break;
                                default:
                                    break;
                            }
                            onClose()
                        }}
                    >
                        <Text style={styles.majButtonTxt}>Mettre à jour</Text>
                    </TouchableOpacity>
                    <Button title="passer" color={"#757575"} onPress={onClose}/>
                </View>
            </View>
        </Modal>
    )
}



const styles = StyleSheet.create({
    centeredContainer: {
        height: '100%', width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)'
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        width: '80%',
        alignSelf: 'center',
        borderRadius: 15,
        shadowOffset: {
            width: 0,
            height: 0
          },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          alignItems: 'center',
          paddingVertical: 10
    },
    textPrimary: {
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 5
    },
    textSecondary: {
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 5,
    },
    textTertiary: {

    },
    majButton:{
        backgroundColor: '#EB7013',
        width: '70%',
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10
    },
    majButtonTxt: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#ffffff',
    }
})