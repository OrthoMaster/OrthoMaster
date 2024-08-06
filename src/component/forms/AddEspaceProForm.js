import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet
} from "react-native";
import { FormField } from "../FormField";
import { useMutation } from "react-query";

import { createEspacePro } from "../../services/OfficeService";

export default AddEspaceProForm = ({ onSuccess, onError, attachedOffice }) => {
    const [name, setName] = useState("")
    const [idOffice, setIdOffice] = useState(attachedOffice?.id_office)
    const sendForm = useMutation(createEspacePro, {
        onSuccess: data => {
            onSuccess(data.data)
        },
        onError: error => {
            onError(error)
        }
    })
    const [errorMessage, setErrorMessage] = useState(null)

    const validForm = () => {
        if (name.trim().length > 0 &&
            idOffice && idOffice > 0) {
            sendForm.mutate({ name: name, id_office: idOffice })
        } else {
            setErrorMessage("Tous les champs obligatoire doivent être remplis")
        }
    }


    return <View>
        <View style={{ marginVertical: 30, paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Structure :</Text>
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
                {/* <Text>dzdzdz</Text> */}
                <Text>{attachedOffice?.name}</Text>
            </View>
        </View>

        <FormField type={"text"} name={"Nom de l'espace"} value={"name"}
            required={true}
            onChange={(val) => setName(val.text)}
        />

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
            validForm()
        }}>
            <Text>Valider</Text>
        </TouchableOpacity>
    </View>
}

