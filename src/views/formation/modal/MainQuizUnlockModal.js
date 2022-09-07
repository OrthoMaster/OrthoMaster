import React, { useEffect, useState } from "react";

import {
    Modal,
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import { useMutation, useQuery } from "react-query";
import { insertMainQuizStatusByFormation } from "../../../services/FormationService";

export const MainQuizUnlockModal = ({
    visible,
    onExit,
    onQuiz,
    quizType
}) => {

    const mainQuizStatus = useMutation('insertInitialQuizStatus', insertMainQuizStatusByFormation, {
        onError: (error) => {
            if (error.response.data == 'token_not_valid') {
                dispatch(logout())
            }
        }
    })

    useEffect(() => {
        mainQuizStatus.mutate({ formation_id: 1, quiz_type: quizType })
    }, [])


    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                <View style={styles.invertedView}>
                    <Image
                        source={quizType == 'initial' ? require('../../../../assets/formation/start.png') : require('../../../../assets/formation/finish.png')}
                        style={{
                            width: '100%',
                            height: '100%',
                            resizeMode: 'cover',
                            position: 'absolute',
                            borderRadius: 5
                        }}
                    />
                    

                    <View style={styles.box}>

                        <TouchableOpacity
                            style={{ alignSelf: 'flex-end', width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => {
                                onExit()
                            }}
                        >
                            <Text style={{ color: '#000000' }}>X</Text>
                        </TouchableOpacity>


                        {
                            quizType == 'initial' ?
                                <View style={styles.textBox}>
                                    <Text style={styles.textPrimary}>Bienvenue</Text>
                                    <Text style={[styles.textSecondary]}>sur la formation</Text>
                                    <Text style={[styles.textSecondary, { marginBottom: 30 }]}>OrthoMaster</Text>
                                    <Text style={styles.textTertiary}>Avant de commencer ta formation, nous te conseillons vivement de passer le quiz initial qui permettera d'évaluer ton niveau de connaissance et de réfléxion actuel.</Text>

                                    <Text style={[styles.textTertiary, { marginTop: 20 }]}>Cette évaluation est indispensable pour les professionels qui se forment avec une prise en charge DPC</Text>
                                    <Text style={[styles.textTertiary, { marginTop: 10 }]}>Durée estimé (10 min)</Text>
                                </View>
                                :
                                <View style={styles.textBox}>
                                    <Text style={styles.textPrimary}>Félicitations !</Text>
                                    <Text style={[styles.textSecondary, { textAlign: 'center', marginBottom: 30 }]}>Tu as complété 80% de la formation OrthoMaster</Text>
                                    <Text style={styles.textTertiary}>Tu peux maintenant accéder au quiz final pour évaluer tes progrès, ou continuer à avancer sur les dernières leçons.</Text>
                                    <Text style={[styles.textTertiary, { marginTop: 20 }]}>Cette évaluation est indispensable pour les professionels qui se forment avec une prise en charge DPC</Text>
                                    <Text style={[styles.textTertiary, { marginTop: 10 }]}>Durée estimée (10 min)</Text>
                                </View>
                        }
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            onQuiz()
                        }}
                        style={[styles.button, {position: 'absolute'}]}
                    >
                        <Text style={styles.buttonText}>Acceder au quiz</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    invertedView: {
        flexDirection: 'column-reverse',
        width: '90%',
        height: '80%',
        alignItems: 'center',
    },
    box: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingVertical: 10,
        // backgroundColor: 'red',
        alignSelf: 'center'
    },
    textBox: {
        alignItems: 'center',
        width: '90%',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 15,
        paddingHorizontal: 5,
        paddingVertical: 10
    },
    textPrimary: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fafafa'
    },
    textSecondary: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fafafa'
    },
    textTertiary: {
        fontSize: 15,
        textAlign: 'center',
        color: '#fafafa'
    },
    button: {
        backgroundColor: 'rgba(42,39,77,0.65)',
        width: '70%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        borderColor: '#E75A08',
        borderWidth: 5,
        marginBottom: 50
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    }
})