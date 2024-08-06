import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput
} from "react-native";
import { FormField } from "../FormField";
import { useQuery, useMutation } from "react-query";

import { addMemberEspacePro } from "../../services/OfficeService";

export default AddMemberEspaceProForm = ({ onSuccess, onError, attachedEspace, onEnd }) => {
    const [userAdded, setUserAdded] = useState([])
    const [email, setEmail] = useState("")
    const { status: formStatus, data: formData, isFetching, mutate: mutateForm } = useMutation(addMemberEspacePro, {
        onError: error => {
            onError(error)
        }
    })
    const [errorMessage, setErrorMessage] = useState(null)

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

    useEffect(() => {
        console.log(userAdded);

    }, [userAdded])


    return <View>
        <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Espace :</Text>
            <View style={{
                backgroundColor: "#fff",
                alignSelf: 'center',
                width: "80%", height: 40,
                justifyContent: 'center',
                paddingHorizontal: 10,
                borderRadius: 5,
                borderColor: "#ffaf31",
                borderWidth: 2,
                marginTop: 20
            }}>
                <Text>{attachedEspace?.name}</Text>
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
            if (!isFetching) {
                mutateForm({ email: email, id_espace: attachedEspace.id })
            }
        }}>
            {
                isFetching ?
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
            {
                isFetching ?
                    <ActivityIndicator />
                    : <Text>Terminer la configuration de mon espace</Text>
            }
        </TouchableOpacity>
    </View>
}

