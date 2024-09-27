import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TextInput,
    Share
} from "react-native";
import { useMutation } from "react-query";
import Ionicons from '@expo/vector-icons/Ionicons';

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
        Share.share({
            message: "Rejoignez le premier écosystème de l'orthopédie !\n" +
                attachedOffice.structure + " " + attachedOffice.name + " vous invite à découvrir la plateforme OrthoMaster.\n" +
                "Cliquez sur ce lien ci-dessus et découvrez des centaines de contenus réservés aux professionnels de santé.",
            url: "https://espace.orthomaster.fr/inscription"
        })
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
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Ajoutez des membres à votre espace :</Text>
        <View style={{
            backgroundColor: "#fff",
            alignSelf: 'center',
            width: "80%", height: 40,
            alignItems: 'center',
            marginVertical: 50
        }}>
            <Text style={{ fontSize: 15 }}>{attachedOffice.structure}</Text>

            <Text style={{ fontSize: 30 }}>{attachedOffice?.name}</Text>
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
            <Text style={{
                fontSize: 10,
                fontStyle: 'italic',
                color: 'gray',
                paddingHorizontal: 10
            }}>Attention, pour ajouter un nouveau membre, celui-ci doit déjà posséder un compte actif</Text>
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

        {
            (Array.isArray(userAdded) && userAdded.length > 0) &&
            <View style={{
                marginVertical: 20,
                paddingHorizontal: 10,
                backgroundColor: '#F1F1F1',
                paddingVertical: 10
            }}>
                <Text style={{ textDecorationLine: 'underline', color: '#262626' }}>Utilisateur(s) ajouté(s) </Text>
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
        }


        <View style={{
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: '#fff',
            borderRadius: 10,
            marginVertical: 50,
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
                    Envoyer une invitation à rejoindre OrthoMaster
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

