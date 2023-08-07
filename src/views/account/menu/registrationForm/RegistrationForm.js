import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { FormField } from "../../../../component/FormField";
import { useQuery } from "react-query";
import AuthService from "../../../../services/AuthService";
import { AntDesign } from '@expo/vector-icons';

export const RegistrationForm = ({ onSubmit }) => {
    const [formResult, setformResult] = useState({
        office: {
            name: "",
            structure: "",
            address: "",
            zip: "",
            city: "",
            state: "",
            email: "",
            tel: "",
            numero_adeli: "",
            numero_rpps: "",
            abonnement: ""
        },
        manager: {
            email: "",
            firstname: "",
            lastname: "",
            fonction: ""
        },
        collaboratorsArray: [],
        seller: {
            code: "",
            labo: ""
        }
    })

    const [addingUser, setAddingUser] = useState(false)
    const [newUser, setNewUser] = useState({})
    const [isError, setIsError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [dynamicDropdowns, setDynamicDropdowns] = useState({
        structure: [],
        country: [{ name: 'France', value: 'France' }, { name: 'Belgique', value: 'Belgique' }, { name: 'Suisse', value: 'Suisse' }],
        abonnement: [],
        fonctions: []
    })
    useQuery('getSubscriptions', AuthService.getFormSubscriptions, {
        onSuccess: (data) => {
            let subs = []
            if (Array.isArray(data.data)) {
                data.data.forEach((elem) => {
                    subs.push({ name: elem.properties.name, value: elem.properties.hs_sku })
                })
                setDynamicDropdowns({
                    ...dynamicDropdowns,
                    abonnement: subs
                })
            }
        }
    })

    useQuery('getJobFunction', () => AuthService.getFormProperties({ objectType: 'contact', property: 'job_function' }), {
        onSuccess: (data) => {
            let functions = []
            if (Array.isArray(data.data)) {
                data.data.forEach((elem) => {
                    functions.push({ name: elem.label, value: elem.value })
                })
                setDynamicDropdowns({
                    ...dynamicDropdowns,
                    fonctions: functions
                })
            }
        }
    })

    useQuery('getStructures', () => AuthService.getFormProperties({ objectType: 'company', property: 'structure' }), {
        onSuccess: (data) => {
            let structures = []
            if (Array.isArray(data.data)) {
                data.data.forEach((elem) => {
                    structures.push({ name: elem.label, value: elem.value })
                })
                setDynamicDropdowns({
                    ...dynamicDropdowns,
                    structure: structures
                })
            }
        }
    })

    const checkForm = async () => {
        const { office, manager } = formResult
        if (
            (office.name.trim().length == 0 ||
                office.structure.trim().length == 0 ||
                office.address.trim().length == 0 ||
                office.zip.trim().length == 0 ||
                office.city.trim().length == 0 ||
                office.state.trim().length == 0 ||
                office.email.trim().length == 0 ||
                office.abonnement.trim().length == 0 ||
                manager.firstname.trim().length == 0 ||
                manager.lastname.trim().length == 0 ||
                manager.email.trim().length == 0 ||
                manager.fonction.trim().length == 0) ||
            (office.numero_adeli.trim().length == 0 && office.numero_rpps.trim().length == 0)
        ) {
            setIsError(true)
            setErrorMsg("Tout les champs du formulaire doivent être remplis")
            return false
        } else {
            setIsError(false)
            return true
        }
    }

    const handleForm = (data) => {
        if (data.target == "user") {
            setNewUser({
                ...newUser,
                [data.value]: data.text
            })
        } else {
            setformResult({
                ...formResult,
                [data.target]: {
                    ...formResult[data.target],
                    [data.value]: data.text
                }
            })
        }
    }

    return <ScrollView automaticallyAdjustKeyboardInsets={true}>
        <View style={{ width: '100%', backgroundColor: '#fff' }}>
            <Text style={styles.title}>Entreprise</Text>
            <FormField name={'Nom'} value={'name'} target={"office"} type={'text'} onChange={handleForm} required />
            <FormField name={'Structure'} value={'structure'} target={"office"} type={'dropdown'} data={dynamicDropdowns.structure} onChange={handleForm} required />
            <FormField name={'Adresse'} value={'address'} target={"office"} type={'text'} onChange={handleForm} required />
            <View style={{ flexDirection: 'row', width: '100%' }}>
                <FormField name={'CP'} value={'zip'} target={"office"} type={'text'} onChange={handleForm} required style={{ flex: 1 }} />
                <FormField name={'Ville'} value={'city'} target={"office"} type={'text'} onChange={handleForm} required style={{ flex: 1 }} />
            </View>
            <FormField name={'Pays'} value={'state'} target={"office"} type={'dropdown'} data={dynamicDropdowns.country} onChange={handleForm} required />


            <ProNumber onChange={handleForm}/>



            <FormField name={'Email'} value={'email'} target={"office"} type={'email'} onChange={handleForm} required />
            <FormField name={'Téléphone'} value={'tel'} target={"office"} type={'tel'} onChange={handleForm} />
            <FormField name={'Abonnement'} value={'abonnement'} target={"office"} type={'dropdown'} data={dynamicDropdowns.abonnement} onChange={handleForm} required />
            <View>
                <Text style={styles.title}>Contact principal</Text>
                <FormField name={'Nom'} value={'lastname'} target={"manager"} type={'text'} onChange={handleForm} required />
                <FormField name={'Prénom'} value={'firstname'} target={"manager"} type={'text'} onChange={handleForm} required />
                <FormField name={'Email'} value={'email'} target={"manager"} type={'email'} onChange={handleForm} required />
                <FormField name={'Fonction professionnel'} target={"manager"} value={'fonction'} data={dynamicDropdowns.fonctions} type={'dropdown'} onChange={handleForm} required />
            </View>
            <View>
                <Text style={styles.title}>Optionnel : <Text style={{ fontWeight: 'normal' }}>ajouter des utilisateurs</Text></Text>
                <Text style={styles.displayText}>(Jusqu'à 10, au delà sur demande par mail: question@orthomaster.fr)</Text>

                {
                    formResult.collaboratorsArray.map((value, index) => {
                        return <View key={index}
                            style={{
                                margin: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#EA6812',
                                borderRadius: 15,
                                padding: 10,
                            }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.labelStyle}>Prénom :</Text>
                                <Text style={styles.labelStyle}>Nom :</Text>
                                <Text style={styles.labelStyle}>Email :</Text>
                                <Text style={styles.labelStyle}>Fonction :</Text>
                            </View>
                            <View style={{ flex: 3 }}>
                                <Text style={{ paddingLeft: 10 }}>{value.firstname}</Text>
                                <Text style={{ paddingLeft: 10 }}>{value.lastname}</Text>
                                <Text style={{ paddingLeft: 10 }}>{value.email}</Text>
                                <Text style={{ paddingLeft: 10 }}>{value.fonction.toLowerCase().charAt(0).toUpperCase() + value.fonction.toLowerCase().slice(1)}</Text>
                            </View>
                            <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }}
                                onPress={() => {
                                    const newArray = formResult.collaboratorsArray
                                    newArray.splice(index, 1)
                                    setformResult({
                                        ...formResult,
                                        collaboratorsArray: newArray
                                    })
                                }}
                            >
                                <Text style={{ color: '#EA6812', fontWeight: 'bold' }}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    })
                }
                {
                    addingUser &&
                    <View>
                        <FormField name={'Nom'} value={'lastname'} target={"user"} type={'text'} onChange={handleForm} required />
                        <FormField name={'Prénom'} value={'firstname'} target={"user"} type={'text'} onChange={handleForm} required />
                        <FormField name={'Email'} value={'email'} target={"user"} type={'email'} onChange={handleForm} required />
                        <FormField name={'Fonction professionnel'} target={"user"} value={'fonction'} type={'dropdown'} data={dynamicDropdowns.fonctions} onChange={handleForm} required />
                    </View>
                }
                {
                    addingUser ?
                        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                            <TouchableOpacity style={[styles.buttonContainer, { alignSelf: 'center', backgroundColor: '#828282' }]} onPress={async () => {
                                setAddingUser(false)
                            }}>
                                <Text style={{ color: "#fff" }}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.buttonContainer, { alignSelf: 'center' }]} onPress={async () => {
                                setformResult({
                                    ...formResult,
                                    collaboratorsArray: [...formResult.collaboratorsArray, newUser]
                                })
                                setAddingUser(false)
                                setNewUser({})
                            }}>
                                <Text style={{ color: "#fff" }}>Valider</Text>
                            </TouchableOpacity>
                        </View>
                        : <TouchableOpacity
                            style={{
                                alignSelf: 'center',
                            }}
                            onPress={() => {
                                setAddingUser(true)
                            }}>
                            <AntDesign name="pluscircle" size={50} color="#E75A06" />
                        </TouchableOpacity>
                }

            </View>


            {
                isError &&
                <Text>{errorMsg}</Text>
            }

            <TouchableOpacity style={[styles.buttonContainer, { alignSelf: 'center' }]} onPress={async () => {

                const isSubmitable = await checkForm()
                if (isSubmitable)
                    onSubmit(formResult)
            }}>
                <Text style={{ color: "#fff" }}>Valider</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
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
        marginVertical: 30
    },
    title: {
        color: '#EA6912',
        alignSelf: 'center',
        fontWeight: 'bold',
        fontSize: 22,
        marginTop: 20,
        marginBottom: 10
    },
    displayText: {
        fontSize: 16,
        textAlign: 'center',
        alignSelf: 'center',
        marginVertical: 5
    },
    labelStyle: {
        fontWeight: 'bold'
    }
})


const ProNumber = (props) => {
    const [proNum, setProNum] = useState('')
    // <FormField name={'n° RPPS'} value={'numero_rpps'} target={"office"} type={'text'} onChange={handleForm} />
    //         <Text>OU</Text>
    //         <FormField name={'n° ADELI'} value={'numero_adeli'} target={"office"} type={'text'} onChange={handleForm} />

    return <View  style={{
        paddingVertical: 20
    }}>
        <Text style={{
            fontSize: 15,
            marginBottom: 10
        }}>Numéro professionnel *</Text>
        <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center' }}>
            <Text>N° RPPS :</Text>
            <TouchableOpacity
            onPress={() => {
                setProNum('numero_rpps')
            }}
            style={{
                marginHorizontal: 10
            }}
            >
                <View style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderRadius: 50,
                    backgroundColor: proNum == 'numero_rpps' ? '#EA6812' : "#fff"
                }} />
            </TouchableOpacity>
            <Text>N° ADELI :</Text>
            <TouchableOpacity
            onPress={() => {
                setProNum('numero_adeli')
            }}
            style={{
                marginHorizontal: 10
            }}
            >
                <View style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderRadius: 50,
                    backgroundColor: proNum == 'numero_adeli' ? '#EA6812' : "#fff"
                }} />
            </TouchableOpacity>

        </View>
        <FormField type={'text'} name="N°" target={"office"} onChange={(data) => {
            let change = data
            change.value = proNum
            props.onChange(change)
        }} isActive={proNum == '' ? false : true} required/>
    </View>
}