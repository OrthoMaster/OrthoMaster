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
    onClose
}) => {
    const { data: currentUser } = useQuery("current-user", () => getCurrentUser())
    const [currentBillingAddress, setCurrentBillingAddress] = useState(null)
    const [selectedUsers, setSelectedUsers] = useState(null)
    const [stepIndex, setStepIndex] = useState(0)
    const sendOrder = useMutation(createFormationOrder, {
        onError: err => {
            setStatusMessage("Une erreur est survenu lors de la génération et l'envoie du devis")
        },
        onSuccess: data => {
            setStatusMessage(data)
        },
        onSettled: () => setConfirmed(true)
    })
    const [confirmed, setConfirmed] = useState(false)
    const [statusMessage, setStatusMessage] = useState("")


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
                fontSize: 20,
                alignSelf: 'center'
            }}>Achat formation</Text>


            {
                (currentBillingAddress == null && stepIndex == 0) &&
                <BillingAddressSelection onValidation={(address) => {
                    setCurrentBillingAddress(address)
                    setStepIndex(1)
                }} />
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
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <Text style={{
                        fontWeight: 'bold',
                        fontSize: 22, color: '#ffaf31'
                    }}>{statusMessage}</Text>
                    {
                        sendOrder.isSuccess &&
                        <View>
                            <Text>Un email à été envoyé à :</Text>
                            <Text>{currentBillingAddress.name} ({currentBillingAddress.email})</Text>
                            {
                                currentBillingAddress.type == "company" &&
                                <Text>ainsi qu'au(x) manager(s) de cette société</Text>
                            }
                        </View>
                    }
                    <TouchableOpacity style={{
                        paddingVertical: 10, paddingHorizontal: 30,
                        backgroundColor: '#ffaf31', borderRadius: 5,
                        position: 'absolute', bottom: 30
                    }}
                        onPress={()=>onClose()}
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
        width: Dimensions.get('screen').width * 0.9,
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})