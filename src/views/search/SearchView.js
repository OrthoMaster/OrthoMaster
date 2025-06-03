import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    Modal
} from 'react-native'
import AppModal from '../../component/AppModal';

import { connect } from 'react-redux';
import AntDesign from '@expo/vector-icons/AntDesign';

//import { useQuery, useQueryClient } from "@tanstack/react-query"

import { getSearchList, searchSuccess, listEnded } from '../../actions/searchAction';

import { SearchFilters } from './components/SearchFilters'
import { ContentSelection } from './components/ContentSelection'
import { SearchHeader } from './SearchHeader'
import { LoadingContent } from '../../component/LoadingContent'
import { API_SEARCH_CLEAN } from '../../actions/types';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSearchList } from '../../services/SearchService';
import { getCurrentUser } from '../../services/UserService';
import { registerFormation, getUserRegisteredFormation } from '../../services/FormationService';

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
                navigate2Content({
                    content: { ...content, id_user_formation: res.insertId },
                    formation: {
                        id: res.insertId
                    },
                    type: content.type,
                    demoMode: (content.certifying == false && content.is_paid == false && !isStudent)
                })
            })
    }

    const navigate2Content = (paramsObj) => {

        console.log("params", paramsObj);

        try {
            switch (paramsObj.type) {
                case "lesson":
                    navigation.push("content", {
                        screen: "content-main",
                        params: paramsObj
                    })
                    break;
                case "flash":

                    break;

                default:
                    break;
            }
        } catch (error) {
            console.log(error);
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
                navigate2Content({
                    content: card,
                    formation: {
                        id: card.id_user_formation,
                        id_formation_catalog: card.id_formation_catalog,
                        formation_name: card.formation_name
                    },
                    type: card.type
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



    return <View style={styles.container}>
        <SearchHeader
            navigation={navigation}
            onReturn={() => {
                dispatch({
                    type: API_SEARCH_CLEAN,
                })
                navigation.goBack()
            }}
            placeholder={'trouver un contenu...'}
            onChangeText={(text) => searchWithText(text)}
        />

        <SearchFilters
            route={route}
            values={['Formation', 'Ressources']}
            onSelect={(filters) => searchWithFiltersArray(filters)}
        />

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
            onRequestClose={() => setOpenModal(null)}
            animationType='slide'
        >
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                                            console.log(openModal);
                                            
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
                                        <AntDesign name="playcircleo" size={18} color="#fff" style={{ paddingHorizontal: 5 }} />
                                    </TouchableOpacity>
                                </View>
                        }
                    </View>
                </View>
            </View>
        </Modal>

    </View>
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#fffefd',
        height: '100%'
    }
})


const mapStateToProps = (state) => ({
    contentModel: state.search
});

export default connect(mapStateToProps)(SearchView);