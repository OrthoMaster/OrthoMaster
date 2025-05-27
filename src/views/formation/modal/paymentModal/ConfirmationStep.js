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


    return <View style={{height: '100%'}}>
        <ScrollView style={{
            width: '90%',
            alignSelf: 'center',
            flex: 1,
            backgroundColor: '#F1F1F1',
            paddingHorizontal: 10
        }}>
            <Text style={{
                fontStyle: 'italic',
                fontSize: 12,
                marginVertical: 20,
                paddingHorizontal: 10,
                alignSelf: 'center'
            }}>Récapitulatif de votre commande</Text>
            <View style={{ marginVertical: 5 }}>
                <Text style={[styles.textPrimary, {fontSize: 12}]}>Formation</Text>
                <Text style={{fontSize: 12}}>{formation.name}</Text>
            </View>

            <View style={{ marginVertical: 5 }}>
                <Text style={styles.textPrimary}>Adresse de facturation</Text>
                <View style={{
                    width: "100%",
                    alignSelf: 'center',
                    borderRadius: 10
                }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{billingAddress.name}</Text>
                    <Text style={styles.textSecondary}>{billingAddress.street}</Text>
                    <Text style={styles.textSecondary}>{billingAddress.zip} {billingAddress.city}</Text>
                    <Text style={styles.textSecondary}>{billingAddress.country}</Text>
                </View>
            </View>

            <View style={{ marginVertical: 5 }}>
                <Text style={[styles.textPrimary, { alignSelf: 'flex-start' }]}>Bénéficiaires</Text>
                {
                    users.map((value, index) => {
                        return <Text style={styles.textSecondary} key={index}>{value.complete_name}</Text>

                    })
                }
            </View>
            <View style={{ marginVertical: 15 }}>
                <Text style={styles.textPrimary}>Votre offre</Text>
                <PriceRecap
                    selectedCollaborators={users}
                    unitPrice={formation.price}
                />
            </View>
        </ScrollView>
        <View style={{}}>
            <TouchableOpacity style={{
                padding: 10,
                borderRadius: 5,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                marginVertical: 10
            }}
                onPress={() => {
                    console.log(isLoading);
                    
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
                        : <Text style={{ color: '#fff', fontSize: 12 }}>M'envoyer un lien de paiement</Text>
                }

            </TouchableOpacity>
        </View>
    </View>


}

const styles = StyleSheet.create({
    textPrimary: {
        color: "#ffaf31",
        fontWeight: 'bold',
        fontSize: 12
    },
    textSecondary: {
        color: "#000",
        fontSize: 12
    }
})