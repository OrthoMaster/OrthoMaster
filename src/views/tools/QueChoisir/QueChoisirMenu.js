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
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getQCcategories } from '../../../services/tools/QueChoisirService';
import { useQuery } from 'react-query';
import { getProductsBrands } from '../../../services/ProductsService';
import FiltersQC from './FiltersQC';
import AppModal from '../../../component/AppModal';

export const QueChoisirMenu = ({ navigation }) => {
    const qcCategories = useQuery(['Tools', 'GET', 'QC categories'], () => getQCcategories())
    const brandsAvailable = useQuery(['Tools', 'GET', 'Brands'], () => getProductsBrands(), {
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

    return <LinearGradient
        colors={['#E8754B', '#E8754B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.containerTool}
    >


        <Image
            style={styles.toolQCImage}
            source={require('../../../../assets/tools/que-choisir.png')}
        />
        <Text style={styles.toolTitle}>
            Que choisir ?
        </Text>

        <FlatList
            data={qcCategories.data}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (<TouchableOpacity
                style={styles.containerButtons}
                onPress={() => navigation.navigate('tools-que-choisir', {
                    category: item.item.name,
                    filtersConfig: filters.queChoisir
                })}
            >
                <Text style={styles.toolButtonText}>{item.item.name}</Text>
            </TouchableOpacity>)
            }
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{
                flex: 1,
                justifyContent: 'space-evenly',
                paddingVertical: 10
            }}
            style={{ width: '70%' }}
        />

        <Text style={{ fontSize: 10, color: '#394149', fontStyle: 'italic', textAlign: 'center', width: '60%' }}>Consultez nos Conditions Générales d'Utilisation pour l'outil Que choisir ?</Text>
        <Pressable onPress={() => {
            Linking.openURL("https://www.orthomaster.fr/cgu-que-choisir")
        }}>
            <Text style={{ fontSize: 12, color: '#394149', textAlign: 'center', width: '60%', textDecorationLine: 'underline' }}>ICI</Text>
        </Pressable>
        <AppModal isVisible={showFilters} style={{
            width: '90%'
        }}
            customRender={<FiltersQC onChange={(filters) => {
                AsyncStorage.setItem("qcFilters", filters.toString())
                handleFilters(filters)
            }}
                filterConfig={filters.queChoisir}
            />}
            onClose={() => setShowFilters(false)}
        />

        <TouchableOpacity style={[{
            backgroundColor: '#fff',
            padding: 10,
            borderRadius: 100,
            position: 'absolute',
            right: 10,
            top: 10,
            shadowOpacity: 0.25,
            shadowOffset: { width: 5, height: 5 }
        }]}
            onPress={() => setShowFilters(true)}>
            <MaterialCommunityIcons name="format-list-numbered" size={24} color="#EC4E6E" />
            {
                filters.queChoisir.selected.length > 0 &&
                <View style={{
                    backgroundColor: '#EC5369',
                    borderColor: '#fff',
                    borderWidth: 1,
                    alignItems: 'center',
                    borderRadius: 100,
                    position: 'absolute',
                    width: 20, height: 20,
                    bottom: -5, right: -5,
                    justifyContent: 'center',
                    shadowOpacity: 0.25, shadowOffset: { width: 0, height: 0 }
                }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>1</Text>
                </View>
            }
        </TouchableOpacity>
    </LinearGradient>
}

const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        flex: 1,
        alignItems: 'center',
    },
    containerTitle: {
        fontSize: 35,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginLeft: 40,
        marginVertical: 30
    },
    containerTool: {
        width: '80%',
        alignItems: 'center',
        paddingVertical: 30,
        borderRadius: 16
    },
    toolQCImage: {
        height: 200,
        width: '100%',
        resizeMode: 'contain',
    },
    toolTitle: {
        color: '#ffffff',
        fontSize: 25,
        fontWeight: 'bold',
        marginVertical: 20
    },
    containerButtons: {
        backgroundColor: '#ffffff',
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
        fontSize: 17,
        color: '#EC4C70',
    },
    toolButtonIcon: {
        width: 15,
        height: 15,
        tintColor: '#EC4C70'
    }

})

