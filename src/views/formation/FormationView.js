import React, { useEffect, useState } from 'react'
import { Text, View, Pressable, StyleSheet, Linking, Image, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Dimensions } from 'react-native'
import { Feather } from '@expo/vector-icons';
import { ModuleLayout } from './ModuleLayout'
import { useQuery } from 'react-query'
import { getUserRegisteredFormation, getFormations } from '../../services/FormationService'
import AppModal from '../../component/AppModal';
import { PaymentFormationModal } from './modal/PaymentFormationModal';
import { useOrthoMasterRoles } from '../../hooks/useOrthoMasterRoles';

const RegisteredFormationCard = ({ params }) => {
    const startDate = new Date(params.start_date_theorical).toLocaleDateString()
    const endDate = new Date(params.end_date_theorical).toLocaleDateString()

    // console.log(params);
    return <View style={{ alignItems: 'center' }}>
        {
            params.certifying &&
            <View>
                <Text>Formation certifiante</Text>
                <Text>Dates de formation : {startDate} {"->"} {endDate}</Text>
                <Text>Progression : {Math.round(params.progress_rate * 100)} %</Text>
            </View>
        }

        <TouchableOpacity style={{
            backgroundColor: '#ffaf31'
        }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold'
            }}>
                Commencer
            </Text>
        </TouchableOpacity>
    </View>
}

const UnregisteredFormationCard = ({ params, onPaymentRequest }) => {
    const roles = useOrthoMasterRoles()

    return <View style={{ alignItems: 'center' }}>
        <Text>{params.price} € HT / utilisateur</Text>
        {
            roles.isPrimaryManager ?
                <TouchableOpacity style={{
                    backgroundColor: '#ffaf31'
                }}
                    onPress={() => { onPaymentRequest(params) }}>
                    <Text style={{
                        color: '#FFF',
                        fontWeight: 'bold'
                    }}>
                        Payer
                    </Text>
                </TouchableOpacity>
                : <Text>Vous n'avez pas les droits. Contactez votre responsable.</Text>
        }

        <Text>ou</Text>
        <Text>J'engage un dossier de formation continue</Text>
        <Image
            source={require("../../../assets/formation/partner-certif.png")}
            style={{ height: 50, width: '90%', objectFit: 'contain' }}
        />
        <TouchableOpacity style={{
            backgroundColor: '#ffaf31',
        }}
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


const FormationCard = ({ formation, onPaymentRequest }) => {
    return <View style={{
        backgroundColor: 'red',
        width: "90%",
        height: 200,
        alignSelf: 'center',
        marginVertical: 5,
        borderRadius: 15,
        padding: 10
    }}>
        <Text>{formation.formation_name}</Text>

        {
            formation.status ?
                <RegisteredFormationCard params={formation} />
                : <UnregisteredFormationCard params={formation} onPaymentRequest={(formation) => onPaymentRequest(formation)} />
        }
        <TouchableOpacity style={{
            padding: 5,
            position: 'absolute',
            top: 5, right: 5
        }}>
            <Feather name="info" size={24} color="#ffaf31" />
        </TouchableOpacity>
    </View>
}

export const FormationView = ({ navigation, route }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [activatePayment, setActivatePayment] = useState({isActivate: false, formation: null})
    const [userFormations, setUserFormations] = useState([])
    const [userRegistredFormations, setUserRegistredFormations] = useState([])
    const [formations, setFormations] = useState([])
    useQuery(["GET", "formations"], () => getFormations(), {
        onSuccess: (data) => {
            setFormations(data)
        }
    })
    useQuery(["GET", "user formations"], () => getUserRegisteredFormation(), {
        onSuccess: (data) => {
            setUserRegistredFormations(data)
        }
    })


    useEffect(() => {
        if (Array.isArray(formations) && formations.length > 0 && userRegistredFormations) {
            let formationArray = []
            formations.forEach(formation => {
                const isUserRegistred = userRegistredFormations.find(elem => elem.id_formation == formation.id_formation)
                if (isUserRegistred) {
                    formationArray.push(isUserRegistred)
                } else {
                    formationArray.push(formation)
                }
            });
            setUserFormations(formationArray)
            setIsLoading(false)
        } else {
            setIsLoading(true)
        }
    }, [formations, userRegistredFormations])


    return <SafeAreaView style={styles.container}>

        {
            isLoading &&
            <ActivityIndicator color={"#ffaf31"} size={"large"} style={{
                position: 'absolute',
                top: Dimensions.get("window").height / 2
            }} />
        }
        <FlatList
            data={userFormations}
            renderItem={item => <FormationCard
                formation={item.item}
                key={item.index}
                onPaymentRequest={(formation) => { setActivatePayment({isActivate: true, formation: formation}) }}
            />
            }
            keyExtractor={(item, index) => index}
            style={{ backgroundColor: '#F1F1F1', width: '100%' }}
        />
        <AppModal
            isVisible={activatePayment.isActivate}
            onClose={() => setActivatePayment({isActivate: false, formation: null})}
            customRender={<PaymentFormationModal formation={activatePayment.formation}/>}
        />
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fffefd',

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