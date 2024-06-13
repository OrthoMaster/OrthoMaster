import React, { useState, useEffect } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Button,
    Linking
} from "react-native";
import { Feather, AntDesign } from '@expo/vector-icons';
import { useQuery, useMutation } from "react-query";
import {
    fetchFeedCategories,
    fetchFeedsFromCategory,
    likeArticle,
    dislikeArticle,
    fetchLikedArticles
} from "../../../services/FeedService";

const ArticleCard = ({ config, onLikeOrDislike }) => {
    const [associatedMedia, setAssociatedMedia] = useState(null)
    const [showingMore, setShowingMore] = useState(false)
    const [imgUrl, setImgUrl] = useState(null)
    const [isLiked, setIsLiked] = useState(false)
    const socialNetworkIcons = {
        "facebook": require('../../../../assets/social/facebook_icon.png'),
        "instagram": require('../../../../assets/social/instagram_icon.png'),
        "youtube": require('../../../../assets/social/youtube_icon.png'),
        "internet": require('../../../../assets/social/internet.png')
    }

    const like = useMutation(likeArticle, {
        onSuccess: val => {
            setIsLiked(true)
        },
        onSettled: () => {
            onLikeOrDislike()
        }
    })
    const dislike = useMutation(dislikeArticle, {
        onSuccess: val => {
            setIsLiked(false)
        },
        onSettled: () => {
            onLikeOrDislike()
        }
    })


    useEffect(() => {
        if (config.liked && config.liked == true) {
            setIsLiked(true)
        }
        Image.prefetchWithMetadata(config.image_url)
            .then(val => {
                setImgUrl(config.image_url)
            })
            .catch(e => {
            })
        let mediaIcon = null
        for (const [key, value] of Object.entries(socialNetworkIcons)) {
            if (config.href.includes(key)) {
                mediaIcon = value
            }
        }
        if (mediaIcon == null) {
            setAssociatedMedia(socialNetworkIcons.internet)
        } else {
            setAssociatedMedia(mediaIcon)
        }
    }, [])



    return <View style={{
        width: '90%',
        alignSelf: 'center',
        marginVertical: 5,
        borderRadius: 5,
        shadowRadius: 5,
        shadowOpacity: 0.15,
        backgroundColor: '#fff',
        shadowOffset: {
            height: 5
        },
        paddingTop: 5,
        paddingHorizontal: 10
    }}>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            position: 'absolute',
            zIndex: 1,
            right: 10, bottom: 10,
            alignItems: 'center',
        }}>
            <Image
                source={associatedMedia}
                style={{
                    height: 20,
                    width: 20,
                    resizeMode: 'contain',
                }}
            />
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
                        : <AntDesign name="hearto" size={24} color="#FF495C" />
                }
            </TouchableOpacity>
        </View>

        <View style={{
            flexDirection: 'row',
            display: 'flex'
        }}>
            <View style={{
                backgroundColor: '#F1F1F1',
                borderRadius: 10,
                width: "35%", height: 100
            }}>
                {
                    imgUrl &&
                    <Image
                        source={{
                            uri: imgUrl
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            alignSelf: 'center'
                        }}
                        resizeMode="cover"
                    />
                }
            </View>
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

const LIKE_CATEGORY_ID = 1000

export default FeedDisplayer = ({ }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(1)
    const categories = useQuery(["GET", "categories", "feed"], () => fetchFeedCategories())

    const articles = useQuery(["GET", "Feeds", selectedCategoryId], () => fetchFeedsFromCategory(selectedCategoryId), {
        enabled: selectedCategoryId != 0
    })

    const savedArticles = useQuery(["GET", "liked", "feed"], () => fetchLikedArticles())

    const articleView = () => {

        if (articles.isLoading || savedArticles.isLoading)
            return <ActivityIndicator color={"#ffaf31"} size={50} />

        if ((selectedCategoryId != LIKE_CATEGORY_ID &&  Array.isArray(articles.data) && Object.keys(articles.data).length == 0) ||
            (selectedCategoryId == LIKE_CATEGORY_ID && Array.isArray(savedArticles.data) && Object.keys(savedArticles.data).length == 0)
        )
            return <Text style={{
                alignSelf: 'center',
                margin: 20
            }}>Aucun article trouvé</Text>

        return <View>
            <FlatList
                style={{ width: "100%", paddingTop: 10 }}
                data={selectedCategoryId === LIKE_CATEGORY_ID ? savedArticles.data : articles.data}
                scrollEnabled={false}
                renderItem={({ item }) => <ArticleCard config={item} onLikeOrDislike={() => {
                    savedArticles.refetch()
                }} />}
                keyExtractor={item => item.id}
            />
        </View>
    }

    return (<View style={styles.container}>
        <Text style={styles.headerText}>L'actualité de l'orthopédie</Text>
        <Text style={styles.headerSubtext}>Sélectionnée rien que pour vous</Text>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginLeft: 10
        }}>
            {
                (categories.isLoading == false && categories.data) &&
                categories.data.map((value, index) => {
                    return <TouchableOpacity key={index} style={{
                        paddingVertical: 5, paddingHorizontal: 10,
                        borderRadius: 5,
                        backgroundColor: selectedCategoryId == value.id ? "#ffaf31" : "#F1F1F1",
                        marginHorizontal: 5, marginVertical: 5
                    }}
                        onPress={() => setSelectedCategoryId(value.id)}>
                        <Text style={{ color: selectedCategoryId == value.id ? "#fff" : "#000", }}>{value.name}</Text>
                    </TouchableOpacity>
                })
            }
            <TouchableOpacity style={{
                paddingVertical: 5, paddingHorizontal: 10,
                borderRadius: 5,
                backgroundColor: selectedCategoryId == LIKE_CATEGORY_ID ? "#ffaf31" : "#F1F1F1",
                marginHorizontal: 5, marginVertical: 5
            }}
                onPress={() => setSelectedCategoryId(LIKE_CATEGORY_ID)}>
                <Text style={{ color: selectedCategoryId == LIKE_CATEGORY_ID ? "#fff" : "#000", }}>❤️ Articles sauvegardés ({savedArticles.data?.length})</Text>
            </TouchableOpacity>
        </View>
        {
            articleView()
        }
    </View>)
}

const styles = StyleSheet.create({
    container: {
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 22,
        width: '80%',
        marginLeft: 20
    },
    headerSubtext: {
        fontSize: 18,
        width: '80%',
        marginLeft: 20
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
    }
})