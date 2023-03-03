import React, { useState } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuthMessage } from '../../reducers/auth';
import { useMutation } from 'react-query';
import { activateUser, resetUserPassword } from '../../services/UserService';


import { login } from '../../actions/auth';

export const LoginView = ({ navigation }) => {
    const [verifyingUsername, setVerifyingUsername] = useState(true)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayAccountActivation, setDisplayAccountActivation] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const authMessage = useSelector(selectAuthMessage)
    const dispatch = useDispatch()
    const generatePassword = useMutation(resetUserPassword, {
        onSuccess: (data) => {
            setDisplayAccountActivation(false)
            Alert.alert('Activation du compte', data.data)
        }
    })
    const userActivation = useMutation(activateUser, {
        onError: (error) => {
            throw error
        },
        onSuccess: (status) => {
            switch (status) {
                case 1:
                    setVerifyingUsername(false)
                    break;
                case 2:
                    setDisplayAccountActivation(true)
                    generatePassword.mutate(username)
                    break;
                case 3:
                    setStatusMessage("Nom d'utilisateur introuvable")
                    break;
                case 4:
                    setStatusMessage("Compte désactivé")
                    break;
                default:
                    setStatusMessage('')
                    break;
            }
        }
    })

    const handleClick = () => {
        setStatusMessage('')
        if (verifyingUsername) {
            userActivation.mutate(username)
        } else {
            dispatch(login(username, password))
        }

    }

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.logo}>
                <Image
                    style={{
                        width: 300,
                        height: 200,
                        resizeMode: 'contain'
                    }}
                    source={require('../../../assets/logo-text.png')}
                />
            </View>
            <View style={styles.connectionBox}>
                <Text style={styles.title}>Connexion</Text>
                <TextInput
                    style={styles.intputField}
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize={'none'}
                />


                {
                    displayAccountActivation &&
                    <View style={{ alignItems: 'center' }}>
                        <Text>Nous activons votre compte...</Text>
                        <Text>L'activation peut prendre quelques minutes.</Text>
                    </View>
                }

                {
                    !verifyingUsername &&
                    <TextInput
                        style={[styles.intputField]}
                        placeholder="Mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                }



                <Text style={styles.authText}>{authMessage}</Text>
                <Text style={styles.authText}>{statusMessage}</Text>
                <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => handleClick()}
                >
                    <Text style={styles.signInButtonText}>Continuer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.push("auth-reset-password")
                    }}
                >
                    <Text style={{ color: '#EA6910', fontSize: 18 }}>Mot de passe oublié</Text>
                </TouchableOpacity>
                {
                    !verifyingUsername
                    && <TouchableOpacity
                        style={{ marginTop: 10, alignItems: 'center'}}
                        onPress={() => {
                            setVerifyingUsername(true)
                        }}
                    >
                            <Text style={{marginTop: 10, }}>Vous n'avez pas de mot de passe ?</Text>
                            <Text style={{color: '#EA6910'}}>Activer votre compte</Text>
                    </TouchableOpacity>
                }

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F1F1F1',
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        flex: 1,
        justifyContent: 'center',
        flexGrow: 1
    },
    connectionBox: {
        backgroundColor: '#FFFEFD',
        width: '95%',
        borderRadius: 24,
        alignItems: 'center',
        paddingVertical: 35,
        flex: 1,
        flexGrow: 2
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 32,
        color: '#1B1C1E'
    },
    intputField: {
        borderWidth: 1,
        borderColor: '#BEBEBE',
        width: '90%',
        height: 60,
        borderRadius: 12,
        paddingLeft: 16,
        marginVertical: 5
    },
    signInButton: {
        width: '90%',
        height: 60,
        backgroundColor: "#EA6911",
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginTop: 5,
        marginBottom: 30
    },
    signInButtonText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#fffefd'
    },
    forgetButton: {
        marginBottom: 50
    },
    authText: {
        color: '#E45204',
        paddingVertical: 20
    }
})
