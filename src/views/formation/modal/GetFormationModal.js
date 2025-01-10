import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { PaymentFormationModal } from "./paymentModal/PaymentFormationModal";
import { SponsoredFormationModal } from "./sponsoredModal/SponsoredFormationModal";


export default GetFormationModal = ({ formation, onClose, navigation }) => {
    const [action, setAction] = useState(null)

    const priceArray = [
        ["Nombre de licence", "Prix unitaire HT"],
        [1, formation.price],
        [2, formation.price * 0.975],
        [3, formation.price * 0.95],
        [4, formation.price * 0.925],
        [5, formation.price * 0.9],
        [6, formation.price * 0.875],
        [7, formation.price * 0.85],
        [8, formation.price * 0.825],
        [9, formation.price * 0.800],
        [10, formation.price * 0.775],
        [11, formation.price * 0.75]
    ]

    return <View style={{
        width: '90%', height: "100%",
        paddingBottom: 20,
    }}>
        {
            action == null &&
            <ScrollView style={{ width: "100%", }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, alignSelf: 'center' }}>{formation.name}</Text>

                <View style={{
                    marginTop: 30
                }}>
                    <Text style={{
                        fontSize: 12,
                    }}>
                        Cette formation certifiante s’intègre dans votre parcours de formation continue.
                    </Text>
                    {
                        formation.certifiable == true ?
                            <Text style={[styles.modalText, { marginBottom: 10 }]}>
                                Deux possibilités pour obtenir cette formation pour vous et/ou votre équipe :
                            </Text>
                            : <Text style={[styles.modalText, { marginBottom: 10 }]}>
                                Pour obtenir cette formation pour vous et/ou votre équipe :
                            </Text>

                    }
                    {
                        formation.certifiable == true &&
                        <View>
                            <Text style={[styles.modalText, { fontWeight: 'bold' }]}>Dossier de formation continue</Text>
                            <Text style={styles.modalText}> - Certificat de formation</Text>
                            <Text style={styles.modalText}> - Financement par organisme agréé (Opco EP, Fifpl, Fafpm...)</Text>
                            <Text style={styles.modalText}> - Dates de réalisation fixes</Text>
                        </View>
                    }
                    <Text style={[styles.modalText, { fontWeight: 'bold', marginTop: 10 }]}>Achat direct</Text>
                    <Text style={styles.modalText}> - Certificat de formation</Text>
                    <Text style={styles.modalText}> - Dates de réalisation flexibles</Text>
                    <Text style={styles.modalText}> - Passe en frais professionnels</Text>
                    <Text style={styles.modalText}> - Tarifs ci-dessous</Text>

                    <View style={{
                        marginTop: 10, marginBottom: 20
                    }}>
                        {
                            priceArray.map((row, indexRow) => {
                                return <View key={indexRow} style={{ flexDirection: "row" }}>
                                    {row.map((column, indexCol) => {
                                        return <View key={indexCol} style={{
                                            flex: 1,
                                            borderWidth: 1,
                                            borderColor: '#DEDEDE',
                                            alignItems: 'center',
                                            justifyContent: "center",
                                            backgroundColor: indexRow === 0 ? "#DEDEDE" : "#F1F1F1",
                                            marginHorizontal: 1
                                        }}>
                                            <Text style={[styles.modalText, { color: "#000" }]}>
                                                {column} {(indexRow == priceArray.length - 1) && indexCol === 0 ? "+" : ""} {(indexCol === 1 && indexRow != 0) && "€"}
                                            </Text>
                                        </View>
                                    })}
                                </View>
                            })
                        }
                    </View>
                    <View style={{
                        width: "100%",
                        flexDirection: 'row'
                    }}>
                        {
                            formation.certifiable == true &&
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.button}
                                    onPress={() => setAction("certifying")}>
                                    <Text style={styles.buttonText}>Dossier de formation</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button}
                                onPress={() => setAction("paying")}>
                                <Text style={styles.buttonText}>Acheter</Text>
                                <Image
                                    source={require("../../../../assets/formation/payment-methods.png")}
                                    style={styles.buttonImg}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        }
        {
            action == "certifying" &&
            <SponsoredFormationModal
                formation={formation}
                onClose={() => onClose()}
            />
        }
        {
            action == "paying" &&
            <PaymentFormationModal
                formation={formation}
                onClose={() => { onClose() }}
                navigation={navigation}
            />
        }
    </View>
}

const styles = StyleSheet.create({
    buttonContainer: {
        flex: 1,
        width: '100%', height: 100,
        padding: 5
    },
    button: {
        backgroundColor: '#ffaf31',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        width: '100%', height: '100%'
    },
    buttonText: {
        fontSize: 12,
        textAlign: 'center'
    },
    modalText: {
        fontSize: 12
    },
    buttonImg: {
        height: 30, width: '100%',
        resizeMode: 'contain',
        marginTop: 10,
    }
})