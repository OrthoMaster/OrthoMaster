import React, { useEffect, useState } from "react";

import {
    Modal,
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useMutation, useQuery } from "react-query";
import { getUsersByOfficeId } from "../../../services/UserService";
import { useStore } from 'react-redux';


export const PaymentFormationModal = ({
    formation
}) => {
    const store = useStore()
    const managerUser = store.getState().auth.userCurrentSession
    const officeUsers = useQuery(["GET", "USER", "OFFICE", managerUser.office_id], () => getUsersByOfficeId(managerUser.office_id))
    const [selectedCollaborators, setSelectedCollaborators] = useState([])
    const unitPrice = formation.price
    const [priceArray, setPriceArray] = useState([])

    const addCollaborator = (id, completeName) => {
        if (selectedCollaborators.find(val => val.id == id))
            return
        setSelectedCollaborators([...selectedCollaborators, { id_user: id, complete_name: completeName }])
    }
    const removeCollaborator = (id) => {
        const newArray = selectedCollaborators.filter(val => val.id_user != id)
        setSelectedCollaborators(newArray)
    }
    const addAllCollaborator = () => {
        const newArray = []
        officeUsers.data.forEach(user => {
            newArray.push({ id_user: user.id_user, complete_name: user.name + " " + user.lastname })
        });

        setSelectedCollaborators(newArray)
    }
    const removeAllCollaborator = () => {
        setSelectedCollaborators([])
    }

    const getFinalPrice = () => {
        return priceArray.reduce((a, b) => { return a + b.finalPrice }, 0)
    }

    useEffect(() => {
        const packDiscountPercent = 5
        let finalPricesArray = []
        selectedCollaborators.forEach((user, index) => {
            let discount = index * packDiscountPercent
            if (discount > 50)
                discount = 50
            finalPricesArray.push({
                unitPrice: unitPrice,
                discount: discount,
                finalPrice: Math.round((unitPrice - (unitPrice * discount / 100)) * 100) / 100
            })
        });
        setPriceArray(finalPricesArray)
    }, [selectedCollaborators])




    return (

        <View style={styles.container}>
            <Text>Accès formation</Text>
            <Text>Selectionnez les personnes qui vont bénéficier du pack</Text>
            <View style={{
                borderWidth: 1,
                borderRadius: 10,
                padding: 5,
                width: '90%',
                alignSelf: 'center'
            }}>
                <BouncyCheckbox
                    size={20}
                    fillColor="#ffaf31"
                    unFillColor="#FFFFFF"
                    text={"Tous"}
                    textStyle={styles.checkBoxText}
                    innerIconStyle={{ borderWidth: 2 }}
                    style={{ marginVertical: 5 }}
                    onPress={(isChecked) => {
                        if (isChecked)
                            addAllCollaborator()
                        else
                            removeAllCollaborator()
                    }}
                />
                <View style={{ height: 0.2, width: '100%', backgroundColor: '#000', alignSelf: "center" }} />
                <FlatList
                    data={officeUsers.data}
                    keyExtractor={(item, index) => index}

                    renderItem={(item) => <BouncyCheckbox
                        size={20}
                        fillColor="#ffaf31"
                        unFillColor="#FFFFFF"
                        textStyle={styles.checkBoxText}
                        text={item.item.name + " " + item.item.lastname +
                            (managerUser.id_user == item.item.id_user ? " (vous)" : "")}
                        innerIconStyle={{ borderWidth: 2 }}
                        style={{ marginVertical: 5 }}
                        isChecked={selectedCollaborators.find(user => user.id_user == item.item.id_user)}
                        onPress={(isChecked) => {
                            if (isChecked)
                                addCollaborator(item.item.id_user, item.item.name + " " + item.item.lastname)
                            else
                                removeCollaborator(item.item.id_user)
                        }}
                    />}
                />
            </View>

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
            <Text>Prix total : {getFinalPrice()} € HT</Text>

            <TouchableOpacity style={{
                padding: 5,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 5
            }}>
                <Text style={{color: '#fff', fontWeight: "bold"}}>Payer</Text>
            </TouchableOpacity>
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