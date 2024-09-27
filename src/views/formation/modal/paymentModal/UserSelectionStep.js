import React, { useState, useEffect } from "react";

import UserSelector from "../../../../component/UserSelector";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView
} from "react-native";
import { useQuery } from "react-query";
import { getUsersByOfficeId } from "../../../../services/UserService";
import PriceRecap from "../../components/PriceRecap";

export default UserSelectionStep = ({ formation, onSubmit, billingAddress, onAddMember2Espace }) => {
    const users = useQuery("office-users", () => getUsersByOfficeId(billingAddress.id_buyer))
    const [selectedCollaborators, setSelectedCollaborators] = useState([])




    return <View style={{ height: "100%" }}>
        <ScrollView style={{
            width: '95%',
            alignSelf: 'center'
        }}>
            <Text style={{
                fontStyle: 'italic',
                fontSize: 15,
                marginVertical: 20,
                paddingHorizontal: 10,
                alignSelf: 'center'
            }}>
                Sélectionnez les utilisateurs qui bénéficieront de la formation
            </Text>

            <UserSelector usersArray={users.data} onSelect={(users) => {
                setSelectedCollaborators(users)

            }} />
            <Text style={{
                width: '80%',
                fontSize: 12,
                textAlign: 'center',
                alignSelf: 'center',
                marginTop: 20,
                marginBottom: 50
            }}>
                Pour ajouter un bénéficiaire, rendez-vous sur <Text style={{
                    fontWeight: 'bold',
                    textDecorationLine: 'underline'
                }}
                    onPress={() => onAddMember2Espace()}
                >votre espace</Text>
            </Text>
            <PriceRecap
                selectedCollaborators={selectedCollaborators}
                unitPrice={formation.price}
            />


        </ScrollView>
        <View style={{
            paddingVertical: 20
        }}>
            <TouchableOpacity style={{
                padding: 10,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 5,
                marginTop: 20,
            }}
                onPress={() => {
                    if (selectedCollaborators.length >= 1)
                        onSubmit(selectedCollaborators)
                }}
            >
                <Text style={{
                    fontWeight: 'bold',
                    color: '#fff',
                }}>Continuer</Text>
            </TouchableOpacity>
        </View>
    </View >

}