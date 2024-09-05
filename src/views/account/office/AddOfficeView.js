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

        <ScrollView style={{
            paddingBottom: 30
        }}>
            {
                office == null &&
                <AddOfficeForm
                    onError={(message) => {
                        showToast({
                            type: 'error',
                            text1: "Espace-pro non créé",
                            text2: message ?
                                message
                                : "Une erreur s'est produite lors de l'enregistrement."
                        })
                    }}
                    onSuccess={(newOffice) => {
                        queryClient.invalidateQueries("user-offices")
                        showToast({
                            type: 'success',
                            text1: "Espace-pro créé",
                            text2: "Modifiez-le depuis votre espace 😉"
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
                            text2: "Votre espace pro reste modifiable dans votre espace"
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