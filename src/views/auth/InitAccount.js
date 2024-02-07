import React, { useState, memo } from "react";
import { useMutation, useQuery } from "react-query";
import AuthService from "../../services/AuthService";
import { FormField } from "../../component/FormField";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Dimensions } from "react-native";

export const ActivateAccountView = ({ route, navigation }) => {
    const { user_id, token } = route.params
    const [errorMsg, setErrorMsg] = useState("")
    const activateAccount = useMutation(AuthService.activateUser, {
        onError: (err) => {
            setErrorMsg(err.response.data.message)
        },
        onSuccess: () => {
            navigation.navigate('auth-home', { message: "Félicitation !\nVotre compte a bien été activé !" })
        }
    })
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
        confirm_password: ""
    })

    const handleForm = (data) => {
        setCredentials({
            ...credentials,
            [data.value]: data.text
        })
    }

    return <SafeAreaView style={{ backgroundColor: '#fff', flex: 1 }}>
        <View >
            <Text style={{
                fontSize: 26,
                fontWeight: 'bold',
                alignSelf: 'center',
                paddingVertical: 30
            }}>Activez votre compte</Text>
            <FormField name={"Nom d'utilisateur"} value={"username"} onChange={handleForm} type={'text'} required />
            <FormField name={"Mot de passe"} value={"password"} onChange={handleForm} type={'text'} required password />
            <FormField name={"Confirmez votre mot de passe"} value={"confirm_password"} onChange={handleForm} type={'text'} required password />

            {
                errorMsg?.length > 0 &&
                <Text>{errorMsg}</Text>
            }

            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() => {
                    if (user_id && token && credentials.username?.trim().length > 0 && credentials.password?.trim().length > 0) {
                        if (credentials.password == credentials.confirm_password) {
                            setErrorMsg("")
                            activateAccount.mutate({
                                username: credentials.username,
                                password: credentials.password,
                                user_id: user_id,
                                token: token
                            })
                        } else {
                            setErrorMsg("La confirmation doit être identique au mot de passe")
                        }
                    } else {
                        setErrorMsg('Tout les champs doivent être remplis')

                    }
                }}>
                <Text style={{ color: "#fff" }}>Valider</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>

}



const styles = StyleSheet.create({
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
        marginVertical: 30,
        alignSelf: 'center'
    },
})

export default memo(ActivateAccountView)