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
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Linking,
    ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../../hooks/useLogin.hook';


export const LoginView = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const login = useLogin()


    const handleClick = () => {
        login.mutate({ email: email, password: password })
    }

    return (
        <SafeAreaView style={[styles.container]}>
            <ScrollView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[{ width: '100%' }]}
                automaticallyAdjustKeyboardInsets={true}
                keyboardDismissMode='on-drag'
                keyboardShouldPersistTaps='never'
                contentContainerStyle={{ height: '100%' }}
            >
                <View style={{
                    width: "100%", flex: 1,
                    alignItems: 'center'
                }}>


                    <View style={styles.logoContainer}>
                        <Image
                            style={{
                                width: '80%',
                                height: "100%",
                                resizeMode: 'contain',
                            }}
                            source={require('../../../assets/logo-text.png')}
                        />
                    </View>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.connectionBox}>
                            <Text style={styles.title}>Connexion</Text>

                            <TextInput
                                style={[styles.intputField]}
                                placeholder="Adresse e-mail"
                                value={email}
                                onChangeText={setEmail}
                                textContentType="email"
                                autoCapitalize={'none'}
                                autoComplete='email'
                                placeholderTextColor={"gray"}
                            />

                            <View style={styles.intputField}>
                                <TextInput
                                    style={{ flex: 1, color: '#000' }}
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                    autoComplete='password'
                                    autoCapitalize={'none'}
                                    onBlur={()=> Keyboard.dismiss()
                                    }
                                    placeholderTextColor={"gray"}
                                />
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={24} color="#aaa"
                                    onPress={() => setShowPassword(!showPassword)}
                                />

                            </View>

                            {
                                login.isError &&
                                <Text style={styles.authText}>{login.error.response.data.message}</Text>
                            }
                            {
                                statusMessage?.length > 0 &&
                                <Text style={styles.authText}>{statusMessage}</Text>
                            }
                            <TouchableOpacity
                                style={styles.signInButton}
                                onPress={handleClick}
                            >
                                <Text style={styles.signInButtonText}>Continuer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    Linking.openURL("https://espace.orthomaster.fr/web/reset_password")
                                }}
                            >
                                <Text style={{ color: '#ffaf31', fontSize: 18 }}>Mot de passe oublié</Text>
                            </TouchableOpacity>

                            <View style={{
                                alignItems: 'center',
                                marginVertical: 20
                            }}>
                                <Text>Pas encore de compte ?</Text>
                                <Text
                                    onPress={() => { Linking.openURL("https://espace.orthomaster.fr/inscription") }}
                                    style={{
                                        color: '#ffaf31',
                                        fontWeight: 'bold',
                                        textDecorationLine: 'underline'
                                    }}>
                                    Inscrivez-vous
                                </Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F1F1F1',
        flex: 1,
        alignItems: 'center'
    },
    logoContainer: {
        height: "30%",
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    connectionBox: {
        backgroundColor: '#FFFEFD',
        width: '95%',
        borderRadius: 24,
        alignItems: 'center',
        paddingVertical: 20,
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
