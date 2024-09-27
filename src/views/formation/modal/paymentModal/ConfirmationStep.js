import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView
} from "react-native";
import PriceRecap from "../../components/PriceRecap";


export default ConfirmationStep = ({
    formation,
    users,
    billingAddress,
    onConfirm,
    isLoading
}) => {


    return <View style={{height: '90%'}}>
        <ScrollView style={{
            width: '90%',
            alignSelf: 'center',
        }}>
            <Text style={{
                fontStyle: 'italic',
                fontSize: 15,
                marginVertical: 20,
                paddingHorizontal: 10,
                alignSelf: 'center'
            }}>Récapitulatif de votre commande</Text>
            <View style={{ marginBottom: 15, marginTop: 10 }}>
                <Text style={styles.text1}>Formation</Text>
                <Text>{formation.name}</Text>
            </View>

            <View style={{ marginVertical: 15 }}>
                <Text style={styles.text1}>Adresse de facturation</Text>
                <View style={{
                    width: "100%",
                    alignSelf: 'center',
                    borderRadius: 10
                }}>
                    <Text style={{ fontWeight: 'bold' }}>{billingAddress.name}</Text>
                    <Text>{billingAddress.street}</Text>
                    <Text>{billingAddress.zip} {billingAddress.city}</Text>
                    <Text>{billingAddress.country}</Text>
                </View>
            </View>

            <View style={{ marginVertical: 15 }}>
                <Text style={[styles.text1, { alignSelf: 'flex-start' }]}>Bénéficiaires</Text>
                {
                    users.map((value, index) => {
                        return <Text key={index}>{value.complete_name}</Text>

                    })
                }
            </View>
            <View style={{ marginVertical: 15 }}>
                <Text style={styles.text1}>Votre offre</Text>
                <PriceRecap
                    selectedCollaborators={users}
                    unitPrice={formation.price}
                />
            </View>
        </ScrollView>
        <View style={{height: "10%"}}>
            <TouchableOpacity style={{
                padding: 10,
                borderRadius: 5,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                marginTop: 10
            }}
                onPress={() => {
                    if (isLoading == false)
                        onConfirm({
                            id_formation: formation.idFormation,
                            users: users,
                            billingAddress: billingAddress
                        })

                }}
            >
                {
                    isLoading ?
                        <ActivityIndicator color={"#fff"} />
                        : <Text style={{ color: '#fff' }}>M'envoyer un lien de paiement</Text>
                }

            </TouchableOpacity>
        </View>
    </View>


}

const styles = StyleSheet.create({
    text1: {
        color: "#ffaf31",
        fontWeight: 'bold',
        fontSize: 16
    }
})