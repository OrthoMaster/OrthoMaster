import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
} from 'react-native'

import { useDispatch, useSelector, connect } from 'react-redux';


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
import Toast from 'react-native-toast-message';

const SearchView = ({ contentModel, dispatch, navigation, route }) => {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState()
    const [searchText, setSearchText] = useState()
    const [isStudent, setIsStudent] = useState(false)
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

    const showToast = ({
        type = 'success',
        text1 = 'Hello',
        text2 = 'This is some something 👋'
    }) => {
        Toast.show({
            type: type,
            text1: text1,
            text2: text2
        });
    }

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

    const handleNavigation = async (card) => {
        let userFormationId = card.id_user_formation
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

        if (userFormationId == null && card.type == "lesson") {

            const res = await register2Formation.mutateAsync({
                id_formation: card.id_formation_catalog,
                formation_name: card.formation_name
            })
                .catch(() => { return null })

            if (res)
                userFormationId = res.insertId
        }

        // Ouverture contenu pas en en formation -> enregistrement formation + ouverture contenu

        const isBlocked = card.demo_access == false && (card.certifying == false && card.is_paid == false)

        if (isBlocked) {
            navigation.navigate("Formation")
            return
        }

        if (userFormationId != null || card.type == "flash") {
            navigation.navigate(nextView, {
                content: {
                    id_content: card.id_content,
                    title: card.title,
                    type: card.type,
                    module_num: card.module_num,
                    demo_access: card.demo_access,
                    max_score: card.max_score,
                    s3_path: card.s3_path
                },
                formation: {
                    id: userFormationId
                },
                type: card.type,
                demoMode: (card.certifying == false && card.is_paid == false && !isStudent)
            })
        } else
            showToast({
                type: "error",
                text1: "Echec ouverture",
                text2: "Veuillez ré-essayer"
            })
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
        {contentModel.loading ?
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
            />}
        <Toast position="bottom" />
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