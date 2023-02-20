import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Dimensions
} from 'react-native'
import { useQuery } from 'react-query'
import { fetchFlashCategoriesByTheme } from '../../services/FlashService'



const FlashCategoryButton = ({ item, onPress, theme_color }) => {
    return (
        <TouchableOpacity
            style={[styles.buttonBox, {backgroundColor: theme_color}]}
            onPress={() => onPress(item)}
        >
            <Text style={styles.textButton}>{item.name}</Text>
        </TouchableOpacity>)
}


export const FlashCategoriesView = ({ navigation, route }) => {


    const categories = useQuery('fetchFlashCategoriesByTheme', () => fetchFlashCategoriesByTheme(route.params.theme_id), {
        onError: (error) => {
            throw error
        }
    })

    useEffect(() => {
        navigation.setOptions({ title: route.params.theme_title })
    }, [])


    const navigateToSubategory = (category) => {
        navigation.navigate('flash-subcategories', {
            category_id: category.id,
            category_title: category.name,
            theme_color: route.params.theme_color
        })
    }

    if (categories.isLoading) return <ActivityIndicator />;
    if (categories.isError) return

    return (
        <View style={styles.container}>
            <FlatList
                data={categories.data}
                renderItem={(item) => <FlashCategoryButton item={item.item} onPress={navigateToSubategory} theme_color={route.params.theme_color}/>}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%' }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
        alignItems: 'center',
        //justifyContent: 'center'
    },
    list: {
        width: '100%',
        backgroundColor: '#fff000',
    },
    buttonBox: {
        width: '90%',
        height: Dimensions.get('screen').width * 0.2,
        alignSelf: 'center',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5
    },
    textButton: {
        fontWeight: 'bold',
        fontSize: 16

    }
})