import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Platform
} from 'react-native'
import { useQuery, useQueryClient } from 'react-query';
import { getUsersByOfficeId } from '../../../services/UserService';
import { getUserRegisteredFormation } from '../../../services/FormationService';
import AddMemberOfficeForm from '../../../component/forms/AddMemberOfficeForm';
import Toast from 'react-native-toast-message';




const UserCard = ({ user, onRemove }) => {
    const [isOpen, setIsOpen] = useState(false)
    const formations = useQuery(["user-formations", user.id_user], () => getUserRegisteredFormation({
        idUser: user.id_user
    }), {
        enabled: isOpen
    })
    console.log(user);


    return <View style={{
        margin: 5,
        borderWidth: 1,
        borderColor: '#ffaf31',
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center'
    }}
    >
        <TouchableOpacity style={{ padding: 10 }}
            onPress={() => {
                setIsOpen(!isOpen)
            }}
        >
            <Text style={{ color: "#000", fontSize: 15, fontWeight: 'bold' }}>{user.name} {user.lastname}</Text>
            <Text style={{ color: "#000" }}>{user.email}</Text>
            {
                user.is_office_manager == true &&
                <View style={{
                    position: 'absolute',
                    justifyContent: 'center',
                    bottom: 0, top: 0, right: 20
                }}>
                    <Text style={{
                        color: '#ffaf31',
                        fontWeight: 'bold', fontSize: 10
                    }}>Manager</Text>
                </View>
            }
        </TouchableOpacity>
        {
            isOpen &&
            <View style={{
                width: "90%",
                alignSelf: 'center',
                paddingBottom: 20
            }}>
                <Text style={{
                    fontWeight: 'bold'
                }}>Formations</Text>
                {
                    (formations.data && formations.isFetched) &&
                    formations.data.map((value, index) => {
                        const isDemo = !value.certifying && !value.is_paid

                        return <View key={index} style={{
                            marginVertical: 2,
                            paddingHorizontal: 10,
                            paddingVertical: 10,
                            backgroundColor: '#F1F1F1',
                            width: '100%',
                            alignSelf: 'center'
                        }}>
                            <Text style={{
                                fontWeight: 'bold',
                                fontSize: 13
                            }}>{value.formation_name}</Text>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-around'
                            }}>
                                <Text style={{
                                    fontSize: 11
                                }}>🎖️ {Math.round(value.progress_rate)} %</Text>
                                <Text style={{
                                    fontSize: 11
                                }}>🕰️ {value.time_spent}</Text>
                            </View>
                            <Text style={{
                                color: '#ffaf31',
                                position: 'absolute',
                                right: 5, top: 5,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }}>
                                {
                                    isDemo ?
                                        "Démo"
                                        : value.certifying ?
                                            "Certif"
                                            : "Payé"
                                }
                            </Text>
                        </View>

                    })
                }
            </View>
        }
    </View>
}


export const OfficeManagerView = ({ route, navigation }) => {
    const office = route.params.office
    const users = useQuery(['office-users'], () => getUsersByOfficeId(office.id_office))
    const [addingMembers, setAddingMembers] = useState(false)
    const queryClient = useQueryClient()

    const showToast = ({
        type = 'success',
        text1 = 'Hello',
        text2 = 'This is some something 👋'
    }) => {
        Toast.show({
            type: type,
            text1: text1,
            text2: text2
        });
    }

    useEffect(() => {
        navigation.setOptions({ title: office.name })
    }, [])


    return (
        <View style={styles.container}>



            <ScrollView>
                <View style={{
                    padding: 20,
                    borderRadius: 5,
                    borderWidth: 0.3,
                    margin: 20
                }}>
                    <Text style={{ fontWeight: "bold" }}>{office.name}</Text>
                    <View >
                        <Text>Adresse</Text>
                        <Text>{office.address_way}</Text>
                        <Text>{office.address_postal_code} {office.address_city}</Text>
                        <Text>{office.address_country}</Text>
                    </View>

                </View>
                <View style={{
                    backgroundColor: '#ffaf31'
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#fff',
                        marginTop: 10, marginLeft: 10
                    }}>Utilisateurs</Text>
                    {
                        (users.data && users.isFetched && !users.isLoading) &&
                        users.data.map((value, index) => {
                            return <UserCard key={index} user={value} />
                        })
                    }
                    <TouchableOpacity style={{
                        borderWidth: 2,
                        alignItems: 'center',
                        borderRadius: 10,
                        borderStyle: "dashed",
                        paddingVertical: 10,
                        margin: 10
                    }}
                        onPress={() => {
                            if (office.is_office_manager) {
                                setAddingMembers(true)
                            } else {
                                showToast({
                                    type: "error",
                                    text1: "Accès non autorisé",
                                    text2: "Responsable entreprise uniquement"
                                })
                            }
                        }}>
                        <Text>Ajouter un membre</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
            {
                addingMembers &&
                <ScrollView
                    contentContainerStyle={{}}
                    automaticallyAdjustKeyboardInsets={true}
                    style={{
                        backgroundColor: '#fff',
                        alignSelf: 'center',
                        width: '100%', height: '100%',
                        position: 'absolute'
                    }}
                >
                    <AddMemberOfficeForm
                        onSuccess={() => {
                            showToast({
                                type: "success",
                                text1: "Utilisateur ajouté",
                                text2: "Votre espace pro reste modifiable sur votre page entreprise"
                            })
                        }}
                        onError={(errorMessage) => {
                            showToast({
                                type: "error",
                                text1: "Echec de l'ajout",
                                text2: errorMessage
                            })
                        }}
                        attachedOffice={office}
                        onEnd={() => {
                            setAddingMembers(false)
                            queryClient.invalidateQueries('office-users')
                        }}
                    />
                </ScrollView>
            }
            <Toast position="bottom" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    officeContainer: {
        width: '100%',
        marginVertical: 10,
        backgroundColor: '#fff',
        shadowOpacity: 0.3,
        shadowOffset: { height: 0 }
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
    },
    buttonContainer: {
        backgroundColor: '#EA6912',
        paddingHorizontal: 10,
        paddingVertical: 20,
        marginHorizontal: 5,
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 0 },
        width: Dimensions.get('screen').width * 0.4,
        alignItems: "center",
        justifyContent: 'center',
        marginVertical: 30
    },
    actionButton: {
        backgroundColor: '#fff',
        paddingVertical: 5, paddingHorizontal: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowRadius: 2,
        shadowOffset: {
            width: 2,
            height: 2,
        },
        shadowOpacity: 0.5,
    }
})
