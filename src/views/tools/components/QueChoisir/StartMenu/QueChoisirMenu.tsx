import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Pressable,
    Image,
    Linking,
    StatusBar,
    Platform,
    Dimensions,
    SafeAreaView
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getQCcategories } from '../../../../../services/tools/QueChoisirService';
import { useQuery } from 'react-query';
import { getProductsBrands } from '../../../../../services/ProductsService';
import FiltersQC from './components/Filters/FiltersQC';
import FiltersButton from './components/Filters/FiltersButton';
import CategoriesSelection from './components/Categories/CategoriesSelection';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { ScrollView } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('screen');



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
        {/* <Image
            source={require('../../../../../../assets/tools/que-choisir.png')}
            style={{
                width: 40, height: 40, marginRight: 10,
                resizeMode: 'contain',
            }}
        /> */}
        <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>Que Choisir ?</Text>
    </TouchableOpacity>)
}

type QueChoisirMenuProps = {
    onClose: () => any;
    onStart: (category: string, filtersConfig: any) => any;
}

export const QueChoisirMenu: React.FC<QueChoisirMenuProps> = ({ onClose, onStart }) => {
    useQuery(['Tools', 'GET', 'Brands'], () => getProductsBrands(), {
        onSuccess: (data) => {
            setFilters({
                ...filters,
                queChoisir: {
                    ...filters.queChoisir,
                    default: data.brands
                }
            })
        }
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

    return <SafeAreaView>


        <LinearGradient
            colors={['#33C0B7', '#33C0B7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.containerGradient}

        >

            <View style={{ width: '100%', height: '95%', alignItems: 'center' }}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 5, left: 5,
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
                        marginTop: 10, marginRight: 10,
                        alignSelf: 'flex-end',
                        zIndex: 1000
                    }}
                    nbFiltersSelected={filters.queChoisir.selected.length}
                    onPress={() => {
                        setShowFilters(!showFilters)
                    }}
                    showFilters={showFilters}
                />
                <Text style={styles.toolTitle}>
                    Que choisir ?
                </Text>

                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                }}>
                    <CategoriesSelection
                        onSelect={(category) => {
                            onStart(category, filters.queChoisir)
                        }}
                    />
                </View>

                {
                    showFilters &&
                    <ScrollView style={{
                        position: 'absolute',
                        height: '100%', width: '100%',
                        zIndex: 2,
                    }}
                        contentContainerStyle={{
                            alignItems: 'center',
                        }}
                    >
                        <FiltersQC onChange={(filters) => {
                            AsyncStorage.setItem("qcFilters", filters.toString())
                            handleFilters(filters)
                        }}
                            filterConfig={filters.queChoisir}
                        />
                    </ScrollView>
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
        </LinearGradient>
    </SafeAreaView>
}

const styles = StyleSheet.create({

    containerGradient: {
        width: '100%', height: '100%',
        alignItems: 'center',
        borderRadius: 15
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

