import React, { useState } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuthMessage } from '../../reducers/auth';


import { login } from '../../actions/auth';

export const LoginView = ({ navigation, route }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('')
    const authMessage = useSelector(selectAuthMessage)
    const dispatch = useDispatch()


    const handleClick = () => {
        dispatch(login(username, password))

    }

    return (
        <SafeAreaView style={styles.container}>
            <Text>{process.env.EXPO_PUBLIC_API_URL}</Text>
                <View style={styles.logo}>
                    <Image
                        style={{
                            width: Dimensions.get('screen').width * 0.7,
                            resizeMode: 'contain',
                        }}
                        source={require('../../../assets/logo-text.png')}
                    />
                </View>
                <View style={styles.connectionBox}>
                    <Text style={styles.redirectMessage}>{route.params?.message}</Text>
                    <Text style={styles.title}>Connexion</Text>
                    <TextInput
                        style={styles.intputField}
                        placeholder="Nom d'utilisateur"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize={'none'}
                    />

                    <TextInput
                        style={[styles.intputField]}
                        placeholder="Mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize={'none'}
                    />


                    {
                        authMessage?.length > 0 &&
                        <Text style={styles.authText}>{authMessage}</Text>
                    }
                    {
                        statusMessage?.length > 0 &&
                        <Text style={styles.authText}>{statusMessage}</Text>
                    }
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
        flexGrow: 3
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
        marginTop: 20,
        marginBottom: 30
    },
    signInButtonText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#fffefd',
    },
    forgetButton: {
        marginBottom: 50
    },
    authText: {
        color: '#E45204',
        paddingVertical: 20
    },
    redirectMessage: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '400',
        marginBottom: 10
    }
})
