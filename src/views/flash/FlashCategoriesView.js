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
import { FlashSubcategoriesView } from './FlashSubcategoriesView'



const FlashCategoryButton = ({ item, onPress, theme_color, text_color }) => {
    return (
        <TouchableOpacity
            style={[styles.buttonBox, { backgroundColor: theme_color }]}
            onPress={() => onPress(item)}
        >
            <Text style={[styles.textButton, {color: text_color}]}>{item.name}</Text>
        </TouchableOpacity>)
}


export const FlashCategoriesView = ({ navigation, theme_id, title, color, text_color }) => {


    const categories = useQuery(['Flash', 'GET', 'flashCategoriesByTheme', theme_id], () => fetchFlashCategoriesByTheme(theme_id))
    const [selectedCategory, setSelectedCategory] = useState(null)

    useEffect(() => {
      setSelectedCategory(null)

    }, [theme_id])
    


    if (!categories.data)
        return <LoadingContent />

    return (
        <View style={styles.container}>


            {
                selectedCategory === null ?
                    categories.data.map((category, index) =>
                        <FlashCategoryButton key={index} item={category}
                        onPress={(cat) => setSelectedCategory(cat)}
                        theme_color={color}
                        text_color={text_color}
                        />
                    )
                    : <FlashSubcategoriesView
                    navigation={navigation}
                        category_id={selectedCategory.id}
                        theme_color={color}
                        title={selectedCategory.name}
                        theme_id={theme_id}
                        onReturn={()=>{setSelectedCategory(null)}}
                        text_color={text_color}
                    />
            }

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1
    },
    list: {
        width: '100%',
        backgroundColor: '#fff000',
    },
    buttonBox: {
        width: '90%',
        //flex: 1,
        height: Dimensions.get('screen').width * 0.15,
        alignSelf: 'center',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
    },
    textButton: {
        fontSize: 16,
    }
})