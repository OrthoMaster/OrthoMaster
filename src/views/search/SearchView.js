import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity
} from 'react-native'
import AppModal from '../../component/AppModal';

import { connect } from 'react-redux';
import AntDesign from '@expo/vector-icons/AntDesign';

//import { useQuery, useQueryClient } from "react-query"

import { getSearchList, searchSuccess, listEnded } from '../../actions/searchAction';

import { SearchFilters } from './components/SearchFilters'
import { ContentSelection } from './components/ContentSelection'
import { SearchHeader } from './SearchHeader'
import { LoadingContent } from '../../component/LoadingContent'
import { API_SEARCH_CLEAN } from '../../actions/types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { fetchSearchList } from '../../services/SearchService';
import { getCurrentUser } from '../../services/UserService';
import { registerFormation } from '../../services/FormationService';
import { width } from 'deprecated-react-native-prop-types/DeprecatedImagePropType';

const SearchView = ({ contentModel, dispatch, navigation, route }) => {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState()
    const [searchText, setSearchText] = useState()
    const [isStudent, setIsStudent] = useState(false)
    const [openModal, setOpenModal] = useState(null)
    useQuery("current-user", () => getCurrentUser(), {
        onSuccess: user => { setIsStudent(user.is_student) }
    })
    const register2Formation = useMutation(registerFormation)
    const fetchContent = useQuery(["search", searchText, filters], () => fetchSearchList({
        contentType: filters,
        body: null,
        searchText: searchText
    }, page), {
        onSuccess: val => {
            if (val.length == 0) {
                dispatch(listEnded())
            }
            dispatch(searchSuccess({
                data: val
            }))
        },
        onError: err => {
            dispatch(searchSuccess({
                error: err.response.data
            }))
        },
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
        .then(res=>{
            navigate2Content({...content, id_user_formation: res.insertId})
        })
    }

    const navigate2Content = (content)=>{
        let nextView = 'formation-home'
        switch (route.name) {
            case 'home-search':
                nextView = 'home-content'
                break;
            case 'formation-search':
                nextView = 'formation-content'
                break;

            default:
                break;
        }
        
        navigation.navigate(nextView, {
            content: {
                id_content: content.id_content,
                title: content.title,
                type: content.type,
                module_num: content.module_num,
                demo_access: content.demo_access,
                max_score: content.max_score,
                s3_path: content.s3_path
            },
            formation: {
                id: content.id_user_formation
            },
            type: content.type
        })
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
                navigate2Content(card)
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
            values={route.name == 'formation-search'
                ? ['Anatomie', 'Pathologie', 'Produit', 'Bonne Pratique']
                : ['Formation', 'Question / Réponse', 'Flash']
            }
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
        <AppModal
            isVisible={openModal != null}
            onClose={() => setOpenModal(null)}
            style={{
                width: "80%"
            }}
            customRender={<View style={{
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
                                    navigation.navigate("Formation")
                                }}
                            >
                                <Text>
                                    Voir les formations
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

            </View>}
        />
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