import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    ActivityIndicator
} from "react-native";
import { FormField } from "../FormField";
import { useQuery, useMutation } from "react-query";
import DropdownComponent from "../DropdownComponent";

import { createOffice, getCountries, getStructures } from "../../services/OfficeService";

export default AddOfficeForm = ({ onSuccess, onError }) => {
    const [formDatas, setFormDatas] = useState({})
    const countries = useQuery(["countries"], () => getCountries())
    const structures = useQuery(["structures"], () => getStructures())
    const sendForm = useMutation(createOffice, {
        onSuccess: data => {
            onSuccess(data.data)
        },
        onError: error => {
            onError(error.response.data.message)
        }
    })
    const [errorMessage, setErrorMessage] = useState(null)

    const handleFieldChange = (val) => {
        setErrorMessage(null)
        setFormDatas({
            ...formDatas,
            [val.value]: val.text
        })
    }

    const validForm = () => {
        if (formDatas.name?.trim().length > 0 &&
            formDatas.address_way?.trim().length > 0 &&
            formDatas.address_postal_code?.trim().length > 0 &&
            formDatas.address_city?.trim().length > 0 &&
            formDatas.country &&
            formDatas.email?.trim().length > 0 &&
            formDatas.office_structure) {
            sendForm.mutate(formDatas)
        } else {
            setErrorMessage("Tous les champs obligatoire doivent être remplis")
        }
    }


    return <View >
        <FormField type={"text"} name={"Nom de structure"} value={"name"}
            required={true}
            onChange={handleFieldChange}
        />
        <FormField type={"text"} name={"Rue"} value={"address_way"}
            required={true}
            onChange={handleFieldChange}
        />
        <View style={{
            flexDirection: 'row',
            width: '100%',
        }}>
            <FormField type={"text"} name={"Code postal"} value={"address_postal_code"}
                required={true}
                onChange={handleFieldChange}
            />
            <FormField type={"text"} name={"Ville"} value={"address_city"}
                required={true}
                onChange={handleFieldChange}
                style={{ flex: 1 }}
            />
        </View>
        <DropdownComponent
            required
            data={countries.data}
            label="Pays"
            searchEnabled={true}
            onChange={(val) => {
                setFormDatas({
                    ...formDatas,
                    country: {
                        id: val.value,
                        label: val.label
                    }
                })
            }} />
        <FormField type={"text"} name={"E-mail"} value={"email"}
            required={true}
            onChange={handleFieldChange}
        />
        <FormField type={"text"} name={"Téléphone"} value={"tel"}
            onChange={handleFieldChange}
        />
        <DropdownComponent required data={structures.data} label="Structure" onChange={(val) => {
            setFormDatas({
                ...formDatas,
                office_structure: {
                    id: val.value,
                    label: val.label
                }
            })
        }} />
        <FormField type={"text"} name={"N° TVA"} value={"tva"}
            onChange={handleFieldChange}
        />
        <FormField type={"text"} name={"Siret"} value={"siret"}
            onChange={handleFieldChange}
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
            if (sendForm.isLoading == false) {
                validForm()
            }
        }}>
            {
                sendForm.isLoading ?
                <ActivityIndicator />
                :<Text>Valider</Text>
            }
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});