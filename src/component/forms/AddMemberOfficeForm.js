import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { useMutation } from "react-query";
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Sharing from 'expo-sharing';

import { addMemberOffice } from "../../services/OfficeService";

export default AddMemberOfficeForm = ({ onSuccess, onError, attachedOffice, onEnd }) => {
    const [userAdded, setUserAdded] = useState([])
    const [email, setEmail] = useState("")
    const { status: formStatus, data: formData, isLoading, mutate: mutateForm } = useMutation(addMemberOffice, {
        onError: error => {
            onError(error.response.data.message)
        }
    })
    const [errorMessage, setErrorMessage] = useState(null)

    const shareInvite = async () => {
        let isOk = await Sharing.isAvailableAsync()
        if (isOk)
            Sharing.shareAsync("https://orthomaster-saas.odoo.com/inscription")
    }

    useEffect(() => {
        if (formStatus === 'success') {
            if (email.trim().length > 0) {
                let newUserArray = userAdded
                newUserArray.push(email)
                setEmail("")
                setUserAdded(newUserArray)
                onSuccess(formData.data)
            }
        }
    }, [formStatus, formData]);


    return <View style={{
        paddingVertical: 10,
    }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Entreprise :</Text>
        <View style={{
            backgroundColor: "#fff",
            alignSelf: 'center',
            width: "80%", height: 40,
            justifyContent: 'center',
            paddingHorizontal: 10,
            borderRadius: 5,
            borderColor: "#ffaf31",
            borderWidth: 2,
            marginVertical: 20
        }}>
            <Text>{attachedOffice?.name}</Text>
        </View>
        <View>
            <Text style={{
                marginLeft: 30,
                marginBottom: 20
            }}>
                Pour ajouter un membre à votre nouvel espace entreprise,
                vérifiez que le compte de l'utilisateur soit bien activé.
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

        </View>

        <View style={{
            paddingHorizontal: 10,
            marginTop: 30
        }}>
            <Text>E-mail de l'utilisateur à ajouter</Text>
            <TextInput
                defaultValue={email}
                style={{
                    borderColor: '#828282',
                    backgroundColor: '#fff',
                    borderWidth: 0.5,
                    borderRadius: 5,
                    height: 40,
                    marginTop: 5,
                    paddingLeft: 10
                }}
                onChangeText={(text) => {
                    setEmail(text)
                }}
                inputMode={"text"}
                autoCapitalize={'none'}
            />
        </View>

        {
            errorMessage &&
            <Text style={{
                alignSelf: 'center',
                marginVertical: 10,
                fontSize: 12,
                color: 'red'
            }}>{errorMessage}</Text>
        }

        <TouchableOpacity style={{
            backgroundColor: '#ffaf31',
            paddingVertical: 10, paddingHorizontal: 15,
            alignSelf: 'center',
            marginTop: 20,
            borderRadius: 5
        }} onPress={() => {
            if (!isLoading) {
                mutateForm({ email: email, id_office: attachedOffice.id_office })
            }
        }}>
            {
                isLoading ?
                    <ActivityIndicator />
                    : <Text>Ajouter</Text>
            }
        </TouchableOpacity>

        <View style={{
            marginVertical: 30
        }}>
            <Text>Utilisateur(s) ajouté(s) </Text>
            <FlatList
                data={userAdded}
                keyExtractor={(item, index) => index}
                renderItem={(item) => <Text>{item.item}</Text>
                }
                scrollEnabled={false}
            />
        </View>

        <TouchableOpacity style={{
            backgroundColor: '#ffaf31',
            paddingVertical: 15, paddingHorizontal: 15,
            alignSelf: 'center',
            marginTop: 20,
            borderRadius: 5
        }} onPress={() => {
            onEnd()
        }}>
            <Text>Terminer</Text>
        </TouchableOpacity>
    </View>
}

