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
                    <Text style={[styles.modalText, { marginBottom: 10 }]}>Deux possibilités pour obtenir cette formation pour vous et/ou votre équipe :</Text>
                    <Text style={[styles.modalText, { marginBottom: 5 }]}><Text style={{fontSize: 20}}>•</Text> Faire un <Text style={{ fontWeight: 'bold' }}>dossier de formation</Text> continue, financé par un organisme agréé</Text>
                    <Text style={styles.modalText}><Text style={{fontSize: 20}}>•</Text> <Text style={{ fontWeight: "bold" }}>Acheter</Text> directement la formation avec un tarif dégréssif selon le tableau ci-dessous :</Text>
                
                    <View style={{
                        marginTop: 10, marginBottom: 30
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
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button}
                                onPress={() => setAction("certifying")}>
                                <Text style={styles.buttonText}>Dossier de formation</Text>
                                <Image 
                                    source={require("../../../../assets/formation/qualiopi.png")}
                                    style={styles.buttonImg}
                                />
                            </TouchableOpacity>
                        </View>
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