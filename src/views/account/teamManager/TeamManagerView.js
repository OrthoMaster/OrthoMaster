import React, { useState, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
    FlatList,
    Dimensions,
    ActivityIndicator,
} from 'react-native'
import { useMutation, useQuery } from 'react-query';
import { getUsersByOfficeId } from '../../../services/UserService';
import {
    getOfficeByManager,
    getOfficeInvitationToken,
    sendActivationLink,
    removeUserFromAccount
} from '../../../services/OfficeService';
import AuthService from '../../../services/AuthService';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { FormField } from '../../../component/FormField';
import BouncyCheckbox from "react-native-bouncy-checkbox";




const UserCard = ({ user, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [statusMessage, setStatusMessage] = useState(null)
    const sendActivation = useMutation(sendActivationLink, {
        onSettled: () => setIsEditing(false),
        onSuccess: (res) => {
            setStatusMessage("Invitation envoyée")
        },
        onError: (e) => {
            setStatusMessage("Erreur d'envoie")
        }
    })
    const removeUser = useMutation(removeUserFromAccount, {
        onSettled: ()=> setIsEditing(false),
        onSuccess: (res) => {
            if (res.status == 200) {
                Alert.alert(
                    "Utilisateur supprimé",
                    `Nous vous confirmons que l'utilisateur : ${user.name} ${user.lastname} a bien été supprimé de votre espace.\n`
                )
                onRemove()
            }
        },
        onError: (e) => {
            Alert.alert(
                "Impossible de supprimer l'utilisateur",
                "Une erreur s'est produite lors de la suppression de l'utilisateur dans votre espace."
            )
        }
    })



    return <View style={{
        margin: 5,
        borderWidth: 1,
        borderColor: user.enabled ? '#ffaf31' : "#B1B1B1",
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        justifyContent: 'center'
    }}
    >
        <View style={{ flex: 2, padding: 10 }}>
            <Text style={{ color: user.enabled ? "#000" : "#B1B1B1", fontSize: 18, fontWeight: 'bold' }}>{user.name} {user.lastname}</Text>
            <Text style={{ color: user.enabled ? "#000" : "#B1B1B1" }}><Text style={{ fontWeight: 'bold' }}>Nom d'utilisateur :</Text> {user.username}</Text>
            <Text style={{ color: user.enabled ? "#000" : "#B1B1B1" }}>{user.email}</Text>
            {
                statusMessage &&
                <Text style={{
                    color: "#eb7b0f",
                    fontWeight: 'bold'
                }}>{statusMessage}</Text>
            }
        </View>
        <View style={{
            flex: 1,
            height: '100%',
            alignItems: 'center',
            padding: 10,
        }}>
            <Text style={{
                fontWeight: 'bold',
                color: user.enabled ? "#ffaf31" : "#A1A1A1",
                textAlign: 'center'
            }}>{user.enabled ? "Compte activé" : "Compte désactivé"}</Text>
            <TouchableOpacity style={{
                padding: 5,
                flexDirection: 'row',
                alignItems: 'center'
            }}
                onPress={() => setIsEditing(true)}>
                <Text style={{ marginRight: 5, color: "#162754" }}>Gérer</Text><FontAwesome5 name="cog" size={15} color="#000" />
            </TouchableOpacity>
        </View>
        {
            isEditing &&
            <View style={{
                backgroundColor: "#fff",
                position: 'absolute',
                flexDirection: 'row',
                height: '100%', width: '100%',
                borderRadius: 10,
            }}>
                {
                    isEditing &&
                    <View style={{
                        flex: 2,
                        justifyContent: 'space-around',
                        paddingLeft: 20,
                        alignItems: 'center'
                    }}>
                        {
                            user.enabled == false &&
                            <TouchableOpacity style={styles.actionButton}
                                onPress={() => sendActivation.mutate(user.username)}>
                                <Text style={{ fontSize: 12 }}>Envoyer un lien d'activation</Text>
                            </TouchableOpacity>
                        }
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F45C43' }]}
                            onPress={() => {
                                Alert.alert(
                                    'Supprimer un collaborateur',
                                    `Êtes-vous sûr de vouloir supprimer ${user.name} ${user.lastname} de votre espace ?`,
                                    [{
                                        text: 'Supprimer',
                                        onPress: () => {
                                            removeUser.mutate(user.id_user)
                                        }
                                    },
                                    {
                                        text: 'Annuler'
                                    }
                                    ]
                                );
                            }}>
                            <Text style={{
                                color: "#fff",
                                fontSize: 12,
                                textAlign: 'center'
                            }}>Supprimer le compte de mon espace</Text>
                        </TouchableOpacity>
                    </View>
                }
                <TouchableOpacity
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setIsEditing(false)}>
                    <AntDesign name="close" size={30} color="black" />
                </TouchableOpacity>
            </View>
        }
    </View>
}

const OfficeManager = ({ office }) => {
    const users = useQuery(['Account', 'GET', 'officeUsers', office.id_office], () => getUsersByOfficeId(office.id_office))
    const invitationToken = useQuery(['Account', 'GET', 'invitToken', office.id_office], () => getOfficeInvitationToken(office.id_office))
    useQuery('getJobFunction', () => AuthService.getFormProperties({ objectType: 'contact', property: 'job_function' }), {
        onSuccess: (data) => {
            let functions = []
            if (Array.isArray(data.data)) {
                data.data.forEach((elem) => {
                    functions.push({ name: elem.label, value: elem.value })
                })
                setJobFunctions(functions)
            }
        }
    })
    const registerUser = useMutation(AuthService.inviteUser, {
        onError: (e) => {
            setErrorMsg("Echec de la création d'utilisateur")
        },
        onSuccess: (data) => {
            setRegisteringUser(false)
            setNewUser({})
            users.refetch()
        }
    })
    const [jobFunctions, setJobFunctions] = useState([])
    const [isActive, setIsActive] = useState(false)
    const [registeringUser, setRegisteringUser] = useState(false)
    const [newUser, setNewUser] = useState({
        firstname: "",
        lastname: "",
        email: "",
        job_function: ""
    })
    const [isCertified, setIsCertified] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const handleFormChange = (val) => {
        setNewUser({
            ...newUser,
            [val.value]: val.text
        })
    }

    return (
        <View style={styles.officeContainer}>
            <TouchableOpacity
                style={[styles.officeButton]}
                onPress={() => {
                    if (invitationToken.isSuccess) {
                        setIsActive(!isActive)
                    } else {
                        Alert.alert("Service indisponible", "Veuillez contacter nos services")
                    }
                }}
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
                        transform: [{ rotateZ: isActive ? '90deg' : '0deg' }]
                    }}
                />

            </TouchableOpacity>
            {
                isActive &&
                <View style={{ backgroundColor: '#F0F0F0' }}>
                    <FlatList
                        data={users?.data}
                        key={(key) => key}
                        renderItem={(item) => (<UserCard user={item.item} onRemove={() => {
                            users.refetch()
                        }} />)}
                    />
                    <View style={{ marginVertical: 10 }}>
                        <Text style={{
                            alignSelf: 'center',
                            width: '60%',
                            textAlign: 'center'
                        }}>
                            Nombre de comptes restants :
                        </Text>
                        <Text style={{
                            alignSelf: 'center',
                            width: '60%',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#E75A06',
                            fontSize: 18
                        }}>
                            {invitationToken.data.use_limit}
                        </Text>
                    </View>
                    {
                        registeringUser ?
                            <View>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', fontSize: 18 }}>Inscription</Text>
                                <FormField name={"Prénom"} type={"text"} value={'firstname'} onChange={handleFormChange} required />
                                <FormField name={"Nom"} type={"text"} value={'lastname'} onChange={handleFormChange} required />
                                <FormField name={"Email"} type={"email"} value={'email'} onChange={handleFormChange} required />
                                <FormField name={"Fonction professionnelle"} type={"dropdown"} value={'job_function'} data={jobFunctions} onChange={handleFormChange} />
                                <BouncyCheckbox
                                    size={20}
                                    style={{ width: '70%', alignSelf: 'center', marginTop: 20 }}
                                    fillColor="#EA6912"
                                    unfillColor="#FFFFFF"
                                    text="Je certifie que la personne ci-dessus est un professionnel de santé et travaille dans ma structure"
                                    textStyle={{ color: '#000000', textDecorationLine: 'none', fontSize: 12 }}
                                    iconStyle={{ borderColor: "#EA6912" }}
                                    innerIconStyle={{ borderWidth: 2 }}
                                    onPress={(isChecked) => { setIsCertified(isChecked) }}
                                />

                                {
                                    errorMsg?.length > 0 &&
                                    <Text style={{ color: 'red', alignSelf: 'center', marginTop: 20 }}>{errorMsg}</Text>
                                }

                                {
                                    registerUser.isLoading ?
                                        <ActivityIndicator style={{ marginVertical: 30, alignSelf: 'center' }} />
                                        : <View style={{ flexDirection: 'row', alignSelf: 'center', backgroundColor: '#F0F0F0' }}>
                                            <TouchableOpacity style={[styles.buttonContainer, { alignSelf: 'center', backgroundColor: '#828282' }]} onPress={async () => {
                                                setRegisteringUser(false)
                                                setNewUser({})
                                                setErrorMsg("")
                                            }}>
                                                <Text style={{ color: "#fff" }}>Annuler</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.buttonContainer, { alignSelf: 'center' }]} onPress={async () => {
                                                let regEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
                                                if (newUser.firstname?.length > 0 &&
                                                    newUser.lastname?.length > 0 &&
                                                    newUser.email?.length > 0 && regEmail.test(newUser.email) &&
                                                    newUser.job_function?.length > 0 &&
                                                    isCertified == true) {

                                                    registerUser.mutate({
                                                        body: { user: newUser, office_id: office.id_office },
                                                        mode: 'pre-registration',
                                                        token: invitationToken.data.token
                                                    })
                                                    setErrorMsg("")
                                                } else {
                                                    setErrorMsg("Tout les champs doivent être remplis")
                                                }
                                            }}>
                                                <Text style={{ color: "#fff" }}>Valider</Text>
                                            </TouchableOpacity>
                                        </View>
                                }


                            </View>

                            : <TouchableOpacity
                                style={{
                                    alignSelf: 'center',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setRegisteringUser(true)
                                }}>
                                <AntDesign style={{ alignSelf: 'center', margin: 10 }} name="pluscircle" size={40} color="#E75A06" />
                            </TouchableOpacity>
                    }

                </View>
            }
        </View>)

}

export const TeamManagerView = ({ route }) => {
    const office = useQuery(['Account', 'GET', 'officeByManager'], () => getOfficeByManager())


    if (office.data == null) return

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={office.data}
                renderItem={({ item }) => <OfficeManager office={item} />}
                keyExtractor={item => item.id_office}
                style={{ width: '100%', backgroundColor: '#fff' }}
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
