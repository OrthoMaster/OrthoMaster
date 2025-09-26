import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    InteractionManager
} from 'react-native'
import { connect } from 'react-redux';
import AntDesign from '@expo/vector-icons/AntDesign';

import { getSearchList, searchSuccess, listEnded } from '../../actions/searchAction';

import { navigate } from '../../navigation/RootNavigation';
import { SearchFilters } from './components/SearchFilters'
import { ContentSelection } from './components/ContentSelection'
import { SearchHeader } from './SearchHeader'
import { LoadingContent } from '../../component/LoadingContent'
import { API_SEARCH_CLEAN } from '../../actions/types';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSearchList } from '../../services/SearchService';
import { getCurrentUser } from '../../services/UserService';
import { registerFormation, getUserRegisteredFormation } from '../../services/FormationService';

import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10

const SearchView = ({ contentModel, dispatch, navigation, route }) => {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState()
    const [searchText, setSearchText] = useState()
    const [isStudent, setIsStudent] = useState(false)
    const [openModal, setOpenModal] = useState(null)
    useQuery({
        queryKey: ["current-user"],
        queryFn: () => getCurrentUser().then(user => {
            setIsStudent(user.is_student)
            return user
        })
    })
    const register2Formation = useMutation({ mutationFn: registerFormation })
    const fetchContent = useQuery({
        queryKey: ["search", searchText, filters],
        queryFn: () => fetchSearchList({
            contentType: filters,
            body: null,
            searchText: searchText
        }, page, PAGE_SIZE),
        enabled: false
    })
    const requestAPI = () => {
        dispatch(getSearchList({
            page: page
        }))

        fetchContent.refetch()
    }

    const searchWithFiltersArray = (filters) => {
        dispatch({
            type: API_SEARCH_CLEAN
        })
        setFilters(filters)
        setPage(1)
    }

    const searchWithText = (text) => {
        dispatch({
            type: API_SEARCH_CLEAN
        })
        setSearchText(text)
        setPage(1)
    }

    const fetchMoreData = () => {
        if (!contentModel.isListEnd && !contentModel.moreLoading) {
            setPage(page + 1)
        }
    }

    const registerUserFormation = async (content) => {
        register2Formation.mutateAsync({
            id_formation: content.id_formation_catalog,
            formation_name: content.formation_name
        })
            .then(res => {
                navigate2Content({ ...content, id_user_formation: res.insertId })
            })
    }

    const navigate2Content = (content, formation) => {
        setOpenModal(null)
        if (content.type == "lesson") {
            navigation.navigate('home-content', {
                content: content,
                formation: formation,
                type: content.type,
                demoMode: (content.certifying == false && content.is_paid == false && !isStudent)
            })
        } else {
            navigate('Médias', {
                screen: 'flash-media-home',
            });

            InteractionManager.runAfterInteractions(() => {
                navigate('flash-media-preview', {
                    media: content,
                    type: "flash"
                });
            });
        }
    }

    const handleNavigation = async (card) => {
        let userFormationId = card.id_user_formation


        // Ouverture contenu pas en en formation -> enregistrement formation + ouverture contenu

        const isDemo = !card.certifying && !card.is_paid && isStudent == false && card.type === "lesson"

        if (userFormationId != null || card.type == "flash") {
            if (
                isStudent || isDemo == false ||
                (isDemo && card.demo_access == true)
            ) {
                navigate2Content(card, {
                    id: card.id_user_formation,
                    id_formation_catalog: card.id_formation_catalog,
                    formation_name: card.formation_name
                })
            } else {
                setOpenModal(card)
            }
        } else {
            if (isDemo && card.demo_access) {
                registerUserFormation(card)
            } else {
                setOpenModal(card)
            }
        }
    }

    useEffect(() => {
        if (filters) {
            requestAPI()
        }
    }, [filters])

    useEffect(() => {
        requestAPI();
    }, [page])

    useEffect(() => {
        if (searchText != undefined) {
            requestAPI()
        }
    }, [searchText])

    useEffect(() => {
        if (!fetchContent.isLoading) {
            if (fetchContent.isFetched && fetchContent.isSuccess) {
                if (fetchContent.data.length == 0) {
                    dispatch(listEnded())
                }
                dispatch(searchSuccess({
                    data: fetchContent.data
                }))
            }
            if (fetchContent.isError) {
                dispatch(searchSuccess({
                    error: fetchContent.error.message
                }))
            }
        }
    }, [fetchContent.isLoading, fetchContent.isFetched, fetchContent.isSuccess, fetchContent.isError, fetchContent.data])



    return <SafeAreaView style={styles.container}>
        <View>
            <SearchHeader
                navigation={navigation}
                onReturn={() => {
                    dispatch({
                        type: API_SEARCH_CLEAN,
                    })
                    navigation.goBack()
                }}
                placeholder={'Trouver un contenu ...'}
                onChangeText={(text) => searchWithText(text)}
            />

            <SearchFilters
                route={route}
                values={['Formation', 'Ressources']}
                onSelect={(filters) => searchWithFiltersArray(filters)}
            />
        </View>

        {
            contentModel.loading ?
                <LoadingContent /> :
                <ContentSelection
                    content={contentModel.data}
                    onSelect={(card) => handleNavigation(card)}
                    onEndReached={fetchMoreData}
                    onMoreLoading={() => {
                        return (
                            <View>
                                {contentModel.moreLoading && <ActivityIndicator />}
                            </View>
                        )
                    }}
                    onRetry={() => requestAPI()}
                    studentMode={isStudent}
                />
        }
        <Modal
            visible={openModal != null}
            transparent={true}
            onRequestClose={() => setOpenModal(null)}
        >
            <TouchableWithoutFeedback onPress={() => setOpenModal(null)}>
                <View style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "absolute", width: '100%', height: "100%" }} />
            </TouchableWithoutFeedback>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: "90%", backgroundColor: "#F1F1F1", borderRadius: 10, paddingBottom: 20 }}>
                    <View style={{
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        {
                            openModal?.id_product_odoo ?
                                <View style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                }}>
                                    <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        Comment débloquer ce contenu ?
                                    </Text>
                                    <Text style={{
                                        marginVertical: 10,
                                        textAlign: 'center'
                                    }}>
                                        Pour accéder à ce contenu, vous devez débloquer la formation :
                                    </Text>
                                    <Text style={{
                                        color: "#ffaf31",
                                        fontWeight: "bold",
                                        fontStyle: 'italic',
                                        textDecorationLine: 'underline',
                                        fontSize: 16,
                                        width: '90%'
                                    }}>
                                        {openModal?.formation_name}
                                    </Text>
                                    <TouchableOpacity style={{
                                        backgroundColor: '#FFAF31',
                                        marginVertical: 20,
                                        padding: 5,
                                        borderRadius: 5
                                    }}
                                        onPress={() => {
                                            setOpenModal(null)
                                            navigation.navigate("Formation", {
                                                screen: "formation-home",
                                                params: {
                                                    formation2Unlock: openModal.id_formation_catalog
                                                }
                                            })
                                        }}
                                    >
                                        <Text>
                                            Voir la formations
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                :
                                <View style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                }}>
                                    <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        Ce contenu fait partie de la formation gratuite :
                                    </Text>

                                    <Text style={{
                                        color: "#ffaf31",
                                        fontWeight: "bold",
                                        fontStyle: 'italic',
                                        textDecorationLine: 'underline',
                                        marginVertical: 30,
                                        fontSize: 16,
                                        width: "90%",
                                        textAlign: 'center'
                                    }}>
                                        {openModal?.formation_name}
                                    </Text>
                                    <TouchableOpacity style={{
                                        backgroundColor: '#05BADC',
                                        marginVertical: 20,
                                        fontSize: 12,
                                        display: 'flex',
                                        alignItems: "center",
                                        flexDirection: 'row',
                                        padding: 5,
                                        borderRadius: 5
                                    }}
                                        onPress={() => {
                                            registerUserFormation(openModal)
                                        }}
                                    >
                                        <Text style={{ marginRight: 5, color: '#fff', textAlign: 'center' }}>Commencer la formation maintenant</Text>
                                        <AntDesign name="play-circle" size={18} color="#fff" style={{ paddingHorizontal: 5 }} />
                                    </TouchableOpacity>
                                </View>
                        }

                    </View>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffefd',
        height: '100%'
    }
})


const mapStateToProps = (state) => ({
    contentModel: state.search
});

export default connect(mapStateToProps)(SearchView);