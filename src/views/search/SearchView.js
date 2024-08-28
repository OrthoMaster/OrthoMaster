import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
} from 'react-native'

import { useDispatch, useSelector, connect } from 'react-redux';


//import { useQuery, useQueryClient } from "react-query"

import { getSearchList, searchFailure, searchSuccess, listEnded } from '../../actions/searchAction';

import { SearchFilters } from './components/SearchFilters'
import { ContentSelection } from './components/ContentSelection'
import { SearchHeader } from './SearchHeader'
import { LoadingContent } from '../../component/LoadingContent'
import { API_SEARCH_CLEAN } from '../../actions/types';
import { useQuery } from 'react-query';
import { fetchSearchList } from '../../services/SearchService';

const SearchView = ({ contentModel, dispatch, navigation, route }) => {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState()
    const [searchText, setSearchText] = useState()
    const fetchContent = useQuery(["search", searchText, filters], () => fetchSearchList({
        contentType: filters,
        body: null,
        searchText: searchText
    }, page), {
        onSuccess: val => {
            // console.log(val);

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



    const fetchMoreData = () => {
        if (!contentModel.isListEnd && !contentModel.moreLoading) {
            setPage(page + 1)
        }
    }

    const handleNavigation = (card) => {
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
                id_content: card.id_content,
                title: card.title,
                type: card.type,
                module_num: card.module_num,
                demo_access: card.demo_access,
                max_score: card.max_score,
                s3_path: card.s3_path
            },
            formation: {
                formation_name: card.formation_name,
                id_formation: card.id_formation,
                certifying: card.certifying,
                id: card.id_user_formation,
                is_paid: card.is_paid,
                progress_rate: card.progress_rate,
                time_spent: card.time_spent
            }
        })

    }


    return <View style={styles.container}>
        <SearchHeader
            navigation={navigation}
            onReturn={() => {
                dispatch({
                    type: API_SEARCH_CLEAN,
                })
                navigation.goBack()
            }}
            placeholder={'trouver une leçon...'}
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
            />}
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