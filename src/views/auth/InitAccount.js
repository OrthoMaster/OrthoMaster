import React, { useState, memo } from "react";
import { useMutation } from "react-query";
import AuthService from "../../services/AuthService";
import { FormField } from "../../component/FormField";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";

export const ActivateAccountView = ({ route, navigation }) => {
    const { user_id, token } = route.params
    const [errorMsg, setErrorMsg] = useState("")
    const activateAccount = useMutation(AuthService.activateUser, {
        onError: (err) => {
            if (err.response.data.message == `User with ${credentials.username} as username already exist.`) {
                setErrorMsg("Nom d'utilisateur déjà utilisé")
                return
            }
            setErrorMsg("Une erreur s'est produite, veuillez réessayer", )
        },
        onSuccess: () => {
            navigation.navigate('auth-home', {message: "Félicitation !\nVotre compte à bien était activé !"})
        }
    })
    const [credentials, setCredentials] = useState({})

    const handleForm = (data) => {
        setCredentials({
            ...credentials,
            [data.value]: data.text
        })
    }

    return <SafeAreaView style={{ backgroundColor: '#fff', flex: 1}}>
        <View >
        <Text>Activez votre compte</Text>
            <FormField name={"Nom d'utilisateur"} value={"username"} onChange={handleForm} type={'text'} required />
            <FormField name={"Mot de passe"} value={"password"} onChange={handleForm} type={'text'} required password/>
            <FormField name={"Confirmez votre mot de passe"} value={"confirm_password"} onChange={handleForm} type={'text'} required password />

        {
            errorMsg?.length > 0 &&
            <Text>{errorMsg}</Text>
        }

        <TouchableOpacity onPress={() => {
            if (credentials.password != credentials.confirm_password) {
                setErrorMsg("La confirmation doit être identique au mot de passe")
            } else {
                setErrorMsg("")
                if (user_id && token) {
                    activateAccount.mutate({
                        username: credentials.username,
                        password: credentials.password,
                        user_id: user_id,
                        token: token
                    })
                }
            }
        }}>
            <Text>Valider</Text>
        </TouchableOpacity>
            </View>
    </SafeAreaView>

}


export const CreateAccountView = ({ route, navigation }) => {
    const { token } = route.params
    const createAccount = useMutation(AuthService.createUser)
    const [credentials, setCredentials] = useState({})
    const [isError, setIsError] = useState(false)

    const handleForm = (data) => {
        setCredentials({
            ...credentials,
            [data.value]: data.text
        })
    }

    return <SafeAreaView>
        <Text>Activez votre compte</Text>
        <FormField name={"Nom d'utilisateur"} value={"username"} onChange={handleForm} />
        <FormField name={"Mot de passe"} value={"password"} onChange={handleForm} />
        <FormField name={"Confirmez votre mot de passe"} value={"confirm-password"} onChange={handleForm} />

        <TouchableOpacity onPress={() => {
            console.log('id', user_id);
            console.log('link', link);
            if (user_id && link) {
                activateAccount.mutate({
                    username: credentials.username,
                    password: credentials.password,
                    user_id: user_id,
                    link: link
                })
            }
        }}>
            <Text>Valider</Text>
        </TouchableOpacity>
    </SafeAreaView>
    return <Text>Create Account</Text>
}

export default memo(ActivateAccountView)