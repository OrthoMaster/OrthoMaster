import React, { useState } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuthMessage } from '../../reducers/auth';
import { Ionicons } from '@expo/vector-icons';

import { login } from '../../actions/auth';


export const LoginView = ({ navigation, route }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('')
    const authMessage = useSelector(selectAuthMessage)
    const dispatch = useDispatch()
    const [showPassword, setShowPassword] = useState(false)


    const handleClick = () => {
        dispatch(login(username, password))

    }

    return (
        <SafeAreaView style={[styles.container]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { width: '100%' }]}
            >
                <TouchableWithoutFeedback
                    style={{ width: '100%', height: '100%' }}
                    onPress={() => { Keyboard.dismiss() }}>
                    <View style={{
                        height: "100%", width: "100%",
                        alignItems: 'center'
                    }}>


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
                                style={[styles.intputField]}
                                placeholder="Nom d'utilisateur"
                                value={username}
                                onChangeText={setUsername}
                                textContentType="username"
                                autoCapitalize={'none'}
                                autoComplete='username'

                            />

                            <View style={styles.intputField}>
                                <TextInput
                                    style={{ flex: 1 }}
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                    autoComplete='password'
                                    autoCapitalize={'none'}
                                />
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={24} color="#aaa"
                                    onPress={() => setShowPassword(!showPassword)}
                                />

                            </View>

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

                            <TouchableOpacity
                                style={{ marginTop: 10 }}
                                onPress={() => {
                                    navigation.push("auth-forgot-username")
                                }}
                            >
                                <Text style={{ color: '#EA6910', fontSize: 18 }}>Nom d'utilisateur oublié</Text>
                            </TouchableOpacity>

                        </View>
                    </View>

                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
        paddingVertical: 15,
        flex: 1,
        flexGrow: 3
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 25,
        color: '#1B1C1E'
    },
    intputField: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f3f3f3',
        height: 50,
        width: '80%',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginVertical: 5
    },
    signInButton: {
        width: '90%',
        height: 60,
        backgroundColor: "#FFAF31",
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 30
    },
    signInButtonText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#FFF',
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
