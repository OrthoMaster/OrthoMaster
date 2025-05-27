import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Linking,
    SafeAreaView
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";
import { getProductsBrands } from '../../../../../services/ProductsService';
import FiltersQC from './components/Filters/FiltersQC';
import FiltersButton from './components/Filters/FiltersButton';
import CategoriesSelection from './components/Categories/CategoriesSelection';
import { ScrollView } from 'react-native-gesture-handler';


export const QueChoisirButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
    return (<TouchableOpacity
        style={{
            flexDirection: 'row',
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: '#33C0B7',
            padding: 20,
            borderRadius: 15
        }}
        onPress={onPress}
    >
        <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>Que Choisir ?</Text>
    </TouchableOpacity>)
}

type QueChoisirMenuProps = {
    onClose: () => any;
    onStart: (category: string, filtersConfig: any) => any;
}

export const QueChoisirMenu: React.FC<QueChoisirMenuProps> = ({ onClose, onStart }) => {
    useQuery({
        queryKey: ['Tools', 'GET', 'Brands'],
        queryFn: () => getProductsBrands().then((res) => {
            setFilters({
                ...filters,
                queChoisir: {
                    ...filters.queChoisir,
                    default: res.brands
                }
            })
            return res
        })
    })
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        queChoisir: {
            default: [],
            selected: []
        }
    })

    const handleFilters = (newFilters) => {
        setFilters({
            ...filters,
            queChoisir: {
                ...filters.queChoisir,
                selected: newFilters
            }
        })
    }





    useEffect(() => {
        AsyncStorage.getItem("qcFilters", (err, result) => {
            if (result) {
                handleFilters(result.split(','))
            }
        })
    }, [])

    return <SafeAreaView style={styles.container}>

            <View style={{ width: '100%', height: '95%', alignItems: 'center' }}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        bottom: 0, left: 5,
                        padding: 10
                    }}
                    onPress={() => {
                        Linking.openURL("https://www.orthomaster.fr/cgu-que-choisir")
                    }}>
                    <AntDesign name="infocirlceo" size={24} color="white" />
                </TouchableOpacity>

                <FiltersButton
                    style={{
                        backgroundColor: '#fff',
                        padding: 10,
                        borderRadius: 5,
                        shadowOpacity: 0.25,
                        shadowOffset: { width: 0, height: 0 },
                        alignItems: 'center',
                        top: 10, right: 10,
                        alignSelf: 'flex-end',
                        zIndex: 1000,
                        position: 'absolute'
                    }}
                    nbFiltersSelected={filters.queChoisir.selected.length}
                    onPress={() => {
                        setShowFilters(!showFilters)
                    }}
                    showFilters={showFilters}
                />
                <Image
                    source={require('../../../../../../assets/tools/que-choisir.png')}
                    style={{
                        width: "95%", resizeMode: 'contain', height: 250,
                    }}
                />
                <CategoriesSelection
                    onSelect={(category) => {
                        onStart(category, filters.queChoisir)
                    }}
                />

                {
                    showFilters &&
                    <View style={{
                        position: 'absolute',
                        height: '100%', width: '100%',
                        zIndex: 2,
                        alignItems: 'center',
                    }}
                       
                    >
                        <FiltersQC onChange={(filters) => {
                            AsyncStorage.setItem("qcFilters", filters.toString())
                            handleFilters(filters)
                        }}
                            filterConfig={filters.queChoisir}
                        />
                    </View>
                }
            </View>


            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 10,
                    alignSelf: 'center',
                    zIndex: 1
                }}
                onPress={onClose}>
                <Ionicons name="close-circle" size={34} color="#fff" />
            </TouchableOpacity>
    </SafeAreaView>
}

const styles = StyleSheet.create({

    container: {
        width: '100%', height: '95%',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: "#33C0B7",
    },
    toolTitle: {
        color: '#ffffff',
        fontSize: 25,
        fontWeight: 'bold',
        marginTop: 10
    },
    containerButtons: {
        backgroundColor: '#F97302',
        width: 80, height: 80,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 5, height: 5
        }
    },
    toolButtonText: {
        fontSize: 12,
        color: '#fff',
        width: '90%',
        textAlign: 'center'
    },
    toolButtonIcon: {
        width: 15,
        height: 15,
        tintColor: '#EC4C70'
    }

})

