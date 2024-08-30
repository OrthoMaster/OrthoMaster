import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import AddOfficeForm from "../../../component/forms/AddOfficeForm";
import Toast from 'react-native-toast-message';
import { useQueryClient } from "react-query";
import AddMemberOfficeForm from "../../../component/forms/AddMemberOfficeForm";

export default AddOfficeView = ({ route, navigation }) => {
    const queryClient = useQueryClient()
    const [office, setOffice] = useState(null)
    const showToast = ({
        type = 'success',
        text1 = 'Hello',
        text2 = 'This is some something 👋'
    }) => {
        Toast.show({
            type: type,
            text1: text1,
            text2: text2
        });
    }
    return <View style={{
        flex: 1,
    }}>
        <Text>
            Ajouter une entreprise vous permet ensuite d'ajouter des membres afin d'avoir une gestion d'équipe complète.
            En tant que créateur d'entreprise sur l'application OrthoMaster, vous serez en mesure de réaliser des actions pour vous et l'ensemble des membres de votre équipe.
        </Text>
        <ScrollView style={{
            paddingBottom: 30
        }}>
            {
                office == null &&
                <AddOfficeForm
                    onError={(message) => {
                        showToast({
                            type: 'error',
                            text1: "Entreprise non créée",
                            text2: message ?
                                message
                                : "Une erreur s'est produite lors de l'enregistrement."
                        })
                    }}
                    onSuccess={(newOffice) => {
                        queryClient.invalidateQueries("user-offices")
                        showToast({
                            type: 'success',
                            text1: "Entreprise créée",
                            text2: "Modifiez-la depuis votre page entreprise 😉"
                        })
                        setOffice(newOffice)
                    }}
                />
            }
            {
                office &&
                <AddMemberOfficeForm
                    onSuccess={() => {
                        showToast({
                            type: "success",
                            text1: "Utilisateur ajouté",
                            text2: "Votre espace pro reste modifiable sur votre page entreprise"
                        })
                    }}
                    onError={(errorMessage) => {
                        showToast({
                            type: "error",
                            text1: "Echec de l'ajout",
                            text2: errorMessage
                        })
                    }}
                    attachedOffice={office}
                    onEnd={() => {
                        navigation.goBack()
                    }}
                />
            }
        </ScrollView>
        <Toast position="bottom" />
    </View>
}