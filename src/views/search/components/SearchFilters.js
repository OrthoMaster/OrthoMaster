import React, { useState, useEffect } from 'react'
import {
    View,
    StyleSheet,
    FlatList
} from 'react-native'

import { SearchFilterButton } from './SearchFilterButton'


export const SearchFilters = ({ route, onSelect, values }) => {

    const [filters, setfilters] = useState()

    useEffect(() => {
        if (filters) {
            onSelect(filters)
        }
    }, [filters])



    const onClickButton = (button) => {
        if (!filters) {
            setfilters([])
        }
        if (button.active) {
            setfilters(prevArray => prevArray.concat(button.filter))
        } else {

            setfilters(filters.filter(function (value, index, arr) {
                return value != button.filter;
            }))
        }
        
    }

    return (
        <View style={styles.filtersConainer}>
            <FlatList
                horizontal={true}
                data={values}
                renderItem={(item) => <SearchFilterButton
                    text={item.item}
                    onPress={(value) => onClickButton(value)}
                    value={
                        item.item == 'Formation' ? 'lesson'
                            : item.item == 'Question / Réponse' ? 'qa'
                                : item.item.toLowerCase()}
                />
                }
                keyExtractor={(item, index)=>index}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    filtersConainer: {
        height: 40,
        backgroundColor: '#fffefd',
        marginVertical: 5
    }
})