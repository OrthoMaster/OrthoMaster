import React, { useState } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
    FlatList
} from 'react-native'
import { useQuery } from 'react-query';
import { activateUser, getUsersByOfficeId, resetUserPassword } from '../../../services/UserService';

import { getOfficeByManager } from '../../../services/OfficeService';



const OfficeUser = ({user}) => {
    return <Text>USer</Text>
}

const OfficeManager = ({ office }) => {
    const users = useQuery(['Account', 'GET', 'officeUsers'], () =>getUsersByOfficeId(office.id_office))
    console.log(users.data);
    const [isActive, setIsActive] = useState(false)
    return (
        <View style={styles.officeContainer}>
            <TouchableOpacity
            style={styles.officeButton}
                onPress={() => {setIsActive(!isActive)}}
            >
                <View>
                    <Text style={styles.officeButtonText}>{office.name}</Text>
                    <Text style={styles.officeButtonTextSecondary}>{office.address_way}, {office.address_postal_code} {office.address_city}</Text>

                </View>
                <Image
                source={require('../../../../assets/navigation/right-arrow.png')}
                style={{
                    height: 15,
                    width: 15,
                    resizeMode: 'contain',
                    transform: [{rotateZ: isActive ? '90deg': '0deg'}]
                }}
                />

            </TouchableOpacity>
        {
            isActive &&
            <Text>Hello</Text>
        }
        </View>)

}

export const TeamManagerView = ({ route }) => {
    const { managerId } = route.params
    console.log(managerId);
    const office = useQuery(['Account', 'GET', 'officeByManager'], () => getOfficeByManager())
    console.log(office.data);

    if (office.data == null) return

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={office.data}
                renderItem={({ item }) => <OfficeManager office={item} />}
                keyExtractor={item => item.id_office}
                style={{width: '100%'}}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
        alignItems: 'center',
    },
    officeContainer: {
        width: '100%',
        marginVertical: 5,
        borderBottomWidth: 0.2
    },
    officeButton: {
        flexDirection: 'row',
        paddingVertical: 20,
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    officeButtonText: {
        fontWeight: 'bold'
    },
    officeButtonTextSecondary: {
        fontSize: 12
    }
})
