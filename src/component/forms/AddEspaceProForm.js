import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet
} from "react-native";
import { FormField } from "../FormField";
import { useMutation } from "react-query";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { createEspacePro } from "../../services/OfficeService";

export default AddEspaceProForm = ({ onSuccess, onError, attachedOffice }) => {
    const [formData, setFormData] = useState({
        name: "",
        autorizeStructurePayement: false,
        autorizeMultipleMemberPayment: false
    })

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
        if (formData.name.trim().length > 0 &&
            attachedOffice?.id_office && attachedOffice?.id_office > 0) {
            sendForm.mutate({
                name: formData.name,
                id_office: attachedOffice?.id_office,
                autorizeStructurePayment: formData.autorizeStructurePayement,
                autorizeMultipleUserPayment: formData.autorizeMultipleMemberPayment
            })
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
                <Text>{attachedOffice?.name}</Text>
            </View>
        </View>

        <FormField type={"text"} name={"Nom de l'espace"} value={"name"}
            required={true}
            onChange={(val) => setFormData({
                ...formData, name: val.text
            })}
        />
        <BouncyCheckbox
            size={20}
            fillColor="#ffaf31"
            unFillColor="#FFFFFF"
            text={"Permettre aux membres de l'espace d'utiliser l'adresse " +
                "de facturation de la structure pour effectuer un paiement " +
                "dans OrthoMaster.\n(Toute demande d'achat vous sera adressé avant paiement)"}
            textStyle={styles.checkboxText}
            innerIconStyle={{ borderWidth: 2 }}
            style={styles.checkbox}
            onPress={(isChecked) => {
                setFormData({ ...formData, autorizeStructurePayement: isChecked })
            }}
        />
        {
            formData.autorizeStructurePayement &&
            <BouncyCheckbox
                size={20}
                fillColor="#ffaf31"
                unFillColor="#FFFFFF"
                text={"Permettre aux utilisateurs de payer pour plusieurs membres"}
                textStyle={styles.checkboxText}
                innerIconStyle={{ borderWidth: 2 }}
                style={styles.checkbox}
                onPress={(isChecked) => {
                    setFormData({ ...formData, autorizeMultipleMemberPayment: isChecked })
                }}
            />
        }

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

const styles = StyleSheet.create({
    checkbox: {
        paddingHorizontal: 10,
        marginVertical: 10
    },
    checkboxText: {
        fontSize: 12,
        textDecorationLine: "none"
    }
})