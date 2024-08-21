import React, { useEffect, useState } from 'react'
import { Text, View, Pressable, StyleSheet, Linking, Image, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Dimensions, ScrollView } from 'react-native'
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getUserRegisteredFormation, getFormations, registerFormation } from '../../services/FormationService'
import AppModal from '../../component/AppModal';
import { PaymentFormationModal } from './modal/paymentModal/PaymentFormationModal';
import { useOrthoMasterRoles } from '../../hooks/useOrthoMasterRoles';
import { useNavigation } from '@react-navigation/native';
import { LessonHeader } from './LessonHeader';

const RegisteredFormationCard = ({ params, onPaymentRequest }) => {
    const startDate = new Date(params.start_date_theorical).toLocaleDateString()
    const endDate = new Date(params.end_date_theorical).toLocaleDateString()
    const navigation = useNavigation()
    const isCertifying = params.certifying
    const isPaid = params.is_paid
    const isDemo = !params.certifying && !params.is_paid

    const getMode = () => {
        if (isDemo) {
            return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Mode démo</Text>
        } else {
            if (isCertifying) {
                return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Dossier pris en charge</Text>
            } else {
                if (isPaid) {
                    return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Acheté</Text>
                }
            }
        }
    }


    return <View style={{ alignItems: 'center' }}>
        {getMode()}


        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => {
                navigation.navigate("formation-modules", {
                    formation: params,
                    demoMode: isDemo
                })
            }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold',
            }}>
                Accéder
            </Text>
        </TouchableOpacity>
        {
            isDemo &&
            <View>
                <Text style={cardStyle.textStyle}> {params.price} € HT / utilisateur</Text>
                <TouchableOpacity style={cardStyle.buttonStyle}
                    onPress={() => { onPaymentRequest(params) }}>
                    <Text style={{
                        color: '#FFF',
                        fontWeight: 'bold'
                    }}>
                        Payer
                    </Text>
                </TouchableOpacity>

                <Text style={[cardStyle.textStyle, { fontWeight: "bold" }]}>ou</Text>
                <Text style={cardStyle.textStyle}>J'engage un dossier de formation continue</Text>
                <TouchableOpacity style={cardStyle.buttonStyle}
                    onPress={() => {
                        Linking.openURL("https://www.orthomaster.fr/parcour-certifiant")
                    }}>
                    <Text style={{
                        color: '#FFF',
                        fontWeight: 'bold'
                    }}>
                        Faire une demande
                    </Text>
                </TouchableOpacity>
            </View>
        }
    </View>
}

const UnregisteredFormationCard = ({ params, onPaymentRequest }) => {
    const navigation = useNavigation()
    const queryClient = useQueryClient()
    const registerDemo = useMutation(registerFormation, {
        onSuccess: data => {
            queryClient.invalidateQueries(["formations", "user"])
            navigation.navigate("formation-modules", {
                formation: params,
                demoMode: true
            })
        }
    })

    return <View style={{ alignItems: 'center' }}>
        <Text style={cardStyle.textStyle}> {params.price} € HT / utilisateur</Text>
        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => { onPaymentRequest(params) }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold'
            }}>
                Payer
            </Text>
        </TouchableOpacity>

        <Text style={[cardStyle.textStyle, { fontWeight: "bold" }]}>ou</Text>
        <Text style={cardStyle.textStyle}>J'engage un dossier de formation continue</Text>
        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => {
                Linking.openURL("https://www.orthomaster.fr/parcour-certifiant")
            }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold'
            }}>
                Faire une demande
            </Text>
        </TouchableOpacity>
        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => {
                registerDemo.mutate({
                    id_formation: params.id_formation,
                    formation_name: params.formation_name
                })

            }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold'
            }}>
                Accès démo
            </Text>
        </TouchableOpacity>

    </View>
}


const FormationCard = ({ formation, onPaymentRequest, registered }) => {

    return <View style={{
        backgroundColor: '#27927E',
        width: "90%",
        height: 200,
        alignSelf: 'center',
        marginVertical: 5,
        borderRadius: 15,
        padding: 10
    }}>
        <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/421/421368.png" }}
            style={{
                height: "100%", width: 150,
                objectFit: 'contain',
                alignSelf: 'flex-end',
                right: 20,
                position: 'absolute',
                opacity: 0.2
            }}
        />
        <Text style={[cardStyle.textStyle, { fontWeight: 'bold', fontSize: 18 }]}>{formation.formation_name}</Text>

        {
            registered ?
                <RegisteredFormationCard params={formation} onPaymentRequest={(formation) => onPaymentRequest(formation)} />
                : <UnregisteredFormationCard params={formation} onPaymentRequest={(formation) => onPaymentRequest(formation)} />
        }
        <TouchableOpacity style={{
            padding: 5,
            position: 'absolute',
            top: 5, right: 5
        }}>
            <Feather name="info" size={24} color="#fff" />
        </TouchableOpacity>
    </View>
}

export const FormationView = ({ navigation, route }) => {
    const [activatePayment, setActivatePayment] = useState({ isActivate: false, formation: null })
    const {
        isLoading: loadingFormation,
        data: formations
    } = useQuery(["formations"], () => getFormations())
    const {
        isLoading: loadingUserFormations,
        data: userFormations
    } = useQuery(["formations", "user"], () => getUserRegisteredFormation())

    return <View style={styles.container}>
        <LessonHeader
            searchEnabled={false}
            title={"Se former"}
            navigation={navigation}
        />
        <ScrollView>

            <View style={styles.sectionContainer}>
                <Text style={styles.textSection}>En cours</Text>
                {
                    loadingUserFormations &&
                    <ActivityIndicator color={"#ffaf31"} size={"small"} />
                }
                {
                    userFormations?.map((value, index) => {
                        return <FormationCard
                            formation={value}
                            key={index}
                            onPaymentRequest={(formation) => { setActivatePayment({ isActivate: true, formation: formation }) }}
                            registered={true}
                        />
                    })
                }
            </View>

            <View style={styles.container}>
                <Text style={styles.textSection}>Autres formations</Text>
                {
                    loadingFormation &&
                    <ActivityIndicator color={"#ffaf31"} size={"small"} />
                }
                {
                    formations?.map((value, index) => {
                        if (!userFormations.find(f => f.id_formation == value.id_formation))
                            return <FormationCard
                                formation={value}
                                key={index}
                                onPaymentRequest={(formation) => { setActivatePayment({ isActivate: true, formation: formation }) }}
                                registered={false}
                            />
                    })
                }
            </View>
        </ScrollView>

        <AppModal
            isVisible={activatePayment.isActivate}
            onClose={() => setActivatePayment({ isActivate: false, formation: null })}
            customRender={<PaymentFormationModal
                formation={{
                    name: activatePayment?.formation?.formation_name,
                    idFormation: activatePayment?.formation?.id_formation,
                    price: formations?.filter(elem => elem.id_formation == activatePayment?.formation?.id_formation)[0]?.price
                }}
            />}
            style={{
                height: '70%'
            }}
        />
    </View>
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#fffefd',
        display: 'flex',
        flex: 1

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
    },
    textSection: {
        fontSize: 20,
        color: "#AEAEAE",
        fontWeight: 'bold'
    },
    sectionContainer: {
        paddingVertical: 5
    }
})

const cardStyle = StyleSheet.create({
    textStyle: {
        color: "#fff"
    },
    buttonStyle: {
        backgroundColor: '#ffaf31',
        padding: 5,
        borderRadius: 5,
    }
})