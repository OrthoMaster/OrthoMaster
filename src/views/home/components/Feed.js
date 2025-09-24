import React, { useState, useEffect } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Dimensions,
    Linking
} from "react-native";
import { getLinkPreview, getPreviewFromContent } from "link-preview-js";
import { Feather, AntDesign } from '@expo/vector-icons';
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    likeArticle,
    dislikeArticle
} from "../../../services/FeedService";

export const FeedHeader = ({ categories, isLoading, onCategorySelect, selectedFeedCategoryId, nbSavedArticle }) => {

    return <View style={styles.container}>
        <Text style={styles.headerText}>L'actualité de l'orthopédie</Text>
        <Text style={styles.headerSubtext}>sélectionnée rien que pour vous...</Text>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginLeft: 10,
        }}>
            {
                (isLoading == false && categories) &&
                categories.map((value, index) => {
                    return <TouchableOpacity key={index} style={{
                        paddingVertical: 5, paddingHorizontal: 10,
                        borderRadius: 5,
                        backgroundColor: selectedFeedCategoryId == value.id ? "#ffaf31" : "#fff",
                        marginHorizontal: 2, marginVertical: 2,
                    }}
                        onPress={() => onCategorySelect(value.id)}>
                        <Text style={{ color: selectedFeedCategoryId == value.id ? "#fff" : "#000", fontSize: 10 }}>{value.name}</Text>
                    </TouchableOpacity>
                })
            }
            <TouchableOpacity style={{
                paddingVertical: 5, paddingHorizontal: 10,
                borderRadius: 5,
                backgroundColor: selectedFeedCategoryId == LIKE_CATEGORY_ID ? "#ffaf31" : "#fff",
                marginHorizontal: 2, marginVertical: 2
            }}
                onPress={() => onCategorySelect(LIKE_CATEGORY_ID)}>
                <Text style={{ color: selectedFeedCategoryId == LIKE_CATEGORY_ID ? "#fff" : "#000", fontSize: 10 }}>❤️ Articles sauvegardés ({nbSavedArticle})</Text>
            </TouchableOpacity>
        </View>
    </View>
}


export const LIKE_CATEGORY_ID = 1000


const ArticleCard = ({ config, onLikeOrDislike }) => {
    const [associatedMedia, setAssociatedMedia] = useState(null)
    const [showingMore, setShowingMore] = useState(false)
    const [img, setImg] = useState(null)
    const [isLiked, setIsLiked] = useState(false)
    const [article, setArticle] = useState(null)
    const socialNetworkIcons = {
        "facebook": require('../../../../assets/social/facebook_icon.png'),
        "instagram": require('../../../../assets/social/instagram_icon.png'),
        "youtube": require('../../../../assets/social/youtube_icon.png'),
        "internet": require('../../../../assets/social/internet.png')
    }

    const like = useMutation({
        mutationFn: likeArticle,
        onSuccess: val => {
            setIsLiked(true)
        },
        onSettled: () => {
            onLikeOrDislike()
        }
    })
    const dislike = useMutation({
        mutationFn: dislikeArticle,
        onSuccess: val => {
            setIsLiked(false)
        },
        onSettled: () => {
            onLikeOrDislike()
        }
    })

    const getPreview = async () => {
        await getLinkPreview(config.href)
            .then((data) => {
                setArticle(data)
            })
    }

    useEffect(() => {

        if (config.liked && config.liked == true) {
            setIsLiked(true)
        }

        let mediaIcon = null
        for (const [key, value] of Object.entries(socialNetworkIcons)) {

            if (config.href?.includes(key)) {
                mediaIcon = value
            }
        }
        if (mediaIcon == null) {
            setAssociatedMedia(socialNetworkIcons.internet)
        } else {
            setAssociatedMedia(mediaIcon)
        }
        getPreview()



    }, [])


    if (article == null)
        return <ActivityIndicator />
    return <View style={{
        width: '90%',
        alignSelf: 'center',
        borderRadius: 5,
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingHorizontal: 10,
        marginVertical: 7
    }}>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            position: 'absolute',
            zIndex: 1,
            right: 10, bottom: 10,
            alignItems: 'center',
        }}>
            <TouchableOpacity
                onPress={() => Linking.openURL(article.url)}
            >
                <Image
                    source={associatedMedia}
                    style={{
                        height: 20,
                        width: 20,
                        resizeMode: 'contain',
                    }}
                />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 10 }}
                onPress={() => {
                    if (isLiked) {
                        dislike.mutate(config.id)
                    } else {
                        like.mutate(config.id)
                    }
                }}
            >
                {
                    isLiked ?
                        <AntDesign name="heart" size={24} color="#FF495C" />
                        : <Feather name="heart" size={24} color="#FF495C" />
                }
            </TouchableOpacity>
        </View>

        <View style={{
            flexDirection: 'row',
            display: 'flex'
        }}>
            <TouchableOpacity style={{
                backgroundColor: '#F1F1F1',
                borderRadius: 10,
                width: "35%", height: 100
            }}
                onPress={() => Linking.openURL(article != null ? article.url : config.href)}
            >
                {
                    <Image
                        source={{
                            uri: article.title == "YouTube" ?
                                config.image_url :
                                article.images ?
                                    article.images[0]
                                    : config.image_url
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            alignSelf: 'center'
                        }}
                        resizeMode="cover"
                        defaultSource={require('../../../../assets/default-feed-thumbnail.png')}
                    />
                }
            </TouchableOpacity>
            <View style={{
                width: "65%",
                paddingLeft: 5
            }}>
                <Text style={{ fontSize: 10, color: "#FFAF31", fontWeight: 'bold' }}>{config.author}</Text>
                <Text style={{
                    fontWeight: 'bold',
                    fontSize: 12
                }}>{config.title}</Text>
                <Text style={{ fontSize: 10, fontStyle: 'italic' }}>{new Date(config.created).toLocaleString('fr-FR', { timeZone: 'UTC', hour12: false })}</Text>


            </View>
        </View>
        <Text numberOfLines={showingMore ? 0 : 3} style={{
            marginTop: 5,
            fontSize: 12
        }}>{config.content}</Text>

        {
            showingMore &&
            <TouchableOpacity style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-end',
                marginVertical: 10
            }}
                onPress={() => {
                    Linking.openURL(config.href)
                }}
            >
                <Text style={{
                    color: "#1D3470"
                }}>Consulter l'article</Text>
                <Feather name="arrow-right" size={18} color="#1D3470" />
            </TouchableOpacity>
        }

        <TouchableOpacity
            style={{
                alignSelf: 'center',
                padding: 10

            }}
            onPress={() => setShowingMore(!showingMore)}
        >
            <Text style={{
                color: "#ffaf31",
                fontWeight: 'bold',
                marginBottom: 10
            }}>{showingMore ? "Voir moins" : "Voir plus"}</Text>
        </TouchableOpacity>
    </View>
}


export const FeedDisplayer = ({ feed = [], onLikeOrDislike }) => {

    if (feed.length == 0)
        return <Text style={{
            alignSelf: 'center',
            margin: 20
        }}>{ } Aucun article trouvé</Text>

    return <View style={styles.container}>
        <FlatList
            style={{ width: "100%" }}
            data={feed}
            scrollEnabled={false}
            renderItem={({ item }) => <ArticleCard config={item} onLikeOrDislike={() => { onLikeOrDislike() }} />}
            keyExtractor={item => item.id + item.id_feed_category}
        />
    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E3E3F1',
    },
    filterButton: {
        backgroundColor: "#F1F1F1",
        margin: 5,
        padding: 10,
        borderRadius: 5
    },
    filterButtonSelected: {
        backgroundColor: "#FEF4EB",
        margin: 5,
        padding: 10,
        borderRadius: 5
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 22,
        width: '80%',
        marginLeft: 20
    },
    headerSubtext: {
        fontSize: 15,
        width: '80%',
        marginLeft: 20
    }

})