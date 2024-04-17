import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";


export const FinalHeader = ({ nbProduct, userHistory, navigation }) => {
    const [historyIsVisible, setHistoryIsVisible] = useState(false)

    return (
        <View style={{
            width: "90%",
            backgroundColor: '#33C0B7',
            alignSelf: 'center',
            alignItems: 'center',
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
            paddingVertical: 10
        }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>Terminé</Text>
            <Text style={{ color: "#fff" }}><Text style={{ fontWeight: 'bold' }}>{nbProduct}</Text> produit(s) trouvé(s)</Text>

            {
                historyIsVisible ?
                    <DisplayHistory userHistory={userHistory} onClose={() => setHistoryIsVisible(false)} onEdit={() => navigation.pop()} />
                    : <TouchableOpacity style={styles.historyButton}
                        onPress={() => {
                            setHistoryIsVisible(true)
                        }}>
                        <Text style={{
                            color: '#fff'
                        }}>Voir les détails</Text>
                    </TouchableOpacity>
            }


        </View>
    )
}

const DisplayHistory = ({ userHistory, onClose, onEdit }) => {
    return <View style={{
        width: '90%',
        paddingTop: 20
    }}>
        <Text style={{ color: '#fff', fontSize: 22 }}>Votre récapitulatif</Text>
        <View style={{marginBottom: 5}}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Patient</Text>
            <View style={{
                display: 'flex', flexDirection: 'row',
                flexWrap: 'wrap'
            }}>
                {
                    userHistory.patient.map((value, index) => {
                        return <View key={index} style={{
                            backgroundColor: "#FFAF31",
                            paddingHorizontal: 10, paddingVertical: 2,
                            margin: 2,
                            borderRadius: 50,
                        }}>
                            <Text style={{
                                color: '#fff',
                                fontSize: 10
                            }}>{value}</Text>
                        </View>
                    })
                }
            </View>
        </View>
        <View style={{display: 'flex', alignItems: 'flex-start', marginBottom: 5}}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Localisation</Text>
            {
                userHistory.localisation &&
                <View style={{
                    backgroundColor: "#FFAF31",
                    paddingHorizontal: 10, paddingVertical: 2,
                    margin: 2,
                    borderRadius: 50,
                }}>
                    <Text style={{
                        color: '#fff',
                        fontSize: 10
                    }}>{userHistory.localisation}</Text>
                </View>
            }
        </View>
        <View>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Pathologie</Text>
            <View style={{
                display: 'flex', flexDirection: 'row',
                flexWrap: 'wrap'
            }}>
                {
                    userHistory.pathologie.map((value, index) => {
                        return <View key={index} style={{
                            backgroundColor: "#FFAF31",
                            paddingHorizontal: 10, paddingVertical: 2,
                            margin: 2,
                            borderRadius: 50,
                        }}>
                            <Text style={{
                                color: '#fff',
                                fontSize: 10
                            }}>{value}</Text>
                        </View>
                    })
                }
            </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.historyButton, { alignSelf: 'center' }]}
                onPress={onClose}
            >
                <Text style={{ color: '#fff' }}>Masquer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.historyButton, { alignSelf: 'center', backgroundColor: '#fff' }]}
                onPress={onEdit}
            >
                <Text style={{ color: '#33C0B7' }}>Modifier</Text>
            </TouchableOpacity>
        </View>

    </View>
}

const styles = StyleSheet.create({

    historyButton: {
        marginTop: 20,
        backgroundColor: '#33C0B7',
        borderWidth: 1,
        borderColor: '#fff',
        padding: 5,
        shadowColor: "#fff",
        shadowOpacity: 0.3,
        shadowOffset: {
            width: 1, height: 1
        },
        width: '50%',
        alignItems: 'center'
    },
})