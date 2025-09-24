import React from "react";
import { ScrollView, Text, View } from "react-native";
import AddOfficeForm from "../../../component/forms/AddOfficeForm";
import Toast from 'react-native-toast-message';

const CreateOfficePage = ({ onFinish }) => {
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
    return <View style={{ backgroundColor: "#F1F1F1", flex: 1 }}>
        <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 50,
            marginLeft: 30,
            marginBottom: 20
        }}>Création d'un espace-pro</Text>

        <ScrollView style={{
            width: "90%",
            backgroundColor: '#fff',
            alignSelf: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10
        }}>
            <View style={{ height: 20 }} />
            <AddOfficeForm
                onSuccess={(newOffice) => {
                    onFinish(newOffice)
                    showToast({
                        type: 'success',
                        text1: "Espace-pro créé",
                        text2: "Modifiez-le depuis votre espace 😉"
                    })
                }}
                onError={(message) => {
                    showToast({
                        type: 'error',
                        text1: "Espace-pro non créé",
                        text2: message ?
                            message
                            : "Une erreur s'est produite lors de l'enregistrement."
                    })
                }}
            />
            <View style={{ height: 30 }} />
        </ScrollView>
        <Toast position="bottom" />

    </View>
}

export default CreateOfficePage;