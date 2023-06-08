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
import { LoadingContent } from '../../component/LoadingContent'
import { fetchFlashCategoriesByTheme } from '../../services/FlashService'



const FlashCategoryButton = ({ item, onPress, theme_color }) => {
    return (
        <TouchableOpacity
            style={[styles.buttonBox, { backgroundColor: theme_color }]}
            onPress={() => onPress(item)}
        >
            <Text style={styles.textButton}>{item.name}</Text>
        </TouchableOpacity>)
}


export const FlashCategoriesView = ({ navigation, route }) => {


    const categories = useQuery(['Flash', 'GET', 'flashCategoriesByTheme'], () => fetchFlashCategoriesByTheme(route.params.theme_id))

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


    return (
        <View style={styles.container}>
            {/* <FlatList
                data={categories.data}
                renderItem={(item) => <FlashCategoryButton item={item.item} onPress={navigateToSubategory} theme_color={route.params.theme_color}/>}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%', backgroundColor: 'red' }}
            /> */}

            {
                categories.data ?
                categories.data.map((category, index) => 
                    <FlashCategoryButton key={index} item={category} onPress={navigateToSubategory} theme_color={route.params.theme_color} />
                )
                :<LoadingContent />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F76F11',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    list: {
        width: '100%',
        backgroundColor: '#fff000',
    },
    buttonBox: {
        width: '90%',
        //flex: 1,
        height: Dimensions.get('screen').width * 0.2,
        alignSelf: 'center',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
        borderWidth: 3,
        borderColor: '#396CDA'
    },
    textButton: {
        fontSize: 16,
    }
})