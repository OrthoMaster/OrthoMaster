import {Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity} from "react-native";
import {View} from "react-native";
import {useQuery} from "react-query";
import {getAPIgetProducts} from "../../../services/ProductsService";
import {useEffect, useState} from "react";
import NavbarQC from "./NavbarQC";
import {getS3Image} from "../../../services/S3Service";
import {LinearGradient} from "expo-linear-gradient";
import HubspotForm from 'react-hubspot-form'
import {evaluateExpression} from "./tools";

export const FinalQC = ({route, navigation}) => {
    const [primaryProducts, setPrimaryProducts] = useState([]);
    const [secondaryProducts, setSecondaryProducts] = useState([]);
    const [productImages, setProductImages] = useState([]);
    const [firstTime, setFirstTime] = useState(true);

    const getProducts = useQuery(['Tools', 'GET', 'getProducts', "Ceinture lombaire"], () => getAPIgetProducts('Lombaire'), {
        onSuccess: (data) => {
            data.primary = [...(shuffleArray(data.primary))]
            data.secondary = [...(shuffleArray(data.secondary))]
            data.primary.forEach((element) => {
                evaluateExpression(element.qc_ref, route.params.content.userHistory).then((result) => {
                    if (result) {
                        setPrimaryProducts(primaryProducts => [...primaryProducts, element])
                        fetchProductImage(element.image_path);
                    }
                })
            })
            data.secondary.forEach((element) => {
                evaluateExpression(element.qc_ref, route.params.content.userHistory).then((result) => {
                    if (result) {
                        setSecondaryProducts(secondaryProducts => [...secondaryProducts, element])
                        fetchProductImage(element.image_path);
                    }
                })
            })
            setFirstTime(false);
        },
        enabled: firstTime
    })

    function shuffleArray(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    const fetchProductImage = (uri) => {
        getS3Image(uri)
            .then((data) => {
                setProductImages((prevImages) => ([
                    ...prevImages,
                    data,
                ]));
            })
            .catch((error) => {
                console.error('Error fetching image:', error);
            });
    };

    return (
        <SafeAreaView style={{flex: 1 }}>
            <View style={styles.container}>
                <View style={[styles.rightView, {paddingVertical: '10%'}]}>
                    <Text style={{fontWeight: 600, fontSize: 20, lineHeight: 32}}>
                        Au vu de vos réponses, nous vous recommandons :
                    </Text>
                    <ScrollView style={{flex: 1}}>
                        {
                            primaryProducts.length !== 0 ?
                            <View>
                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: '5%'}}>
                                    <Text style={{fontSize: 16, fontWeight: 500, color: '#616161'}}> First Choice </Text>
                                    <View style={{height: 1, backgroundColor: '#E2E8F0', width: '75%'}}/>
                                </View>
                                <View  style={{width: '100%', flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-evenly'}}>
                                    {
                                        primaryProducts.map((element, index) => {
                                            return (
                                                <View key={index} style={{ flexDirection: 'vertical', marginTop: '5%' }}>
                                                    <Image source={{ uri: productImages[index] }} style={styles.image} />
                                                    <Text style={{ color: '#20123A', fontSize: 16, fontWeight: 500 }}>{element.name}</Text>
                                                    <Text style={{ color: '#CBCBCB', fontSize: 12, fontWeight: 500 }}>{element.producer}</Text>
                                                </View>
                                            );
                                        })
                                    }
                                </View>
                            </View> : null
                        }
                        {
                            secondaryProducts.length !== 0 ?
                            <View>
                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: '5%'}}>
                                    <Text style={{fontSize: 16, fontWeight: 500, color: '#616161'}}> Second Choice </Text>
                                    <View style={{height: 1, backgroundColor: '#E2E8F0', width: '75%'}}/>
                                </View>
                                <View  style={{width: '100%', flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-evenly'}}>
                                    {
                                        secondaryProducts.map((element, index) => {
                                            return (
                                                <View key={index} style={{flexDirection: 'vertical', marginTop: '5%'}}>
                                                    <Image source={{uri: productImages[index + (primaryProducts.length)]}} style={styles.image} />
                                                    <Text style={{color: '#20123A', fontSize: 16, fontWeight: 500}}>{element.name}</Text>
                                                    <Text style={{color: '#CBCBCB', fontSize: 12, fontWeight: 500}}>{element.producer}</Text>
                                                </View>
                                            )
                                        })
                                    }
                                </View>
                            </View> : null
                        }
                    </ScrollView>

                    <LinearGradient
                        colors={['#E8764A', '#EC4C70']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.finishButton}
                    >
                        <TouchableOpacity style={styles.finishButton} onPress={() => {
                            navigation.pop(2)
                        }}>
                            <Text style={{fontSize: 16, color: 'white', fontWeight: 600}}>Terminer</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
                <NavbarQC global={route.params.content.globalSteps} questionIndex={route.params.content.globalSteps.length - 1} onPress={()=> {}}/>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    finishButton: {
        borderRadius: 16,
        height: 60,
        width: '90%',
        flexDirection: 'row',
        alignItems:'center',
        justifyContent:'center',
        alignSelf: 'center',
        bottom: '0%',
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff'
    },
    rightView: {
        flex: 1,
        width: '80%',
        alignSelf: 'flex-end',
    },
    image: {
        width: "90%",
        marginBottom: 10,
        resizeMode: "cover",
        height: 100,
        alignSelf: 'center',
    },
})