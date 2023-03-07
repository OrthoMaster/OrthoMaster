import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    Dimensions,
    RefreshControl
} from 'react-native'
import { useQuery } from 'react-query'
import { fetchFlashSubcategoriesByCategory, fetchFlashContent } from '../../services/FlashService'
import { getS3Image } from '../../services/S3Service'
import { ColorLuminance, S3ContentPathGenerator } from '../../utils.js'



const FlashContentButton = ({ config, onPress }) => {
    const imageUrl = useQuery(['flashContentThumbnail', config.id_content], () => getS3Image(S3ContentPathGenerator(config) + 'logo.png'))



    return (
        <TouchableOpacity
            onPress={() => onPress(config)}
            style={styles.contentButton}
        >
            <Image
                style={styles.contentThumbnail}
                source={{ uri: imageUrl.data }}
            />
            <Text style={styles.contentButtontext}>{config.title}</Text>
        </TouchableOpacity>
    )
}


const FlashSubcategoryButton = ({ item, onPress, theme_color }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data, refetch, isLoading } = useQuery(["fetchContentBySubcategory", item.id], () => fetchFlashContent(item.id), {
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
        <View style={[styles.subcategoryContainer, { backgroundColor: ColorLuminance(theme_color, 0.2) }]}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={[styles.subcategoryButton, { backgroundColor: theme_color }]}
            >
                <Text style={styles.subcategoryButtonText}>{item.name}</Text>
                <Image
                    style={[styles.subcategoryButtonArrow,
                    {
                        transform: [{ rotate: isOpen ? '90deg' : '0deg' }]
                    }]}
                    source={require('../../../assets/navigation/right-arrow.png')}
                />
            </TouchableOpacity>

            {
                isOpen ?
                    !isLoading ?
                        <FlatList
                            data={data}
                            renderItem={(item) => <FlashContentButton config={item.item} onPress={(content) => onPress(content)} />}
                            keyExtractor={(item, index) => index}
                            showsVerticalScrollIndicator={false}
                        />
                        : <ActivityIndicator />
                    : null
            }
        </View>

    )
}


export const FlashSubcategoriesView = ({ navigation, route }) => {
    const [refreshing, setRefreshing] = useState(false)

    const subcategories = useQuery('fetchFlashSubcategoriesByCategory', () => fetchFlashSubcategoriesByCategory(route.params.category_id), {
        onError: (error) => {
            throw error
        }
    })

    useEffect(() => {
        navigation.setOptions({ title: route.params.category_title })
    }, [])


    const onRefresh = useCallback(() => {
        setRefreshing(true);
        subcategories.refetch(route.params.category_id)
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    const navigateToContent = (content) => {
        navigation.navigate('flash-content-viewer', {
            content: content
        })
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={subcategories.data}
                renderItem={(item) => <FlashSubcategoryButton item={item.item} onPress={(content) => navigateToContent(content)} theme_color={route.params.theme_color} />}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%', marginTop: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F76F11'
    },
    subcategoryContainer: {
        width: '90%',
        alignSelf: 'center',
        borderRadius: 5,
        marginVertical: 15,

    },
    subcategoryButton: {
        height: Dimensions.get('screen').height * 0.05,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        alignItems: 'center',
        borderRadius: 5
    },
    subcategoryButtonText: {
        fontWeight: 'bold',
        color: '#0A3C74'
    },
    subcategoryButtonArrow: {
        width: Dimensions.get('screen').height * 0.03,
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