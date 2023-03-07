import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
} from 'react-native'

import { useDispatch, useSelector, connect } from 'react-redux';


//import { useQuery, useQueryClient } from "react-query"

import { getSearchList } from '../../actions/searchAction';
import { logout } from '../../actions/auth';

import { SearchFilters } from './components/SearchFilters'
import { ContentSelection } from './components/ContentSelection'
import { SearchHeader } from './SearchHeader'
import { LoadingContent } from '../../component/LoadingContent'
import { API_SEARCH_CLEAN } from '../../actions/types';

const SearchView = ({ contentModel, dispatch, navigation, route }) => {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState()
    const [searchText, setSearchText] = useState()


    const requestAPI = () => {

        dispatch(getSearchList({
            page: page,
            payload: {
                contentType: route.name == "formation-search" ? 'lesson' : null,
                filters: filters,
                body: null,
                searchText: searchText
            },
        }))
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
            content: card.content
        })

    }

    // if (contentModel.error) {
    //     dispatch({
    //         type: API_SEARCH_CLEAN
    //     })
    // }

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