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
    dislikeArticle
} from "../../../services/FeedService";

const ArticleCard = ({ config }) => {
    const [associatedMedia, setAssociatedMedia] = useState(null)
    const [showingMore, setShowingMore] = useState(false)
    const [imgUrl, setImgUrl] = useState(null)
    const [isLiked, setIsLiked] = useState(false)
    const socialNetworkIcons = {
        "facebook": require('../../../../assets/social/facebook_icon.png'),
        "instagram": require('../../../../assets/social/instagram_icon.png'),
    }

    const like = useMutation(likeArticle, {
        onSuccess: val => {
            setIsLiked(true)
        }
    })
    const dislike = useMutation(dislikeArticle, {
        onSuccess: val => {
            setIsLiked(false)
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
        for (const [key, value] of Object.entries(socialNetworkIcons)) {
            if (config.href.includes(key)) {
                setAssociatedMedia(value)
            }
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
        <TouchableOpacity style={{ zIndex: 1, position: "absolute", right: 10, bottom: 10 }}
            onPress={() => {
                console.log(isLiked);
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
        <Image
            source={associatedMedia}
            style={{
                height: 20,
                width: 20,
                resizeMode: 'contain',
                position: 'absolute',
                zIndex: 2,
                top: 5, right: 5
            }}
        />
        <View style={{
            flexDirection: 'row',
            display: 'flex'
        }}>
            <View style={{ flex: 1 }}>
                {
                    imgUrl &&
                    <Image
                        source={{
                            uri: imgUrl
                        }}
                        style={{
                            height: 150,
                            width: "95%",
                            alignSelf: 'center'
                        }}
                        resizeMode="contain"
                    />
                }
            </View>
            <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 12, marginTop: 10 }}>{config.author}</Text>
                <Text style={{
                    fontWeight: 'bold',
                    fontSize: 13
                }}>{config.title}</Text>
                <Text style={{ fontSize: 12 }}>🗓️ {new Date(config.created).toLocaleString('fr-FR', { timeZone: 'UTC', hour12: false })}</Text>


            </View>
        </View>
        <Text numberOfLines={3} style={{
            marginTop: 5,
            fontSize: 13
        }}>{config.content}</Text>

        {
            showingMore &&
            <TouchableOpacity style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-end',
                marginBottom: 5
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

export default FeedDisplayer = ({ }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(1)
    const categories = useQuery(["GET", "categories", "feed"], () => fetchFeedCategories())

    const articles = useQuery(["GET", "Feeds", selectedCategoryId], () => fetchFeedsFromCategory(selectedCategoryId), {
        enabled: selectedCategoryId != 0
    })

    const articleView = () => {

        if (articles.isLoading)
            return <ActivityIndicator color={"#ffaf31"} size={50} />

        if (Array.isArray(articles.data) && Object.keys(articles.data).length == 0)
            return <Text style={{
                alignSelf: 'center',
                margin: 20
            }}>Aucun article trouvé</Text>

        return <View>
            <FlatList
                style={{ width: "100%", paddingTop: 10 }}
                data={articles.data}
                scrollEnabled={false}
                renderItem={({ item }) => <ArticleCard config={item} />}
                keyExtractor={item => item.id}
            />
        </View>
    }

    return (<View style={styles.container}>
        <Text style={styles.headerText}>L'actualité de l'orthopédie</Text>
        <Text style={styles.headerSubtext}>Sélectionnée rien que pour vous</Text>
        {
            (categories.isLoading == false && categories.data) &&
            <FlatList
                style={{ width: "100%", paddingTop: 10, paddingHorizontal: 10, marginTop: 20 }}
                data={categories.data}
                horizontal={true}
                scrollEnabled={false}
                renderItem={({ item }) => <TouchableOpacity style={{
                    paddingVertical: 5, paddingHorizontal: 10,
                    borderRadius: 5,
                    backgroundColor: selectedCategoryId == item.id ? "#ffaf31" : "#F1F1F1",
                    marginHorizontal: 5
                }}
                    onPress={() => setSelectedCategoryId(item.id)}>
                    <Text style={{ color: selectedCategoryId == item.id ? "#fff" : "#000", }}>{item.name}</Text>
                </TouchableOpacity>}
                keyExtractor={item => item.id}
            />
        }
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
        marginLeft: 10
    },
    headerSubtext: {
        fontSize: 18,
        width: '80%',
        marginLeft: 10
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