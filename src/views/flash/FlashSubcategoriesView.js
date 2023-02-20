import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    Dimensions
} from 'react-native'
import { useQuery } from 'react-query'
import { fetchFlashSubcategoriesByCategory, fetchFlashContent } from '../../services/FlashService'
import { getS3Image } from '../../services/S3Service'
import {ColorLuminance, S3ContentPathGenerator} from '../../utils.js'



const FlashContentButton = ({ config, onPress }) => {
    const imageUrl = useQuery(['flashContentThumbnail', config.id_content], ()=>getS3Image(S3ContentPathGenerator(config)+'logo.png'))

    

    return (
        <TouchableOpacity
            onPress={() => onPress(config)}
            style={styles.contentButton}
        >
            <Image
                style={styles.contentThumbnail}
                source={ {uri: imageUrl.data}}
            />
            <Text style={styles.contentButtontext}>{config.title}</Text>
        </TouchableOpacity>
    )
}


const FlashSubcategoryButton = ({ item, onPress, theme_color }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data, refetch } = useQuery(["fetchContentBySubcategory", item.id], () => fetchFlashContent(item.id), {
        onError: (error) => {
            throw error
        },
        enabled: false // disable this query from automatically running
    });

    useEffect(() => {
        if (isOpen) {
            refetch()
        }
    }, [isOpen])

    return (
        <View style={[styles.subcategoryContainer, {backgroundColor: ColorLuminance(theme_color, 0.2)}]}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={[styles.subcategoryButton, {backgroundColor: theme_color}]}
            >
                <Text style={styles.subcategoryButtonText}>{item.name}</Text>
                <Image
                    style={[styles.subcategoryButtonArrow,
                        {
                            transform: [{rotate: isOpen? '90deg' : '0deg'}]
                        }]}
                    source={require('../../../assets/navigation/right-arrow.png')}
                />
            </TouchableOpacity>

            {
                isOpen ?
                    <FlatList
                        data={data}
                        renderItem={(item) => <FlashContentButton config={item.item} onPress={(content) => onPress(content)} />}
                        keyExtractor={(item, index) => index}
                        showsVerticalScrollIndicator={false}
                    />
                    : null
            }
        </View>

    )
}


export const FlashSubcategoriesView = ({ navigation, route }) => {


    const subcategories = useQuery('fetchFlashSubcategoriesByCategory', () => fetchFlashSubcategoriesByCategory(route.params.category_id), {
        onError: (error) => {
            throw error
        }
    })


    useEffect(() => {
        navigation.setOptions({ title: route.params.category_title })
    }, [])


    const navigateToContent = (content) => {
        navigation.navigate('flash-content-viewer', {
            content: content
        })
    }

    if (subcategories.isLoading) return <ActivityIndicator />;
    if (subcategories.isError) return

    return (
        <View style={styles.container}>
            <FlatList
                data={subcategories.data}
                renderItem={(item) => <FlashSubcategoryButton item={item.item} onPress={(content) => navigateToContent(content)} theme_color={route.params.theme_color}/>}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%' }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    subcategoryContainer: {
        width: '90%',
        alignSelf: 'center',
        borderRadius: 5,
        marginVertical: 5
    },
    subcategoryButton: {
        height: Dimensions.get('screen').height*0.05,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        alignItems: 'center',
        borderRadius: 5
    },
    subcategoryButtonText: {
        fontWeight: 'bold'
    },
    subcategoryButtonArrow: {
        width: Dimensions.get('screen').height*0.03,
        height: "50%",
        resizeMode: 'contain',
    },
    contentButton: {
        width: '100%',
        height: Dimensions.get('screen').height * 0.1,
        alignSelf: 'center',
        flexDirection: 'row',
        marginVertical: 10,
    },
    contentButtontext: {
        flex: 1,
        alignSelf: 'center',
        fontWeight: 'bold'
    },
    contentThumbnail: {
        resizeMode: 'cover',
        flex: 1,
        marginHorizontal: 10
    }
})