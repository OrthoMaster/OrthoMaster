import React, { useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";
import { FormField } from "../../../../component/FormField";
import { useMutation, useQuery } from "react-query";


import AuthService from "../../../../services/AuthService";
import { RegistrationForm } from "./RegistrationForm";
import { RegistrationFinalization } from "./RegistrationFinalization";

export const RegistrationView = ({ route }) => {
    const seller = route.params.seller
    const [formCompleted, setFormCompleted] = useState(false)
    const [registrationInfos, setRegistrationInfos] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hubspotIds, setHubspotIds] = useState({
        companyId: null,
        txId: null
    })
    const [errors, setErrors] = useState([])
    const sendForm = useMutation(AuthService.registerNewCompanyAndUser, {
        onSuccess: (data) => {
            setIsSubmitting(false)
            setHubspotIds({
                companyId: data.data.hubspot_id,
                txId: data.data.transaction_id,
            })
            setErrors(data.data.errors)
            setFormCompleted(true)
        },
        onError: (err) => {
            setIsSubmitting(false)
            switch (err.response.status) {
                case 400:
                    Alert.alert('Entreprise déjà existante', `Une entreprise avec l'adresse email: ${registrationInfos.office.email} est déjà existante.`)
                    break;
                case 500:
                    Alert.alert("Erreur lors de l'inscription",
                        `Nous n'avons pas réussi à enregistrer l'entreprise demandée.
                 Veuillez réessayer ou contacter les équipe OrthoMaster.`, [
                        {
                            text: 'Contacter',
                            onPress: () => Linking.openURL('mailto:orthomaster.services@gmail.com')
                        },
                        { text: 'OK' },
                    ])
                    break;

                default:
                    break;
            }
        }
    })

    if (formCompleted) {
        return <RegistrationFinalization formData={registrationInfos} ids={hubspotIds} errors={errors} seller={seller} />
    } else {
        return <RegistrationForm isSubmitting={isSubmitting} onSubmit={(data) => {
            setRegistrationInfos(data)
            setIsSubmitting(true)
            sendForm.mutate(data)
        }}
            seller={seller}
        />
    }
}