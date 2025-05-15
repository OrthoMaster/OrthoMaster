import React, { useEffect, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity
} from "react-native";
import BillingAddressSelection from "./BillingAddressSelection";
import UserSelectionStep from "./UserSelectionStep";
import ConfirmationStep from "./ConfirmationStep";
import { useQuery, useMutation } from "react-query";
import { getCurrentUser } from "../../../../services/UserService";
import { createFormationOrder } from "../../../../services/FormationService";


export const PaymentFormationModal = ({
    formation,
    onClose,
    navigation
}) => {
    const { data: currentUser } = useQuery("current-user", () => getCurrentUser())
    const [currentBillingAddress, setCurrentBillingAddress] = useState(null)
    const [selectedUsers, setSelectedUsers] = useState(null)
    const [stepIndex, setStepIndex] = useState(0)
    const sendOrder = useMutation(createFormationOrder, {
        onSettled: () => setConfirmed(true)
    })
    const [confirmed, setConfirmed] = useState(false)


    useEffect(() => {
        if (currentBillingAddress?.type == "contact") {
            setSelectedUsers([{
                complete_name: currentUser.name,
                id_user: currentUser.id_user
            }])
        }
    }, [currentBillingAddress])

    return (

        <View style={styles.container}>
            <Text style={{
                fontWeight: 'bold',
                fontSize: 15,
                alignSelf: 'center'
            }}>Étape {stepIndex + 1}</Text>


            {
                (currentBillingAddress == null && stepIndex == 0) &&
                <BillingAddressSelection onValidation={(address) => {
                    if (address) {
                        setCurrentBillingAddress(address)
                        setStepIndex(1)
                    }
                }}
                    onCreateEspace={() => {
                        navigation.navigate("Mon espace")
                    }}
                />
            }

            {
                (currentBillingAddress?.type == "company" && stepIndex == 1) &&
                <UserSelectionStep
                    formation={formation}
                    onSubmit={(users) => {
                        setSelectedUsers(users)
                        setStepIndex(2)
                    }}
                    billingAddress={currentBillingAddress}
                    onAddMember2Espace={() => {
                        navigation.navigate("Mon espace")
                    }}
                />
            }
            {
                (selectedUsers && currentBillingAddress?.type == "contact" && stepIndex == 1) &&
                <ConfirmationStep
                    formation={formation}
                    billingAddress={currentBillingAddress}
                    users={selectedUsers}
                    onConfirm={(data) => {
                        sendOrder.mutate(data)
                    }}
                    isLoading={sendOrder.isLoading}
                />
            }
            {
                (stepIndex == 2 &&
                    selectedUsers &&
                    Array.isArray(selectedUsers) &&
                    selectedUsers.length > 0) &&
                <ConfirmationStep
                    users={selectedUsers}
                    formation={formation}
                    billingAddress={currentBillingAddress}
                    onConfirm={(data) => {
                        sendOrder.mutate(data)
                    }}
                    isLoading={sendOrder.isLoading}
                />
            }



            {
                confirmed &&
                <View style={{
                    backgroundColor: '#fff',
                    position: 'absolute',
                    height: '100%', width: "100%",
                    alignItems: 'center',
                    paddingVertical: 50
                }}>
                    {
                        sendOrder.isSuccess ?
                            <View style={{
                                width: "90%"
                            }}>
                                <Text style={{
                                    fontWeight: 'bold',
                                    fontSize: 22, color: '#ffaf31', alignSelf: 'center', marginBottom: 20
                                }}>Merci pour votre commande</Text>
                                <Text style={{marginBottom: 5}}>Nous venons de vous envoyer un email comportant :</Text>
                                <Text style={{}}>• Le lien pour signer & payer le devis</Text>
                                <Text style={{}}>• Le devis au format PDF</Text>
                                <Text style={{marginTop: 10}}>Vous n'avez plus qu'à suivre le lien de paiement pour débloquer la formation pour l'ensemble des bénéficiaires.</Text>
                                <Text style={{marginTop: 40, textDecorationLine: 'underline'}}>Email envoyé à :</Text>
                                <Text>{currentBillingAddress.name} ({currentBillingAddress.email})</Text>
                                {
                                    currentBillingAddress.type == "company" &&
                                    <Text>ainsi qu'au(x) responsable(s) de cette société</Text>
                                }
                            </View>
                            : <View>
                                <Text style={{
                                    fontWeight: 'bold',
                                    fontSize: 22, color: '#ffaf31'
                                }}>Une erreur est survenu lors de la génération et l'envoie du devis</Text>
                            </View>
                    }
                    <TouchableOpacity style={{
                        paddingVertical: 10, paddingHorizontal: 30,
                        backgroundColor: '#ffaf31', borderRadius: 5,
                        position: 'absolute', bottom: 30
                    }}
                        onPress={() => onClose()}
                    >
                        <Text>Ok</Text>
                    </TouchableOpacity>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "100%",
        width: "100%",
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})