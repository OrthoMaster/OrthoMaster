import React, { useEffect, useState } from 'react'
import {
    Text,
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    FlatList
} from 'react-native'
import Feather from '@expo/vector-icons/Feather';
import { useQuery, useMutation, useQueryClient } from "react-query"
import { getUserRegisteredFormation, getFormations, registerFormation } from '../../services/FormationService'
import AppModal from '../../component/AppModal';
import { useNavigation } from '@react-navigation/native';
import { LessonHeader } from './LessonHeader';
import AntDesign from '@expo/vector-icons/AntDesign';

import GetFormationModal from './modal/GetFormationModal';
import MoreInfosModal from './modal/MoreInfosModal';
import { useGetUser } from '../../hooks/useGetUser.hook';
import { LoadingContent } from '../../component/LoadingContent';
import { getS3Image } from '../../services/S3Service';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const RunningFormationCard = ({ params, thumbnail_url }) => {

    const navigation = useNavigation()
    const queryClient = useQueryClient()
    const img = useQuery("formation-thumbnail-" + thumbnail_url, () => getS3Image(thumbnail_url))
    const register2Formation = useMutation(registerFormation, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(["user-formations"])
            queryClient.invalidateQueries(["formations"])
            
            navigation.push("formation-modules", {
                userFormationId: data.insertId,
                demoMode: false,
                headerTitle: params.formation_name
            })
        }
    })

    return <View style={{
        backgroundColor: '#DEE0F3',
        width: 250, height: 230,
        padding: 10
    }}>
        <View style={{
            width: '100%', height: '100%',
            alignItems: 'center',
            backgroundColor: '#203864',
            borderRadius: 5,
            shadowOffset: {
                width: 0,
                height: 5
            },
            shadowOpacity: 0.3,
            padding: 10,
            justifyContent: 'space-between'
        }}>

            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{params.formation_name}</Text>
            <TouchableOpacity
                style={{
                    width: "100%",
                    height: 120,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onPress={() => {
                    if (params.id)
                        navigation.push("formation-modules", {
                            userFormationId: params.id,
                            demoMode: false,
                            headerTitle: params.formation_name
                        })
                    else
                        register2Formation.mutateAsync({
                            id_formation: params.id_formation,
                            formation_name: params.formation_name
                        })
                }}>
                <Image
                    src={img.data}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    resizeMode='contain'
                />
                <AntDesign name="playcircleo" size={70} color="rgba(255,255,255,0.8)"
                    style={{
                        position: 'absolute',
                    }} />
            </TouchableOpacity>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                {
                    params.progress_rate >= 100 ?
                        <FontAwesome name="star" size={20} color="#B3AA4B" />
                        : <Feather name="check-circle" size={20} color={params.progress_rate < 60 ? "#ffaf31" : "#92D050"} />
                }
                <Text style={{ color: "#fff", marginHorizontal: 5 }}>
                    {params.progress_rate && params.progress_rate >= 100 ? "terminé" : (params.progress_rate ? Math.round(params.progress_rate) : "0") + " %"}
                </Text>
            </View>
        </View>
    </View>
}

const CatalogFormationCard = ({ params, onUnlockFormation, isStudent, thumbnail_url, onShowMore }) => {

    const navigation = useNavigation()
    const queryClient = useQueryClient()
    const startFormation = useMutation(registerFormation, {
        onSuccess: data => {
            queryClient.invalidateQueries({ queryKey: ["formations"] })

            navigation.push("formation-modules", {
                userFormationId: data.insertId,
                demoMode: isStudent || params.id_product_odoo === null ? false : true,
                headerTitle: params.formation_name
            })
        }
    })
    const img = useQuery("formation-thumbnail-" + thumbnail_url, () => getS3Image(thumbnail_url))



    return <View style={{
        backgroundColor: "#203864",
        width: "95%", height: 200,
        alignSelf: 'center',
        borderRadius: 5,
        margin: 15,
        shadowOffset: {
            height: 3
        },
        shadowOpacity: 0.3
    }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10, marginVertical: 10 }}>{params.formation_name}</Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#6E7DA6', paddingVertical: 3, paddingHorizontal: 5, height: 35 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }}><Text style={{ fontSize: 20 }}>⏱️</Text> {params.time_needed}</Text>
            </View>
            <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                <Text numberOfLines={2} style={{ color: '#fff', fontSize: 10, textAlign: 'center' }}><Text style={{ fontSize: 16 }}>👨‍⚕️</Text> {params.public}</Text>
            </View>
            <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                <Text numberOfLines={2} style={{ color: '#fff', fontSize: 10, textAlign: 'center' }}><Text style={{ fontSize: 16 }}>🎓</Text> {params.organism}</Text>
            </View>
        </View>
        <View style={{
            flexDirection: 'row', flex: 1, backgroundColor: '#fff'
        }}>
            <View style={{ flex: 1, height: "100%" }}>
                {
                    img.data == null ?
                        <View style={{ width: "95%", height: "100%", alignSelf: 'flex-end', backgroundColor: '#F1F1F1' }} />
                        :
                        <Image
                            src={img.data}
                            resizeMode='contain'
                            style={{
                                width: "95%", height: "100%",
                                alignSelf: 'flex-end'
                            }}
                        />
                }
            </View>
            <View style={{
                flex: 1,
                backgroundColor: '#fff',

                borderBottomRightRadius: 5
            }}>

                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                }}>
                    <TouchableOpacity style={[cardStyle.buttonStyle, { backgroundColor: '#92D050' }]}
                        onPress={() => {
                            if (params.id) {
                                navigation.push("formation-modules", {
                                    userFormationId: params.id,
                                    demoMode: isStudent || params.id_product_odoo === null ? false : true,
                                    headerTitle: params.formation_name
                                })
                            } else {
                                startFormation.mutate({
                                    id_formation: params.id_formation,
                                    formation_name: params.formation_name
                                })
                            }
                        }}>
                        <Text style={{
                            color: '#FFF',
                            fontWeight: 'bold',
                            fontSize: 12
                        }}>{(params.id_product_odoo && isStudent == false) ? "Démo" : "Commencer"}</Text>
                        <AntDesign name="playcircleo" size={18} color="#fff" style={{ paddingHorizontal: 5 }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[cardStyle.buttonStyle, { backgroundColor: '#8089D1' }]}
                        onPress={() => {
                            onShowMore()
                        }}>
                        <Text style={{
                            color: '#FFF',
                            fontWeight: 'bold',
                            fontSize: 12
                        }}>En savoir plus</Text>
                    </TouchableOpacity>
                    {
                        (params.id_product_odoo && isStudent == false) &&
                        <TouchableOpacity style={[cardStyle.buttonStyle, { backgroundColor: '#FFAB00' }]}
                            onPress={() => {
                                onUnlockFormation()
                            }}>
                            <Text style={{
                                color: '#FFF',
                                fontWeight: 'bold',
                                fontSize: 12
                            }}>
                                Obtenir
                            </Text>
                        </TouchableOpacity>
                    }
                </View>
            </View>
        </View>

    </View>
}


export const FormationView = ({ navigation, route }) => {
    const [refreshing, setRefreshing] = useState(false);

    const queryClient = useQueryClient()
    const { data: user } = useGetUser()
    const {
        data: formations
    } = useQuery(["formations"], () => getFormations())
    const {
        data: userFormations
    } = useQuery(["formations", "user-formation"], () => getUserRegisteredFormation({}))

    const [isLoading, setIsLoading] = useState(true)
    const [unlockFormationModal, setUnlockFormationModal] = useState({ isActivate: false, formation: null })
    const [showingMoreInfosModal, setShowingMoreInfosModal] = useState(false)
    const [runningFormations, setRunningFormations] = useState(null)
    const [catalogFormations, setCatalogFormations] = useState(null)

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            queryClient.invalidateQueries("formations")
        }, 2000);
    }, []);


    useEffect(() => {
        if (formations && userFormations) {
            const allUserFormations = userFormations.reduce((acc, f) => {
                const key = f.is_paid || f.certifying || user.is_student ? 'active_formations' : 'demo_formations';
                if (!acc[key]) acc[key] = [];
                acc[key].push(f);
                return acc;
            }, {});


            let newCatalogSelection = []

            formations.forEach(f => {
                const is_active = allUserFormations.active_formations?.find(af => af.id_formation === f.id_formation)
                const is_demo = allUserFormations.demo_formations?.find(df => df.id_formation === f.id_formation)

                if (is_demo) {
                    var formatedFormation = { ...f }

                    formatedFormation.id = is_demo.id;
                    formatedFormation.certifying = is_demo.certifying;
                    formatedFormation.is_paid = is_demo.is_paid;
                    formatedFormation.progress_rate = is_demo.progress_rate;
                    formatedFormation.time_spent = is_demo.time_spent;

                    newCatalogSelection.push(formatedFormation)
                } else {
                    if (!is_active)
                        newCatalogSelection.push(f)
                }
            });

            setRunningFormations(allUserFormations.active_formations ? allUserFormations.active_formations : [])
            setCatalogFormations(newCatalogSelection)
        }
    }, [formations, userFormations])

    useEffect(() => {
        if (catalogFormations && runningFormations)
            setIsLoading(false)
    }, [catalogFormations, runningFormations])


    useEffect(() => {
        if (route.params && route.params.formation2Unlock && formations) {
            setUnlockFormationModal({
                isActivate: true,
                formation: formations.filter((f) => f.id_formation == route.params?.formation2Unlock)[0]
            })
        }
    }, [route.params, formations])

    if (isLoading)
        return <View style={styles.container}>
            <LoadingContent />
        </View>

    return <View style={styles.container}>

        <ScrollView refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

            <View style={[styles.sectionContainer, { backgroundColor: '#DEE0F3' }]}>
                <Text style={styles.textSection}>Mes formations</Text>
                <FlatList
                    data={runningFormations}
                    renderItem={(item) => <RunningFormationCard
                        params={item.item}
                        isStudent={user.is_student}
                        thumbnail_url={formations.find(elem => elem.id_formation == item.item.id_formation).img_url}
                    />
                    }
                    horizontal={true}
                    keyExtractor={(item, index) => index}
                />
            </View>

            <View style={[styles.sectionContainer, { backgroundColor: '#fff' }]}>
                <Text style={styles.textSection}>Autres formations</Text>
                <FlatList
                    data={catalogFormations}
                    renderItem={(item) => <CatalogFormationCard
                        params={item.item}
                        onUnlockFormation={() => {
                            setUnlockFormationModal({ isActivate: true, formation: item.item })
                        }}
                        onShowMore={() => {
                            setShowingMoreInfosModal({ isActivate: true, formation: item.item })
                        }}
                        isStudent={user.is_student}
                        thumbnail_url={formations.find(elem => elem.id_formation == item.item.id_formation).img_url}
                    />
                    }
                    scrollEnabled={false}
                    keyExtractor={(item, index) => index}
                />
            </View>
        </ScrollView>


        <AppModal
            isVisible={unlockFormationModal.isActivate}
            onClose={() => setUnlockFormationModal({ isActivate: false, formation: null })}
            customRender={<GetFormationModal
                formation={{
                    name: unlockFormationModal?.formation?.formation_name,
                    idFormation: unlockFormationModal?.formation?.id_formation,
                    price: formations?.filter(elem => elem.id_formation == unlockFormationModal?.formation?.id_formation)[0]?.price,
                    certifiable: unlockFormationModal?.formation?.certifiable
                }}
                onClose={() => setUnlockFormationModal({ isActivate: false, formation: null })}
                navigation={navigation}
            />}
            style={{
                width: '90%', height: "80%",
            }}
        />

        <AppModal
            isVisible={showingMoreInfosModal.isActivate}
            onClose={() => setShowingMoreInfosModal({ isActivate: false, formation: null })}
            customRender={<MoreInfosModal
                formation={showingMoreInfosModal.formation}
                onClose={() => setShowingMoreInfosModal({ isActivate: false, formation: null })}
            />}
            style={{
                height: '70%', width: '90%',
                backgroundColor: "#fff"
            }}
        />
    </View>
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        display: 'flex',
        flex: 1,
        backgroundColor: '#fff'

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
        color: "#000",
        marginLeft: 10,
        marginVertical: 10
    },
    sectionContainer: {
        paddingVertical: 15,
    }
})

const cardStyle = StyleSheet.create({
    textStyle: {
        color: "#fff"
    },
    buttonStyle: {
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        width: '60%',
        marginVertical: 3,
        justifyContent: 'center'
    }
})