import React, {useState, useEffect} from 'react'

import {
    Text,
    View,
    StyleSheet
} from 'react-native'

import {LoadingView} from '../LoadingView'
import { ContentSelection } from '../search/components/ContentSelection'

import { useQuery } from 'react-query'
import {fetchSearchList} from '../../services/SearchService'
import { logout } from '../../actions/auth'
import { useDispatch } from 'react-redux'

export const FlashLayout = ({ navigation, route}) => {
    const {category, title} = route.params
    const dispatch = useDispatch()
    const flash = useQuery('fetchFlashByCategory', ()=> fetchSearchList({
        contentType: 'flash',
        filters: category
    }), {
        onError: (error) => {
            if (error.response.data == 'token_not_valid') {
              dispatch(logout())
            }
          }
    })

    useEffect(() => {
        let isDisplay = true

        if (isDisplay)
            navigation.setOptions({ title: title })

        return ()=> {
            isDisplay = false
        }
    }, [])
    



    if (flash.isLoading) return <LoadingView />
    if (flash.error) return <Text>Error</Text>

    return <View style={styles.container}>
            <ContentSelection
            content={flash.data}
            onSelect={(card)=>navigation.navigate('flash-content', {
                content: card.content
            })}
            onRetry={()=>null}
            />
    </View>
    

}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fffefd',
        height: '100%',
        alignItems: 'center'
    }
})