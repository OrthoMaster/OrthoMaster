import React, { useEffect, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from "react-native";
import BillingAddressSelection from "./BillingAddressSelection";
import UserSelectionStep from "./UserSelectionStep";
import ConfirmationStep from "./ConfirmationStep";
import { useQuery } from "react-query";
import { getCurrentUser } from "../../../../services/UserService";


export const PaymentFormationModal = ({
    formation
}) => {
    const {data: currentUser} = useQuery("current-user", ()=>getCurrentUser())
    const [currentBillingAddress, setCurrentBillingAddress] = useState(null)
    const [selectedUsers, setSelectedUsers] = useState(null)
    const [stepIndex, setStepIndex] = useState(0)

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
            }}>Accès formation</Text>


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
                />
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