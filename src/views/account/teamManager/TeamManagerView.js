import React, { useState, useCallback } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
    FlatList,
    Dimensions,
    RefreshControl,
    ActivityIndicator
} from 'react-native'
import { useMutation, useQuery } from 'react-query';
import { getUsersByOfficeId } from '../../../services/UserService';
import { getOfficeByManager, getOfficeInvitationToken } from '../../../services/OfficeService';
import AuthService from '../../../services/AuthService';
import { AntDesign } from '@expo/vector-icons';
import { FormField } from '../../../component/FormField';
import BouncyCheckbox from "react-native-bouncy-checkbox";

const UserCard = ({ user }) => {
    return <View style={{
        margin: 5,
        borderWidth: 1,
        borderColor: '#EA6812',
        borderRadius: 10,
        padding: 10,
        opacity: user.enabled == 1 ? 1 : 0.3,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff'
    }}>
        <View style={{ flex: 2 }}>
            <Text>{user.name} {user.lastname}</Text>
            <Text>{user.email}</Text>
            <Text>{user.job_function}</Text>
        </View>
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

                        }} />)}
                    />
                    <View style={{ marginVertical: 10 }}>
                        <Text style={{
                            alignSelf: 'center',
                            width: '60%',
                            textAlign: 'center'
                        }}>
                            Nombre d'invitations restantes :
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
                                        <ActivityIndicator style={{marginVertical: 30, alignSelf: 'center'}}/>
                                        : <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
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
                style={{ width: '100%' }}

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
})
