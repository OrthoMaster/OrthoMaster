import React, { useEffect, useState } from 'react'

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'

import { useQuery } from 'react-query'


import { getUserAttachedOffices } from '../../../services/OfficeService'

const OfficeButton = ({ office, navigation }) => {

    return <View>
        <TouchableOpacity style={styles.progressButtonContainer}
            onPress={() => {
                navigation.navigate("account-office", {
                    office: office
                })
            }}
        >
            <View style={styles.progressButton}>
                <Text style={{
                    fontWeight: 'bold'
                }}>{office.name}</Text>
                <Text>{office.address_way}</Text>
                <Text>{office.address_postal_code} {office.address_city}</Text>
                <Text>{office.address_country}</Text>
            </View>

        </TouchableOpacity>
    </View>

}

export const CompanyArea = ({ refreshing, navigation }) => {
    const { data: offices, isLoading, isFetched, refetch } = useQuery(['user-offices'], () => getUserAttachedOffices({}))
    useEffect(() => {
        if (refreshing) {
            refetch()
        }
    }, [refreshing])


    return (
        <View style={styles.container}>
            <View style={styles.displayContainer}>
                <View style={styles.headerContainer}>
                    <Text style={[styles.sectionTitle, { color: '#fffefd' }]}>Espace pro</Text>
                </View>
                <View>
                    {
                        (offices && !isLoading && isFetched) &&
                        offices.map((value, key) => {
                            return <OfficeButton office={value} key={key} navigation={navigation}/>
                        })
                    }
                    <TouchableOpacity style={{
                        padding: 30,
                        alignItems: 'center',
                        borderRadius: 10, borderWidth: 2,
                        borderStyle: 'dashed'
                    }}
                        onPress={() => {
                            navigation.navigate('account-add-office')
                        }}
                    >
                        <Text>Ajouter un espace-pro</Text>
                        <Text>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffaf31',
        width: '100%',
        alignItems: 'center',
    },
    sectionTitle: {
        marginLeft: 10,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 20,
        color: '#F76F10'
    },
    displayContainer: {
        width: '95%',
        paddingBottom: 20,
        marginVertical: 5
    },
    headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButtonText: {
        fontWeight: 'bold',
        color: '#ffaf31',
        marginEnd: 5
    },
    officeStat: {
        fontSize: 40,
        fontWeight: '800'
    },
    officeStatText: {
        fontSize: 20,
        fontWeight: '500'
    },
    userProgressContainer: {
        width: '95%'
    },
    progressButtonContainer: {
        backgroundColor: '#fffefd',
        width: '100%',
        marginVertical: 5,
        paddingVertical: 10,
        borderRadius: 5,
        flexDirection: 'row'
    },
    progressButton: {
        width: '80%',
        marginLeft: 20

    },
    progressButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    progressBar: {
        backgroundColor: '#ADADAD',
        height: 5,
        width: '100%',
        marginTop: 5
    },
    formationProgress: {
        backgroundColor: '#ffaf31',
        height: '100%',

    },
    progressButtonIcon: {
        width: 15,
        height: 15,
        alignSelf: 'center',
        marginLeft: 20
    },
    userProgressContainer: {
        backgroundColor: '#fffefd',
        padding: 10
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        alignSelf: 'center',
        alignItems: 'flex-end'
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    stat: {
        fontWeight: '600',
        fontSize: 25,
    },
    statText: {
        fontWeight: '400',
        fontSize: 15,
        color: '#fffefd',
    },
    statText: {
        fontWeight: '400',
        fontSize: 13,
        textAlign: 'center'
    },
    trophiesTriggerContainer: {
        alignItems: 'center'
    },
    trophiesTriggerArrow: {
        width: 15,
        height: 15,
        tintColor: '#F76F10'
    },
    trophiesTriggerText: {
        color: '#ffaf31',
        marginTop: 10,
        marginBottom: 20
    }
})