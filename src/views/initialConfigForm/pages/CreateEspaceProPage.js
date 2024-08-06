import React from "react";
import { Text, View } from "react-native";
import Toast from 'react-native-toast-message';
import AddEspaceProForm from "../../../component/forms/AddEspaceProForm";

export default CreateEspaceProPage = ({ office, onFinish }) => {
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
    return <View style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
        <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 50,
            marginLeft: 30,
            marginBottom: 100
        }}>Création d'espace pro</Text>

        <View style={{
            height: 300, width: "90%",
            backgroundColor: '#fff',
            alignSelf: 'center',
            borderRadius: 10
        }}>
            <AddEspaceProForm
                attachedOffice={office}
                onSuccess={(newEspace) => {
                    onFinish(newEspace)
                    showToast({
                        type: 'success',
                        text1: "Espace pro créé",
                        text2: "Modifiez-le depuis votre page entreprise 😉"
                    })
                }}
                onError={() => {
                    showToast({
                        type: 'error',
                        text1: "Espace pro non créée",
                        text2: "Une erreur s'est produite lors de l'enregistrement."
                    })
                }}
            />
        </View>
        <Toast position="bottom" />
    </View>
}