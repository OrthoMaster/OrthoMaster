import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import PriceRecap from "../../components/PriceRecap";
import { useMutation } from "react-query";
import { createFormationOrder } from "../../../../services/FormationService";


export default ConfirmationStep = ({
    formation,
    users,
    billingAddress
}) => {
    const sendOrder = useMutation(createFormationOrder)


    return <View style={{
        width: '95%',
        alignSelf: 'center'
    }}>
        <Text style={{
            fontStyle: 'italic',
            fontSize: 15,
            marginVertical: 10,
            paddingHorizontal: 10
        }}>Récapitulatif de votre commande</Text>
        <View>
            <Text style={styles.text1}>Formation :</Text>
            <Text>{formation.name}</Text>
            <Text>{formation.price}</Text>
        </View>

        <View>
            <Text style={styles.text1}>Adresse de facturation :</Text>
            <View style={{
                width: "90%",
                backgroundColor: '#F1F1F1',
                alignSelf: 'center',
                paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: 10
            }}>
                <Text style={{ fontWeight: 'bold' }}>{billingAddress.name}</Text>
                <Text>{billingAddress.street}</Text>
                <Text>{billingAddress.zip} {billingAddress.city}</Text>
                <Text>{billingAddress.country}</Text>
            </View>
        </View>

        <View>
            <Text style={styles.text1}>Vont bénéficier de la formation :</Text>
            {
                users.map((value, index) => {
                    return <Text key={index}>{value.complete_name}</Text>

                })
            }
        </View>
        <View>
            <Text style={styles.text1}>Votre offre :</Text>
            <PriceRecap
                selectedCollaborators={users}
                unitPrice={formation.price}
            />
        </View>

        <TouchableOpacity style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#ffaf31',
            alignSelf: 'center'
        }}
        onPress={()=>{
            sendOrder.mutate({
                id_formation: formation.idFormation,
                users: users,
                billingAddress: billingAddress
            })
            
        }}
        >
            <Text style={{ color: '#fff' }}>Confirmer</Text>
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create({
    text1: {
        color: "#ffaf31",
        fontWeight: 'bold',
        fontSize: 16
    }
})