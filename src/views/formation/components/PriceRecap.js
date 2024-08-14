import React, {useState, useEffect} from "react";
import {
    View,
    Text
} from "react-native";

export default PriceRecap = ({selectedCollaborators, unitPrice}) => {
    const [priceArray, setPriceArray] = useState([])

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

    return <View style={{ marginTop: 20 }}>
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
                        return <Text key={index}>{unitPrice} €</Text>
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
    </View>
}