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

    console.log(attachedOffice);


    return <View style={{
        paddingVertical: 10,
    }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Votre structure :</Text>
        <View style={{
            backgroundColor: "#fff",
            alignSelf: 'center',
            width: "80%", height: 40,
            justifyContent: 'center',
            paddingHorizontal: 10,
            borderRadius: 5,
            borderColor: "#ffaf31",
            borderBottomWidth: 1,
            marginVertical: 20,
            opacity: 0.5
        }}>
            <Text>{attachedOffice.structure}</Text>

            <Text>{attachedOffice?.name}</Text>
        </View>
        <View>
            <Text style={{
                marginLeft: 10,
                marginBottom: 20,
                textAlign: 'left'
            }}>
                Pour ajouter un collaborateur, son compte doit déjà être activé.
            </Text>


        </View>

        <View style={{
            paddingHorizontal: 10,
            marginTop: 30
        }}>
            <Text>E-mail du membre à ajouter</Text>
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
            height: 40, width: 40,
            alignSelf: 'center',
            marginTop: 20,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center'
        }} onPress={() => {
            if (!isLoading) {
                mutateForm({ email: email, id_office: attachedOffice.id_office })
            }
        }}>
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 100,
                height: "90%", width: '90%',
                alignItems: 'center', justifyContent: 'center'
            }}>
                {
                    isLoading ?
                        <ActivityIndicator />
                        : <Text style={{ fontSize: 25, color: '#ffaf31' }}>+</Text>
                }
            </View>
        </TouchableOpacity>

        <View style={{
            marginVertical: 20,
            paddingHorizontal: 10,
            backgroundColor: '#F1F1F1',
            paddingVertical: 10
        }}>
            <Text style={{textDecorationLine: 'underline', color: '#262626'}}>Utilisateur(s) ajouté(s) </Text>
            <FlatList
                data={userAdded}
                keyExtractor={(item, index) => index}
                renderItem={(item) => <Text style={{
                    marginLeft: 10,
                    marginVertical: 5,
                    fontStyle: 'italic',
                    color: '#262626'
                }}>{item.item}</Text>
                }
                scrollEnabled={false}
            />
        </View>

        <View style={{
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: '#fff',
            borderRadius: 10,
            marginBottom: 20,
            width: "60%",
            padding: 5,
            shadowOffset: {
                width: 0, height: 0
            },
            shadowRadius: 10,
            shadowOpacity: 0.2
        }}>
            <Text style={{ marginBottom: 10 }}>Pas encore de compte ?</Text>
            <TouchableOpacity
                style={{
                    width: "90%",
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

        <TouchableOpacity style={{
            backgroundColor: '#ffaf31',
            paddingVertical: 15, paddingHorizontal: 15,
            alignSelf: 'center',
            borderRadius: 5,
            width: "95%",
            alignItems: 'center'
        }} onPress={() => {
            onEnd()
        }}>
            <Text>Terminer</Text>
        </TouchableOpacity>
    </View>
}

