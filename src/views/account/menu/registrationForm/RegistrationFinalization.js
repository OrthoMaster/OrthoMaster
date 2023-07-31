import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert, ScrollView, Dimensions } from "react-native";

import AuthService from "../../../../services/AuthService";
import { sendSupportTicket } from "../../../../services/tools/SupportService";
import { useMutation } from "react-query";
import QRCode from "react-native-qrcode-svg";

export const RegistrationFinalization = ({ formData, ids, errors }) => {
    let qrLogoFromFile = require('../../../../../assets/logo.png');

    const sendMail = useMutation(AuthService.sendSubscriptionLinkByEmail, {
        onError: (err) => {
            if (err.response.data != 'token_not_valid')
                setIsError(true)
        },
        onSuccess: (data) => {
            if (data.status == 200) {
                Alert.alert('Email envoyé', `Un email à été envoyé à l'adresse suivante: ${JSON.parse(data.config.data)?.email}\n\nVous pouvez désormais quitter cette page, nous nous chargeons du reste`)
            }
        }
    })
    const [isError, setIsError] = useState(false)
    const paymentUrl = `https://orthomaster.fr/registration?hubspotId=${ids.companyId}&txId=${ids.txId}`
    const sendTicket = useMutation(sendSupportTicket, {
        enabled: false,
    })

    const sendEmailTo = (mail) => {
        sendMail.mutate({
            email: mail,
            params: {
                payment_url: paymentUrl
            }
        })
    }

    useEffect(() => {

        errors.forEach(element => {
            if (element.gravity == "VERY_IMPORTANT") {
                setIsError(true)
                sendTicket.mutate({
                    subject: "Erreur d'inscription entreprise",
                    priority: "HIGH",
                    content: `Une ou plusieurs erreurs sont arrivé lors de l'enregistrement de l'entreprise: ${formData?.office.structure} - ${formData?.office.name}
                        Erreurs: ${errors?.toString()}
                    `,
                    companyId: ids.companyId,
                    txId: ids.txId
                })
                return
            }
        });
    }, [])


    return <ScrollView style={styles.container}>
        <Text style={styles.statusMessage}>Votre entreprise à bien été enregistrer</Text>

        <Text style={styles.title}>Finalisation</Text>

        {
            isError ?
                <View>
                    <Text style={styles.statusMessage}>Lien de paiement indisponible.</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center',marginTop: 15 }}>
                        <Text style={styles.displayText}>Notification aux équipes OrthoMaster:</Text>
                        <View style={{
                            borderRadius: 20,
                            width: 10,
                            height: 10,
                            backgroundColor: sendTicket.isLoading ? 'orange' : sendTicket.isSuccess ? 'green' : 'red',
                            marginLeft: 10
                        }} />
                    </View>

                    <Text style={styles.title}>Services OrthoMaster</Text>
                    <TouchableOpacity onPress={() => {
                        Linking.openURL('mailto:orthomaster.services@gmail.com')
                    }}>
                        <Text style={[styles.displayText, {textDecorationLine: 'underline'}]}>orthomaster.services@gmail.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        Linking.openURL('tel:+33388126989')
                    }}>
                        <Text style={[styles.displayText, {textDecorationLine: 'underline'}]}>+33 3 88 12 69 89</Text>
                    </TouchableOpacity>
                </View>
                : <View>
                    <Text style={styles.displayText}>Envoie de la  confirmation avec lien pour paiement par mail :</Text>

                    <View style={{ flexDirection: 'row', alignSelf: 'center', marginVertical: 20 }}>
                        <TouchableOpacity style={styles.buttonContainer} onPress={() => sendEmailTo(formData.office.email)}>
                            <Text style={styles.buttonText}>Email Entreprise</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.buttonContainer} onPress={() => sendEmailTo(formData.manager.email)}>
                            <Text style={styles.buttonText}>Email Contact principal</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontWeight: 'bold', fontSize: 22, alignSelf: 'center' }}>OU</Text>
                    <View style={{alignSelf: 'center', marginVertical: 20}}>
                    <QRCode
                        value={paymentUrl}
                        logo={qrLogoFromFile}
                        logoSize={30}
                        logoBackgroundColor="#fff"
                        quietZone={0}
                        logoBorderRadius={10}
                        size={200}
                    />
                    </View>
                </View>
        }




    </ScrollView>
    //TODO Create QR code to paymentUrl

}
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingTop: 30
    },
    statusMessage: {
        fontWeight: '400',
        fontSize: 22,
        textAlign: 'center'
    },
    title: {
        color: '#EA6912',
        alignSelf: 'center',
        fontWeight: 'bold',
        fontSize: 22,
        marginVertical: 20
    },
    displayText: {
        fontSize: 18,
        textAlign: 'center',
        alignSelf: 'center',
        marginVertical: 5
    },
    buttonContainer: {
        backgroundColor: '#EA6912',
        paddingHorizontal: 10,
        paddingVertical: 20,
        marginHorizontal: 5,
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
        shadowOpacity: 0.3,
        shadowOffset:{width: 0, height: 0},
        width: Dimensions.get('screen').width * 0.4,
        alignItems: "center",
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center'
    }
})