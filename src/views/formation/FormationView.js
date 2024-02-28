import React, { useEffect, useState } from 'react'
import { Text, View, Pressable, StyleSheet, Linking, Image, TouchableOpacity } from 'react-native'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import {
    CopilotStep,
    walkthroughable,
    useCopilot
} from "react-native-copilot";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '@react-navigation/native'

import { ModuleLayout } from './ModuleLayout'
import { MenuLayout } from './menu/MenuLayout'
import LaboFormationView from './labo/LaboFormationView'
import AppModal from '../../component/AppModal'

const FORMATION_TYPE_MODULE = 'formation-module'
const FORMATION_TYPE_MENU = 'formation-menu'

const CopilotText = walkthroughable(Text);


const FormationTypeNav = ({ displayView, navigation }) => {
    const [selected, setselected] = useState('lesson')
    const copilot = useCopilot()

    return <View style={styles.formationTypeNavContainer}>
        <Pressable
            style={[
                styles.formationTypeNavButton,
                {
                    backgroundColor: selected == 'lesson' ? '#ffffff' : '#20113A'
                }
            ]}
            onPress={() => {
                // copilot.start()
                displayView(FORMATION_TYPE_MODULE)
                setselected('lesson')
                navigation.setParams({ title: 'Se former' })
            }}>
            <Text
                style={[styles.formationTypeNavText, { color: selected == 'lesson' ? '#20113A' : '#ffffff' }]}>
                Parcours
            </Text>
        </Pressable>
        <Pressable
            style={[styles.formationTypeNavButton, { backgroundColor: selected == 'menu' ? '#ffffff' : '#20113A' }]}
            onPress={() => {
                displayView(FORMATION_TYPE_MENU)
                setselected('menu')
            }}>
            <CopilotStep text='la step 3 sur une autre page' order={1} name='formation'>
                <CopilotText style={[styles.formationTypeNavText, { color: selected == 'menu' ? '#20113A' : '#ffffff' }]}>
                    A la carte</CopilotText>
            </CopilotStep>
            {/* <Text
                style={[styles.formationTypeNavText, { color: selected == 'menu' ? '#20113A' : '#ffffff' }]}>
                A la carte
            </Text> */}
        </Pressable>
    </View>
}


const FormationTypeDisplay = ({ type, navigation, route }) => {
    if (type == FORMATION_TYPE_MODULE) {
        return <ModuleLayout navigation={navigation} route={route} />
    } else {
        return <MenuLayout navigation={navigation} route={route} />
    }
}

export const FormationView = ({ navigation, route }) => {
    const [formationType, setformationType] = useState(FORMATION_TYPE_MODULE)
    const { isLabo } = useTheme()
    const [showCertifInfosModal, setshowCertifInfosModal] = useState(false)
    const [disableModal, setDisableModal] = useState(false)


    useEffect(() => {
        const displayCertifModal = async () => {
            const visitOnce = await AsyncStorage.getItem('certif')

            if (JSON.parse(visitOnce) == true) {
                return
            }
            setshowCertifInfosModal(true)
        }
        displayCertifModal()
    }, [])


    if (isLabo == false) {
        return <View style={styles.container}>
            <FormationTypeDisplay type={formationType} navigation={navigation} route={route} />

            <FormationTypeNav displayView={(view) => { setformationType(view) }}
                navigation={navigation}
            />
            <AppModal
                isVisible={showCertifInfosModal}
                onClose={() => {
                    if (disableModal === true) {
                        AsyncStorage.setItem("certif", JSON.stringify(true), (error) => {
                            if (error)
                                throw error
                        })
                    }
                    setshowCertifInfosModal(false)
                }}
                style={{ width: '90%' }}
                customRender={<View style={{
                    display: 'flex',
                    paddingHorizontal: 10,
                    width: '100%'
                }}
                >
                    <Text style={{ fontSize: 18, fontWeight: 'bold', alignSelf: 'center' }}>Le savez-vous ?</Text>
                    <Text style={{ marginTop: 10, }}>Vous pouvez suivre ce parcours pédagogique et obtenir un certificat de formation DPC.</Text>

                    <Image
                        source={require('../../../assets/formation/logo-dpc.png')}
                        style={{
                            height: 70,
                            resizeMode: 'contain',
                            marginVertical: 20,
                            alignSelf: 'center'
                        }}
                    />
                    <Text style={{ fontSize: 13, alignSelf: 'center', textAlign: 'center' }}>Il en va de même pour chaque membre de votre équipe.</Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', marginVertical: 10 }}>Inscrivez-vous dès maintenant !</Text>
                    <Text style={{}}>C'est simple, <Text style={{ textDecorationLine: 'underline' }}>gratuit</Text> et nous vous accompagnons dans les démarches d'inscription / validation.</Text>

                    <TouchableOpacity style={{
                        backgroundColor: "#EB7B10",
                        padding: 10,
                        borderRadius: 5,
                        width: "30%",
                        alignSelf: 'center',
                        alignItems: 'center',
                        marginTop: 20
                    }}
                        onPress={() => {
                            Linking.openURL("https://orthomaster.fr/parcour-certifiant")
                        }}
                    >
                        <Text style={{
                            color: '#fff',
                            textAlign: 'center',
                        }}>En savoir +</Text>
                    </TouchableOpacity>


                    <BouncyCheckbox
                        onPress={isChecked => { setDisableModal(isChecked) }}
                        text='ne plus me montrer ce message pour le moment'
                        size={15}
                        fillColor="#EB7B10"
                        unfillColor="#FFFFFF"
                        textStyle={{
                            color: '#000',
                            fontSize: 12,
                            textDecorationLine: "none"
                        }}
                        style={{
                            alignSelf: 'center',
                            marginTop: 20
                        }}
                    />
                </View>}
            />
        </View>
    } else {
        return <LaboFormationView navigation={navigation} />
    }
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fffefd'
    },
    formationTypeNavContainer: {
        backgroundColor: '#1F113A',
        borderRadius: 40,
        width: '50%',
        height: 42,
        padding: 4,
        marginBottom: 15,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        top: '92%'
    },
    formationTypeNavButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: 40
    },
    formationTypeNavText: {
        fontWeight: '600'
    }
})