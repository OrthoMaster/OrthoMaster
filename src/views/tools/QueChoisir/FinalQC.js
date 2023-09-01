import { ActivityIndicator, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { View } from "react-native";
import { useQuery } from "react-query";
import { getAPIgetProducts } from "../../../services/ProductsService";
import { useEffect, useState } from "react";
import NavbarQC from "./NavbarQC";
import { getS3Image } from "../../../services/S3Service";
import { LinearGradient } from "expo-linear-gradient";
import { evaluateExpression } from "./tools";
import { FlatList } from "react-native-gesture-handler";


const DisplayHistory = ({ userHistory, onClose, onEdit }) => {
    console.log(userHistory);
    return <View style={{
        width: '90%',
        paddingTop: 20
    }}>
        <Text style={{ color: '#fff', fontSize: 22 }}>Votre récap.</Text>
        {
            userHistory.map((value, index) => {
                return <View key={index} style={{ marginVertical: 5 }}>
                    <Text style={{ color: '#fff' }}><Text style={{ fontWeight: 'bold' }}>Etape {index + 1} :</Text> {value.question.question}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {
                            value.responses.map((value, index) => {
                                return <View style={{ backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 5, margin: 2 }} key={index}>
                                    <Text style={{ color: '#EC4E6E', fontSize: 12 }}>{value.response.response}</Text>
                                </View>

                            })
                        }
                    </View>
                </View>
            })
        }
        <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.historyButton, { alignSelf: 'center' }]}
                onPress={onClose}
            >
                <Text style={{ color: '#fff' }}>Masquer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.historyButton, { alignSelf: 'center', backgroundColor: '#fff' }]}
                onPress={onEdit}
            >
                <Text style={{ color: '#EC4E6E' }}>Modifier</Text>
            </TouchableOpacity>
        </View>

    </View>
}

const ProductCard = ({ product }) => {
    const imgUrl = useQuery(['Product', 'GET', "productImage", product.id], () => getS3Image(product.image_path))
    const containerSideSize = Dimensions.get('window').width * 0.45
    return (
        <View style={{
            marginTop: '5%',
            width: containerSideSize,
            height: containerSideSize,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            shadowOpacity: 0.2,
            shadowOffset: {
                width: 0, height: 0
            }
        }}>
            <View style={{ width: '100%', alignItems: 'center' }}>
                <Image source={{ uri: imgUrl.data }} style={styles.image} />
                <Text style={{ fontSize: 10, fontWeight: 300, width: '80%', textAlign: 'left' }}>{product.type}</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, width: '80%', textAlign: 'left' }}>{product.model}</Text>
                <Text style={{ fontSize: 10, fontWeight: 500, width: '80%', textAlign: 'left' }}>{product.option} <Text style={{ color: '#ED7D32' }}>{product.brand}</Text></Text>
            </View>
        </View>
    );
}


export const FinalQC = ({ route, navigation }) => {
    const { userHistory, filtredProducts } = route.params.content
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true)
    const [historyIsVisible, setHistoryIsVisible] = useState(false)

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
        setTimeout(()=>setIsLoading(false),1000)
        formatUserHistory(userHistory)
            .then((formattedHistory) => {
                startFilterProduct(formattedHistory)
                .then((finalProducts) => {
                    let tmp = [...(shuffleArray(finalProducts))]
                    setProducts(tmp)
                })
            })
    }, [])

    function shuffleArray(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }


    if (isLoading)
        return <SafeAreaView style={{ flex: 1, backgroundColor: '#EC4E6E', justifyContent: 'center' }}>
            <Text style={{color: '#fff', fontSize: 25, textAlign: 'center', fontWeight: 'bold'}}>Traitement des réponses</Text>
            <Text style={{color: '#fff', fontSize: 22, textAlign: 'center'}}>Veuillez patienter...</Text>
            <ActivityIndicator color={'#fff'} size={'large'} style={{paddingVertical: 10}}/>
        </SafeAreaView>
    else
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
                <View style={styles.container}>
                    <View style={{
                        width: "90%",
                        backgroundColor: '#EC4E6E',
                        alignSelf: 'center',
                        alignItems: 'center',
                        borderBottomLeftRadius: 15,
                        borderBottomRightRadius: 15,
                        paddingVertical: 10
                    }}>
                        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>Terminé</Text>
                        <Text style={{ color: "#fff" }}><Text style={{ fontWeight: 'bold' }}>{products.length}</Text> produit(s) trouvé(s)</Text>

                        {
                            historyIsVisible ?
                                <DisplayHistory userHistory={userHistory} onClose={() => setHistoryIsVisible(false)} onEdit={() => navigation.pop()} />
                                : <TouchableOpacity style={styles.historyButton}
                                    onPress={() => {
                                        setHistoryIsVisible(true)
                                    }}>
                                    <Text style={{
                                        color: '#fff'
                                    }}>Voir les détails</Text>
                                </TouchableOpacity>
                        }


                    </View>
                    <FlatList
                        data={products}
                        key={(item) => item.id}
                        renderItem={(item) => (<ProductCard product={item.item} />)}
                        numColumns={2}
                        columnWrapperStyle={{
                            flex: 1,
                            justifyContent: 'space-evenly'
                        }}  // space them out evenly
                        contentContainerStyle={{
                            paddingBottom: 50,
                        }}
                    />

                    <LinearGradient
                        colors={['#EC4C70', '#E8764A']}
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
    rightView: {
        flex: 1,
        width: '80%',
        alignSelf: 'flex-end',
    },
    image: {
        width: "80%",
        marginBottom: 10,
        resizeMode: "cover",
        height: 100,
        alignSelf: 'center',
    },
    historyButton: {
        marginTop: 20,
        backgroundColor: '#EC4E6E',
        borderWidth: 1,
        borderColor: '#fff',
        padding: 5,
        shadowColor: "#fff",
        shadowOpacity: 0.3,
        shadowOffset: {
            width: 1, height: 1
        },
        width: '50%',
        alignItems: 'center'
    }
})