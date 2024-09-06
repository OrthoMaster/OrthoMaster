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

export default UserSelectionStep = ({ formation, onSubmit, billingAddress }) => {
    const users = useQuery("office-users", () => getUsersByOfficeId(billingAddress.id_buyer))
    const [selectedCollaborators, setSelectedCollaborators] = useState([])




    return <ScrollView style={{
        width: '95%',
        alignSelf: 'center'
    }}>
        <Text style={{
            fontStyle: 'italic',
            fontSize: 15,
            marginVertical: 10,
            paddingHorizontal: 10
        }}>
            Séléctionnez les utilisateurs qui bénéficiront de la formation
        </Text>

        <UserSelector usersArray={users.data} onSelect={(users)=>{
            setSelectedCollaborators(users)
            
        }}/>

        <PriceRecap 
            selectedCollaborators={selectedCollaborators}
            unitPrice={formation.price}
        />

        <TouchableOpacity style={{
            padding: 10,
            backgroundColor: '#ffaf31',
            alignSelf: 'center',
            borderRadius: 5,
            marginTop: 20
        }}
        onPress={()=>{
            onSubmit(selectedCollaborators)
        }}
        >
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Continuer</Text>
        </TouchableOpacity>
    </ScrollView>
}