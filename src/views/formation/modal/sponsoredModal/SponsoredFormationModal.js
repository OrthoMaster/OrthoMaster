import React, { useEffect, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";
import AskSponsoredFormationForm from "./AskSponsoredFormationForm";
import { useMutation } from "react-query";
import { demandeDeDossierFormation } from "../../../../services/FormationService";

export const SponsoredFormationModal = ({
    formation,
    onClose
}) => {
    const sendDemand = useMutation(demandeDeDossierFormation, {
        onSettled: () => {
            setconfirmationView(true)
        }
    })

    const [confirmationView, setconfirmationView] = useState(false)


    return (
        <View style={styles.container}>

            {
                !confirmationView &&
                <AskSponsoredFormationForm onSubmit={infos => {
                    sendDemand.mutate({
                        id_formation: formation.idFormation,
                        organisme: infos.organisme,
                        tel: infos.tel,
                        note: infos.moment
                    })
                }} />
            }

            {
                confirmationView &&
                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '90%', alignSelf: 'center'
                }}>
                    <Text style={{
                        fontWeight: 'bold', fontSize: 22, color: "#ffaf31", marginBottom: 20, textAlign: 'center'
                    }}>Merci, nous traitons votre demande</Text>
                    <Text style={{textAlign: 'center'}}>Nous vous contacterons prochainement pour établir votre plan de formation.</Text>
                    <TouchableOpacity style={{
                        paddingVertical: 10, paddingHorizontal: 40,
                        backgroundColor: '#ffaf31', borderRadius: 5,
                        position: 'absolute', bottom: 40
                        }}
                        onPress={()=>onClose()}>
                        <Text>Ok</Text>
                    </TouchableOpacity>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "100%",
        width: "100%",
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})