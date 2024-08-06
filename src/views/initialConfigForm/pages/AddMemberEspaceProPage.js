import React from "react";
import { Button, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MemberEspaceProForm from "../../../component/forms/AddMemberEspaceProForm";
import Toast from 'react-native-toast-message';

import * as Sharing from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';

export default AddMemberEspaceProPage = ({ espace, onFinish }) => {
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

    const shareInvite = async () => {
        let isOk = await Sharing.isAvailableAsync()
        if (isOk)
            Sharing.shareAsync("https://orthomaster-saas.odoo.com/inscription")
    }

    return <View style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
        <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 50,
            marginLeft: 30,
            marginBottom: 20
        }}>Ajoutez des membres à votre espace pro</Text>
        <Text style={{
            marginLeft: 30,
            marginBottom: 20
        }}>
            Pour ajouter un membre à votre nouvel espace pro,
            vérifiez que l'utilisateur se soit connecté au moin une fois à l'application.
        </Text>
        <View style={{
            alignItems: 'center',
            marginBottom: 20
        }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Pas encore de compte ?</Text>
            <TouchableOpacity
                style={{
                    width: "50%",
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    padding: 5,
                    borderRadius: 10
                }}
                onPress={() => {
                    shareInvite()
                }}
            >
                <Ionicons name="person-add-outline" size={20} color="#eb7b0f" />
                <Text style={{
                    color: '#eb7b0f',
                    textAlign: 'center',
                    marginVertical: 5,
                    fontSize: 12
                }}>
                    Invitez votre votre collaborateur sur orthomaster
                </Text>
            </TouchableOpacity>

        </View>


        <ScrollView style={{
            width: "90%",
            backgroundColor: '#fff',
            alignSelf: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            paddingTop: 20,
            paddingHorizontal: 10
        }}>

            <MemberEspaceProForm
                attachedEspace={espace}
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
                onError={() => {
                    showToast({
                        type: "error",
                        text1: "Utilisateur introuvable",
                        text2: "Vérifiez que l'utilisater ai un compte activé."
                    })
                }}
            />
        </ScrollView>
        <Toast position="bottom" />
    </View>
}