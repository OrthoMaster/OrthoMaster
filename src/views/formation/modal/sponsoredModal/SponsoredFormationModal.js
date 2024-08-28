import React, { useEffect, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    Dimensions,
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
            <Text>Je souhaite faire  un ou plusieurs dossiers de formation(s) certifiante(s) financée(s) par un organisme agréé.</Text>

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
                    justifyContent: 'center'
                }}>
                    <Text style={{
                        fontWeight: 'bold', fontSize: 22, color: "#ffaf31"
                    }}>Nous traitons votre demande</Text>
                    <Text style={{textAlign: 'center'}}>Un membre de notre équipe va entrer en contact avec vous dans les prochaines 48h.*</Text>
                    <TouchableOpacity style={{
                        paddingVertical: 10, paddingHorizontal: 40,
                        backgroundColor: '#ffaf31', borderRadius: 5,
                        position: 'absolute', bottom: 40
                        }}
                        onPress={()=>onClose()}
                        >
                        <Text>Ok</Text>
                    </TouchableOpacity>
                    <Text style={{fontSize: 10, position: 'absolute', bottom: 10}}>* Hors week-end et jours fériés</Text>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "100%",
        width: Dimensions.get('screen').width * 0.9,
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})