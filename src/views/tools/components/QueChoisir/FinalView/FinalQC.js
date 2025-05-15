import { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useMutation } from "react-query";
import { LinearGradient } from "expo-linear-gradient";
import { evaluateExpression } from "../tools";
import { saveQCEntries } from "../../../../../services/tools/QueChoisirService";
import { FinalHeader } from "./FinalHeader";
import { ProductCard } from "./FinalProductCard";
import AppModal from "../../../../../component/AppModal";
import { PrimaryButton } from "../../../../../component/PrimaryButton";
import { useOrthoMasterRoles } from "../../../../../hooks/useOrthoMasterRoles";

const DisplaySubHeader = ({ title }) => {
    return (<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 20 }}>
        <View
            style={{
                borderBottomColor: 'grey',
                borderBottomWidth: 1,
                width: '5%'
            }}
        />
        <Text style={{
            fontWeight: 'bold',
            color: 'grey',
            paddingHorizontal: 15,
        }}>{title}</Text>
        <View
            style={{
                borderBottomColor: 'grey',
                borderBottomWidth: 1,
                width: '100%'
            }}
        />
    </View>)
}


export const FinalQC = ({ route, navigation }) => {
    const { userHistory, filtredProducts } = route.params.content
    const { filtersConfig, category } = route.params
    const saveEntries = useMutation(saveQCEntries)
    const [productsPref, setProductsPref] = useState([]);
    const [productsOther, setProductsOther] = useState([]);
    const [nbProduct, setNbProduct] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [orthoRefProductSelected, setOrthoRefProductSelected] = useState(null)
    const [savedAlready, setSavedAlready] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const roles = useOrthoMasterRoles()


    const findAllConditionsInRef = async (ref, formattedHistory) => {
        let conditions = []
        var refConditioned = ""
        var conditionLength = 0
        var isCondition = false

        for (let i = 0; i < ref.length; i++) { //find every condition XX(YY)   XX=refConditionned and YY=condition

            if (isCondition) {
                if (ref[i] != ';') {
                    conditionLength++
                } else {
                    if (formattedHistory.includes(refConditioned)) {
                        conditions.push(ref.substring(i - conditionLength, i))
                    }
                    conditionLength = 0
                    isCondition = false
                    refConditioned = ""
                }
            } else {
                switch (ref[i]) {
                    case ';':
                        refConditioned = ""
                        break;
                    case '?':
                        isCondition = true
                        break;
                    default:
                        refConditioned += ref[i]
                        break;
                }
            }
        }
        return conditions
    }

    const startFilterProduct = async (formattedHistory) => {
        let finalProducts = []
        for (const product of filtredProducts) {
            let productIsValide = true
            let conditions = await findAllConditionsInRef(product.qc_ref, formattedHistory)

            for (const condition of conditions) {
                const isOk = await new Promise((resolve, reject) => {
                    evaluateExpression(condition, userHistory).then((isOk) => {
                        resolve(isOk)
                    })
                })
                if (!isOk) {
                    productIsValide = false
                }
            }
            if (productIsValide) {
                finalProducts.push(product)
            }
        };
        return finalProducts
    }
    const formatUserHistory = async (history) => {
        let formattedHistory = []
        history.forEach(element => {
            element.responses.forEach(response => {
                formattedHistory.push(element.question?.ref + response.response.value)
            });
        });
        return formattedHistory
    }


    useEffect(() => {
        if (isLoading === false) {
            var createFinal = productsOther
            createFinal.push(...productsPref)

            saveEntries.mutateAsync({
                category: category,
                allFinalProductsSections: createFinal,
                userHistory: userHistory,
                filtersConfig: filtersConfig
            })
        }
    }, [isLoading])


    useEffect(() => {
        setTimeout(() => setIsLoading(false), 1000)
        formatUserHistory(userHistory)
            .then((formattedHistory) => {
                startFilterProduct(formattedHistory)
                    .then((finalProducts) => {

                        let listPref = []
                        let listOther = []
                        let nbPrd = 0
                        filtersConfig.selected.forEach(element => {
                            let toPush = finalProducts.filter((value) => value.brand === element)
                            nbPrd = nbPrd + toPush.length
                            listPref.push({
                                brand: element,
                                products: toPush
                            })

                        });
                        setProductsPref(listPref)

                        let purgedBrandList = filtersConfig.default
                        purgedBrandList = purgedBrandList.filter(x => !filtersConfig.selected.includes(x));
                        purgedBrandList = purgedBrandList.sort(() => Math.random() - 0.5);

                        purgedBrandList.forEach(element => {
                            let toPush = finalProducts.filter((value) => value.brand === element)
                            nbPrd += toPush.length
                            listOther.push({
                                brand: element,
                                products: toPush
                            })
                        })

                        setNbProduct(nbPrd)
                        setProductsOther(listOther)

                    })
            })
    }, [])

    if (isLoading)
        return <SafeAreaView style={{ flex: 1, backgroundColor: '#EC4E6E', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 25, textAlign: 'center', fontWeight: 'bold' }}>Traitement des réponses</Text>
            <Text style={{ color: '#fff', fontSize: 22, textAlign: 'center' }}>Veuillez patienter...</Text>
            <ActivityIndicator color={'#fff'} size={'large'} style={{ paddingVertical: 10 }} />
        </SafeAreaView>
    else
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
                <View style={styles.container}>
                    <FinalHeader nbProduct={nbProduct} userHistory={userHistory} navigation={navigation} />
                    <ScrollView>
                        {
                            productsPref.length > 0 &&
                            <Text style={styles.sectionTitle}>Vos marques</Text>
                        }
                        {
                            productsPref.map((products, index) => {
                                return <View key={index}>
                                    <DisplaySubHeader title={products.brand} />
                                    <View style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center'
                                    }}>
                                        {
                                            products.products.map((value, index) => {
                                                return <ProductCard
                                                    product={value}
                                                    key={index}
                                                    onPress={(product) => {
                                                        handleProductSelection(product)
                                                    }}
                                                />
                                            })
                                        }

                                    </View>
                                </View>
                            })
                        }

                        {
                            productsPref.length > 0 &&
                            <Text style={styles.sectionTitle}>Autres marques</Text>
                        }
                        {
                            productsOther.map((products, index) => {
                                return <View key={index} >
                                    <DisplaySubHeader title={products.brand} />
                                    <View style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center'
                                    }}>
                                        {
                                            products.products.map((value, index) => {
                                                return <ProductCard
                                                    product={value}
                                                    key={index}
                                                    onPress={(product) => {
                                                        handleProductSelection(product)
                                                    }}
                                                />
                                            })
                                        }

                                    </View>
                                </View>
                            })
                        }
                        <View style={{ height: 50 }} />
                    </ScrollView>

                    <LinearGradient
                        colors={['#33C0B7', '#33C0B7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.finishButton}
                    >
                        <TouchableOpacity style={{}} onPress={() => {
                            navigation.pop(2)
                        }}>
                            <Text style={{ fontSize: 16, color: 'white', fontWeight: 600 }}>Quitter</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </SafeAreaView>
        )
}

const styles = StyleSheet.create({
    finishButton: {
        borderRadius: 16,
        height: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        bottom: 10,
        right: 10,
        position: 'absolute'
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#F1F1F1'
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'grey',
        marginLeft: 15,
        marginTop: 20,
    }
})