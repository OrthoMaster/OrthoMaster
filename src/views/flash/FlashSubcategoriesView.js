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



const FlashContentButton = ({ config, onPress }) => {
    const imageUrl = useQuery(['Flash', 'GET', 'contentThumbnail', config.id_content], () => getS3Image(config.s3_path + "/" + config.title + '/logo.png'))

    return (
        <TouchableOpacity
            onPress={() => onPress(config)}
            style={styles.contentButton}
        >
            {
                imageUrl.data &&
                <Image
                    style={{
                        resizeMode: 'cover',
                        width: "40%",
                    }}
                    source={{ uri: imageUrl.data }}
                />
            }
            <View style={{ width: "60%", padding: 10, justifyContent: 'center' }}>
                <Text style={{
                }}>{config.title}</Text>
                <View style={{
                    display: 'flex',
                    flexDirection: 'row'
                }}>
                    <Text style={{fontSize: 12, color: '#ffaf31', fontWeight: 'bold'}}>{config.author}</Text>
                    <Text style={{fontSize: 12}}>⏱️ {config.duration}</Text>
                </View>
                <Text style={{
                    fontSize: 10,
                    color: 'gray',
                    width: '100%'
                    
                }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {
                        config.tags?.split(";").map((value, index) => {
                            return <Text key={index}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}, </Text>
                        })
                    }
                </Text>
            </View>
        </TouchableOpacity >
    )
}


const FlashSubcategoryButton = ({ item, onPress, theme_color, text_color }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data, refetch, isLoading } = useQuery(['Flash', 'GET', "contentBySubcategory", item.id], () => fetchFlashContent(item.id), {
        enabled: false // disable this query from automatically running
    });

    useEffect(() => {
        if (isOpen) {
            refetch()
        }
    }, [isOpen])

    return (
        <View style={[styles.subcategoryContainer, { backgroundColor: "#E6ECF1" }]}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={[styles.subcategoryButton, { backgroundColor: theme_color }]}
            >
                <Text style={[styles.subcategoryButtonText, { color: text_color }]}>{item.name}</Text>
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


export const FlashSubcategoriesView = ({ navigation, category_id, theme_color, title, theme_id, onReturn, text_color }) => {
    const [refreshing, setRefreshing] = useState(false)
    const subcategories = useQuery(['Flash', 'GET', 'flashSubcategoriesByCategory', category_id, theme_id], () => fetchFlashSubcategoriesByCategory(category_id))




    const onRefresh = useCallback(() => {
        setRefreshing(true);
        subcategories.refetch(category_id)
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
            <TouchableOpacity style={{ margin: 10 }} onPress={onReturn}>
                <Text style={{ color: theme_color, fontWeight: 'bold' }}> {'<'} Retour</Text>
            </TouchableOpacity>
            <FlatList
                data={subcategories.data}
                renderItem={(item) => <FlashSubcategoryButton item={item.item} onPress={(content) => navigateToContent(content)} theme_color={theme_color} text_color={text_color} />}
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
        width: '100%',
        flex: 1
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
        color: '#0A3C74'
    },
    subcategoryButtonArrow: {
        width: Dimensions.get('screen').height * 0.03,
        height: "50%",
        resizeMode: 'contain',
    },
    contentButton: {
        width: '95%',
        height: Dimensions.get('screen').height * 0.1,
        alignSelf: 'center',
        flexDirection: 'row',
        marginVertical: 10,
    }
})