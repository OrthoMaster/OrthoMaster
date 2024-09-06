import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";

export default PriceRecap = ({ selectedCollaborators, unitPrice }) => {
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

    return <View style={{  }}>
        {/* <Text>Nombre de licence : {selectedCollaborators.length}</Text> */}

        <View style={{
            display: 'flex',
            flexDirection: "row",
            width: "95%", height: 40,
            alignSelf: 'center',
            marginVertical: 10,
            backgroundColor: '#ffaf31',
            alignItems: 'center',
        }}>
            <View style={[styles.recapHeaderBox, {flex: 2}]}>
                <Text style={styles.recapHeaderLabel}>Produit</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Prix unitaire</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Quantité</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Remise</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Prix final</Text>
            </View>
        </View>
        {
            priceArray.map((value, index) => {
                return <View key={index} style={{
                    display: 'flex',
                    flexDirection: "row",
                    width: "95%",
                    alignSelf: 'center',
                    marginVertical: 2,
                    borderBottomWidth: 0.3
                }}>
                    <View style={[styles.recapBodyBox, {flex: 2}]}>
                        <Text style={styles.recapBodyLabel}>License formation</Text>
                    </View>
                    <View style={styles.recapBodyBox}>
                        <Text style={styles.recapBodyLabel}>{unitPrice} €</Text>
                    </View>
                    <View style={styles.recapBodyBox}>
                        <Text style={styles.recapBodyLabel}>1</Text>
                    </View>
                    <View style={styles.recapBodyBox}>
                        <Text style={styles.recapBodyLabel}>{value.discount} %</Text>
                    </View>
                    <View style={styles.recapBodyBox}>
                        <Text style={styles.recapBodyLabel}>{value.finalPrice} €</Text>
                    </View>
                </View>
            })
        }
        <Text style={{
            marginTop: 20
            }}>
                <Text style={{
                    fontWeight: 'bold',
                    color: '#ffaf31'
                }}>Prix total : </Text>{getFinalPrice()} € HT</Text>
    </View>
}

const styles = StyleSheet.create({
    recapHeaderBox: {
        flex: 1,
        borderColor: '#fff',
        borderWidth: 1,
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    recapHeaderLabel: {
        color: '#fff',
        fontSize: 12
    },
    recapBodyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recapBodyLabel: {
        fontSize: 12
    }
})