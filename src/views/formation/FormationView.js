import React, { useEffect, useState } from 'react'
import {
    Text,
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native'
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getUserRegisteredFormation, getFormations, registerFormation } from '../../services/FormationService'
import AppModal from '../../component/AppModal';
import { PaymentFormationModal } from './modal/paymentModal/PaymentFormationModal';
import { useNavigation } from '@react-navigation/native';
import { LessonHeader } from './LessonHeader';
import { SponsoredFormationModal } from './modal/sponsoredModal/SponsoredFormationModal';
import { getCurrentUser } from '../../services/UserService';

const RunningFormationCard = ({ params, onPaymentRequest, onSponsoredRequest, isStudent }) => {
    const startDate = new Date(params.start_date_theorical).toLocaleDateString()
    const endDate = new Date(params.end_date_theorical).toLocaleDateString()
    const navigation = useNavigation()
    const isCertifying = params.certifying
    const isPaid = params.is_paid
    const isDemo = !params.certifying && !params.is_paid && isStudent == false


    const getMode = () => {
        if (isDemo) {
            return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Mode démo</Text>
        } else {
            if (isCertifying) {
                return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Dossier pris en charge</Text>
            }
            if (isPaid) {
                return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Acheté</Text>
            }
            if (isStudent) {
                return <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Etudiant</Text>
            }
        }
    }


    return <View style={{ alignItems: 'center' }}>
        {getMode()}

        <View>
            <Text>progress : {params.progress_rate}</Text>
            <Text>time : {params.time_spent}</Text>
        </View>

        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => {
                navigation.navigate("formation-modules", {
                    userFormationId: params.id,
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
            (isDemo && isStudent == false) &&
            <View style={{
                flexDirection: 'row'
            }}>
                <View style={{ flex: 1 }}>
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
                </View>

                <Text style={[cardStyle.textStyle, { fontWeight: "bold" }]}>ou</Text>

                <View style={{ flex: 1 }}>

                    <Text style={cardStyle.textStyle}>J'engage un dossier de formation continue</Text>
                    <TouchableOpacity style={cardStyle.buttonStyle}
                        onPress={() => { onSponsoredRequest(params) }}>
                        <Text style={{
                            color: '#FFF',
                            fontWeight: 'bold'
                        }}>
                            Faire une demande
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        }
    </View>
}

const CatalogFormationCard = ({ params, onPaymentRequest, onSponsoredRequest, isStudent }) => {

    const navigation = useNavigation()
    const queryClient = useQueryClient()
    const startFormation = useMutation(registerFormation, {
        onSuccess: data => {
            queryClient.invalidateQueries(["formations", "user"])
            navigation.navigate("formation-modules", {
                userFormationId: params.id,
                demoMode: isStudent ? false : true
            })
        }
    })

    return <View style={{ alignItems: 'center' }}>
        {
            isStudent == false &&
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
                    onPress={() => { onSponsoredRequest(params) }}>
                    <Text style={{
                        color: '#FFF',
                        fontWeight: 'bold'
                    }}>
                        Faire une demande
                    </Text>
                </TouchableOpacity>
            </View>
        }
        <TouchableOpacity style={cardStyle.buttonStyle}
            onPress={() => {
                startFormation.mutate({
                    id_formation: params.id_formation,
                    formation_name: params.formation_name
                })
            }}>
            <Text style={{
                color: '#FFF',
                fontWeight: 'bold'
            }}>
                {isStudent == true ? "Accès" : "Accès démo"}
            </Text>
        </TouchableOpacity>
    </View>
}


const FormationCard = ({ formation, onPaymentRequest, onSponsoredRequest, registered, isStudent }) => {

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
                <RunningFormationCard params={formation}
                    onPaymentRequest={(formation) => onPaymentRequest(formation)}
                    onSponsoredRequest={(formation) => onSponsoredRequest(formation)}
                    isStudent={isStudent}
                />
                : <CatalogFormationCard params={formation}
                    onPaymentRequest={(formation) => onPaymentRequest(formation)}
                    onSponsoredRequest={(formation) => onSponsoredRequest(formation)}
                    isStudent={isStudent}
                />
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
    const [activateSponsoredDemand, setActivateSponsoredDemand] = useState({ isActivate: false, formation: null })
    const [isStudent, setIsStudent] = useState(false)
    const [formationCatalog, setFormationCatalog] = useState([])
    useQuery("current-user", () => getCurrentUser(), {
        onSuccess: user => { setIsStudent(user.is_student) }
    })
    const {
        isLoading: loadingFormation,
        data: formations
    } = useQuery(["formations"], () => getFormations())
    const {
        isLoading: loadingUserFormations,
        data: userFormations
    } = useQuery(["user-formations"], () => getUserRegisteredFormation({}))
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient()

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            queryClient.invalidateQueries("user-formations")
        }, 2000);
    }, []);

    useEffect(() => {
        if (userFormations && formations) {
            let catalogue = []
            userFormations.forEach(f => {
                if (f.progress_rate == 0)
                    catalogue.push(f)
            });
            formations.forEach(f => {
                if (userFormations.find(uf => (uf.id_formation == f.id_formation)))
                    return
                else
                    catalogue.push(f)
            });
            setFormationCatalog(catalogue)
        }
    }, [userFormations, formations])


    return <View style={styles.container}>
        <LessonHeader
            searchEnabled={false}
            title={"Se former"}
            navigation={navigation}
        />
        <ScrollView refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

            <View style={styles.sectionContainer}>
                <Text style={styles.textSection}>En cours</Text>
                {
                    loadingUserFormations &&
                    <ActivityIndicator color={"#ffaf31"} size={"small"} />
                }
                {
                    userFormations?.map((value, index) => {
                        console.log(value.progress_rate);
                        
                        if (parseInt(value.progress_rate) > 0)
                            console.log('Found : ', value);
                            
                            return <FormationCard
                                formation={value}
                                key={index}
                                onPaymentRequest={(formation) => { setActivatePayment({ isActivate: true, formation: formation }) }}
                                onSponsoredRequest={(formation) => { setActivateSponsoredDemand({ isActivate: true, formation: formation }) }}
                                registered={true}
                                isStudent={isStudent}
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
                    formationCatalog?.map((value, index) => {
                        return <FormationCard
                            formation={value}
                            key={index}
                            onPaymentRequest={(formation) => { setActivatePayment({ isActivate: true, formation: formation }) }}
                            onSponsoredRequest={(formation) => { setActivateSponsoredDemand({ isActivate: true, formation: formation }) }}
                            registered={value.id_user ? true : false}
                            isStudent={isStudent}
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
                onClose={() => setActivatePayment({ isActivate: false, formation: null })}
            />}
            style={{
                height: '70%'
            }}
        />

        <AppModal
            isVisible={activateSponsoredDemand.isActivate}
            onClose={() => setActivateSponsoredDemand({ isActivate: false, formation: null })}
            customRender={<SponsoredFormationModal
                formation={{
                    name: activateSponsoredDemand?.formation?.formation_name,
                    idFormation: activateSponsoredDemand?.formation?.id_formation,
                    price: formations?.filter(elem => elem.id_formation == activateSponsoredDemand?.formation?.id_formation)[0]?.price
                }}
                onClose={() => setActivateSponsoredDemand({ isActivate: false, formation: null })}
            />}
            style={{
                height: '70%',
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