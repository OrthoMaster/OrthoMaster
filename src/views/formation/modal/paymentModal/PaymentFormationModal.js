import React, { useEffect, useState } from "react";

import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    Linking,
    ActivityIndicator
} from "react-native";
import { useMutation, useQuery } from "react-query";
import { getCurrentUser, getUsersByOfficeId } from "../../../../services/UserService";
import { useStore } from 'react-redux';
import { getEspaceProByOffice, getOfficeInfos } from "../../../../services/OfficeService";


export const PaymentFormationModal = ({
    formation
}) => {
    const currentUser = useQuery("current-user", ()=>getCurrentUser())
    const getofficeEspacePro = useQuery(["office-espaces-pro",currentUser.data.office_id],()=>getEspaceProByOffice({
        id_office: currentUser.data.office_id
    }), { enabled: currentUser.status == "success" && currentUser.data.office_id != null})

    
    const unitPrice = formation.price
    const [priceArray, setPriceArray] = useState([])
    const [errorMessage, setErrorMessage] = useState(null)
    const [isLoading, setIsLoading] = useState(false)


    const getFinalPrice = () => {
        return priceArray.reduce((a, b) => { return a + b.finalPrice }, 0)
    }

    // useEffect(() => {
    //     const packDiscountPercent = 5
    //     let finalPricesArray = []
    //     selectedCollaborators.forEach((user, index) => {
    //         let discount = index * packDiscountPercent
    //         if (discount > 50)
    //             discount = 50
    //         finalPricesArray.push({
    //             unitPrice: unitPrice,
    //             discount: discount,
    //             finalPrice: Math.round((unitPrice - (unitPrice * discount / 100)) * 100) / 100
    //         })
    //     });
    //     setPriceArray(finalPricesArray)
    //     setErrorMessage(null)
    // }, [selectedCollaborators])




    return (

        <View style={styles.container}>
            <Text>Accès formation</Text>





            {/* 
            <Text>Nombre de licence : {selectedCollaborators.length}</Text>

            <Text>Details</Text>
            <View style={{
                display: 'flex',
                flexDirection: "row",
                width: "95%",
                alignSelf: 'center',
                justifyContent: 'space-between'
            }}>
                <View>
                    <Text>Produit</Text>
                    {
                        priceArray.map((value, index) => {
                            return <Text key={index}>License formation</Text>
                        })
                    }
                </View>
                <View>
                    <Text>Prix unitaire</Text>
                    {
                        priceArray.map((value, index) => {
                            return <Text key={index}>{formation.price} €</Text>
                        })
                    }
                </View>
                <View>
                    <Text>Quantité</Text>
                    {
                        priceArray.map((value, index) => {
                            return <Text key={index}>1</Text>
                        })
                    }
                </View>
                <View>
                    <Text>Remise</Text>
                    {
                        priceArray.map((value, index) => {
                            return <Text key={index}>{value.discount} %</Text>
                        })
                    }
                </View>
                <View>
                    <Text>Prix final</Text>
                    {
                        priceArray.map((value, index) => {
                            return <Text key={index}>{value.finalPrice} €</Text>
                        })
                    }
                </View>
            </View>
            <Text>Prix total : {getFinalPrice()} € HT</Text> */}

            {/* {
                errorMessage &&
                <Text>{errorMessage}</Text>
            }
            {
                isLoading &&
                <ActivityIndicator />
            }

            <TouchableOpacity style={{
                padding: 5,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 5
            }}
            onPress={()=>{
                if (selectedCollaborators.length > 0) {
                    if (selectedCollaborators.length <= 2) {
                        setIsLoading(true)
                        buyLicence.mutate({id_formation: formation.id_formation, selectedUsers: selectedCollaborators})
                    } else {
                        setErrorMessage("Vous pouvez acheter jusqu'à 10 packs en une fois")
                    }
                } else {
                    setErrorMessage("1 utilisateur doit être séléctionné au minimum.")
                }
            }}>
                <Text style={{color: '#fff', fontWeight: "bold"}}>Payer</Text>
            </TouchableOpacity> */}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "60%",
        width: Dimensions.get('screen').width * 0.9
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})