import React from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ScrollView
} from "react-native";

import { useStore } from "react-redux";


const DisplayUserInfo = ({ dataType, data }) => {

    if (dataType == 'Type de compte') {
        switch (data) {
            case 0:
                data = 'Administrateur'
                break;
            case 1:
                data = 'Titulaire'
                break;
            case 2:
                data = 'Collaborateur'
                break;
            default:
                data = 'inconnue'
                break;
        }
    }

    if (dataType == 'Téléphone') {
        if (data == '')
            data = 'inconnue'
    }

    return (
        <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: '10', color: '#E75A08', fontWeight: 'bold' }}>{dataType}</Text>
            <Text style={{ fontSize: 15 }}>{data}</Text>
        </View>
    )
}


export const AccountProfile = () => {
    const store = useStore()
    const userState = store.getState().auth.userCurrentSession

    console.log(userState);

    return (
        <SafeAreaView>
            <ScrollView>
                <View style={styles.container}>
                    <View style={styles.user}>
                        <Image
                            style={{
                                height: Dimensions.get('screen').width / 4,
                                width: Dimensions.get('screen').width / 4,
                                resizeMode: 'contain'
                            }}
                            source={require('../../../../assets/settings/profile/user.png')}
                        />
                        <Text style={styles.nameText}>{userState.name + ' ' + userState.lastname}</Text>
                    </View>
                    <View style={styles.personalInfoContainer}>
                        <Text style={styles.primaryText}>Informations personnelles</Text>
                        <DisplayUserInfo
                            dataType={"Nom d'utilisateur"}
                            data={userState.username}
                        />
                        <DisplayUserInfo
                            dataType={"Type de compte"}
                            data={userState.user_type_id}
                        />
                        <DisplayUserInfo
                            dataType={"E-mail"}
                            data={userState.email}
                        />
                        <DisplayUserInfo
                            dataType={"Téléphone"}
                            data={userState.tel}
                        />

                        <TouchableOpacity style={{
                            alignSelf: 'center',
                            paddingVertical: 10
                        }}>
                            <Text style={{
                                color: '#E75A08'
                            }}>Changer de mot de passe</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#ffffff",
    },
    user: {
        flexDirection: 'row',
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
        paddingVertical: 10

    },
    nameText: {
        fontSize: 25,
        fontWeight: 'bold',
        paddingHorizontal: 20,
    },
    primaryText: {
        fontWeight: 'bold',
        fontSize: 18
    },
    secondaryText: {

    },
    personalInfoContainer: {
        width: '100%',
        alignSelf: 'center',
        padding: 20
    }
})