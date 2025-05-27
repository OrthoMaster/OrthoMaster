import React, { useState, useEffect } from "react";

import UserSelector from "../../../../component/UserSelector";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getUsersByOfficeId } from "../../../../services/UserService";
import PriceRecap from "../../components/PriceRecap";

export default UserSelectionStep = ({ formation, onSubmit, billingAddress, onAddMember2Espace }) => {
    const users = useQuery({
        queryKey: ["office-users"],
        queryFn: () => getUsersByOfficeId(billingAddress.id_buyer)
    })
    const [selectedCollaborators, setSelectedCollaborators] = useState([])




    return <View style={{ height: "100%" }}>

        <Text style={{
            fontStyle: 'italic',
            fontSize: 12,
            marginVertical: 5,
            paddingHorizontal: 10,
            alignSelf: 'center'
        }}>
            Sélectionnez les utilisateurs qui bénéficieront de la formation
        </Text>
        <View style={{ flex: 1 }}>
            <UserSelector usersArray={users.data} onSelect={(users) => {
                setSelectedCollaborators(users)

            }} />
        </View>
        <Text style={{
            width: '80%',
            fontSize: 10,
            textAlign: 'center',
            alignSelf: 'center',
            marginVertical: 10
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


        <TouchableOpacity style={{
            padding: 10,
            backgroundColor: '#ffaf31',
            alignSelf: 'center',
            borderRadius: 5,
            marginVertical: 20,
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
    </View >

}