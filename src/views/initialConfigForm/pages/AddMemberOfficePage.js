import React from "react";
import { ScrollView, Text, View } from "react-native";
import AddMemberOfficeForm from "../../../component/forms/AddMemberOfficeForm";
import Toast from 'react-native-toast-message';


export default AddMemberOfficePage = ({ office, onFinish }) => {
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
            marginBottom: 20
        }}>Ajoutez des membres à votre espace-pro</Text>


        <ScrollView style={{
            width: "90%",
            backgroundColor: '#fff',
            alignSelf: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            paddingTop: 20,
            paddingHorizontal: 10
        }}>

            <AddMemberOfficeForm
                attachedOffice={office}
                onEnd={() => {
                    onFinish()
                }}
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
            />
        </ScrollView>
        <Toast position="bottom" />
    </View>
}