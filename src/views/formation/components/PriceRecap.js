import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";

export default PriceRecap = ({ selectedCollaborators, unitPrice }) => {
    const [reducedPrice, setReducedPrice] = useState([])



    useEffect(() => {
        
        if (selectedCollaborators.length <= 0) {
            setReducedPrice(0)
        } else {
            if (selectedCollaborators.length < 11) {
                const packDiscountPercentPerLicence = 2.5
                const discount = packDiscountPercentPerLicence * (selectedCollaborators.length - 1 )
                setReducedPrice(unitPrice * ((100 - discount) / 100))

            } else {
                setReducedPrice(unitPrice * ((100 - 25) / 100))
            }
        }


        // let finalPricesArray = []
        // selectedCollaborators.forEach((user, index) => {
        //     let discount = index * packDiscountPercent
        //     if (discount > 50)
        //         discount = 50
        //     finalPricesArray.push({
        //         unitPrice: unitPrice,
        //         discount: discount,
        //         finalPrice: Math.round((unitPrice - (unitPrice * discount / 100)) * 100) / 100
        //     })
        // });
    }, [selectedCollaborators])

    return <View style={{}}>
        <View style={{
            display: 'flex',
            flexDirection: "row",
            width: "100%", height: 30,
            alignSelf: 'center',
            backgroundColor: '#ffaf31',
            alignItems: 'center',
        }}>
            <View style={[styles.recapHeaderBox, { flex: 2 }]}>
                <Text style={styles.recapHeaderLabel}>Produit</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Qté</Text>
            </View>
            <View style={styles.recapHeaderBox}>
                <Text style={styles.recapHeaderLabel}>Prix</Text>
            </View>
        </View>
        <View style={{
            display: 'flex',
            flexDirection: "row",
            width: "100%",
            alignSelf: 'center',
        }}>
            <View style={[styles.recapBodyBox, { flex: 2 }]}>
                <Text style={styles.recapBodyLabel}>License formation</Text>
            </View>
            <View style={styles.recapBodyBox}>
                <Text style={styles.recapBodyLabel}>{selectedCollaborators.length}</Text>
            </View>
            <View style={styles.recapBodyBox}>
                <Text style={styles.recapBodyLabel}>{reducedPrice} €</Text>
            </View>
        </View>

        <Text style={{
            marginTop: 20,
            alignSelf: 'flex-end'
        }}>
            <Text style={{
                fontWeight: 'bold',
                color: '#ffaf31'
            }}>Prix total : </Text>{reducedPrice * selectedCollaborators.length} € HT</Text>
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