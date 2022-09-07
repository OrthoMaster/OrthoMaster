import React, { useEffect, useState } from 'react'
import {
    StyleSheet,
    View,
    Text,
} from 'react-native'

import { MenuBody } from './MenuBody'
import { MenuListLesson } from './MenuListLesson';

import { swipeDirections } from 'react-native-swipe-gestures';

import { SearchFilters } from '../../search/components/SearchFilters';

import { LessonHeader } from '../LessonHeader';

export const MenuLayout = ({ navigation, route }) => {
    const [menuIsOpen, setmenuIsOpen] = useState(false)
    const [category, setcategory] = useState(null)
    const [filters, setFilters] = useState([])

    const handlSwipe = (direction) => {
        const { SWIPE_LEFT } = swipeDirections;
        if (direction == SWIPE_LEFT && menuIsOpen == true) {
            setmenuIsOpen(false)
            navigation.setParams({ title: 'Se  former' })
            setcategory(null)
        }
    }

    return <View style={styles.container}>
        <LessonHeader
            onSearch={() => (navigation.navigate('formation-search'))}
            title={category ? category.name : 'Se former'}
            navigation={navigation}
        />
        <SearchFilters
            route={route}
            values={['Anatomie', 'Pathologie', 'Produit', 'Bonne pratique']}
            onSelect={(value) => setFilters(value)}
        />
        {menuIsOpen
            ? <MenuListLesson
                navigation={navigation}
                category={category}
                filters={filters}/>
            : null
        }


        <MenuBody
            menuIsOpen={menuIsOpen}
            onSwipeReturn={(direction) => handlSwipe(direction)}
            onSelect={(category) => {
                setmenuIsOpen(true)
                setcategory(category)
            }}
        />
    </View>
}


const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
})