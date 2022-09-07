import React, { useState, useEffect } from "react";

import {
    Modal,
    Text,
    View,
    StyleSheet,
    Image,
    TouchableOpacity
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useMutation } from "react-query";
import { postNewUserTrophy } from "../../../services/TrophyService";

export const TrophyUnlockModal = ({ trophy, imgUrl }) => {
    const [modalVisible, setModalVisible] = useState(true)
    const postNewTrophy = useMutation(postNewUserTrophy, {
        onSuccess: (data) => {
            //console.log(data);
        }
    })

    useEffect(() => {
        postNewTrophy.mutate(trophy.trophy.id_trophy)
    }, [])



    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                //setModalVisible(false);
            }}
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                    <LinearGradient
                        colors={['#c98f38', '#d29d43']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalContainer}
                    >
                        <Text style={styles.modalTitle}>Nouveau trophée !</Text>
                        <Text style={styles.text}>Tu as débloqué...</Text>
                        <View style={styles.trophyImg}>
                            <Image
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    resizeMode: 'contain'
                                }}
                                source={{ uri: imgUrl }}
                            />
                        </View>

                        <Text style={styles.trophyTitle}>{trophy.trophy.title}</Text>
                        <TouchableOpacity
                            style={[styles.button, {}]}
                            onPress={() => {
                                setModalVisible(false)
                            }}
                        >
                            <Text style={styles.buttonText}>Continuer</Text>
                        </TouchableOpacity>
                    </LinearGradient>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalContainer: {
        width: '80%',
        height: '50%',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: "#f3d46d",
        borderRadius: 20,
        justifyContent: 'space-around'
    },
    modalContent: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 25
    },
    text: {
        fontSize: 18
    },
    trophyImg: {
        width: 100,
        height: 100,
        shadowOpacity: 0.5,
        shadowRadius: 5,
        shadowOffset: {
        }
    },
    trophyTitle: {
        fontWeight: 'bold',
        fontSize: 18
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        width: '70%',
        height: '15%',
        borderColor: '#fffefd',
        borderWidth: 2,
        justifyContent: 'center',
        marginVertical: 5,

    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 15
    },
})