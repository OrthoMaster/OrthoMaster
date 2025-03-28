import React from "react";

import { View, Text, SafeAreaView, TouchableOpacity, Dimensions, Image, StyleSheet, ScrollView, FlatList, ImageBackground } from "react-native";
import { useQuery } from "react-query";
import { getS3Image } from "../../services/S3Service";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';

import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('screen').width;

const mediaSimilaire = [
    {
        id: "1",
        title: "Stranger Things",
        image: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
    },
    {
        id: "2",
        title: "The Witcher",
        image: "https://image.tmdb.org/t/p/w500/zrPpUlehQaBf8YX2NrVrKK8IEpf.jpg",
    },
    {
        id: "3",
        title: "Dark",
        image: "https://image.tmdb.org/t/p/w500/uAQrHntCccFpvxp75XdQgqexlJd.jpg",
    },
    {
        id: "4",
        title: "Money Heist",
        image: "https://image.tmdb.org/t/p/w500/mo6vQgGHywQmbm5tyN6hL9iR7df.jpg",
    },
    {
        id: "5",
        title: "Breaking Bad",
        image: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    }
]


export const PreviewMediaView = ({ navigation, route }) => {
    const { media } = route.params;
    const imageUrl = useQuery(['contentThumbnail', media.id_content, media.title], () => getS3Image(`${media.s3_path}/${media.title}/logo.png`))

    const nav2 = () => {
        navigation.navigate('flash-media-viewer', {
            content: media
        })
    }

    return (<SafeAreaView style={styles.safeArea}>

        <ScrollView>

            <View style={styles.mediaSection}>
                <View style={{ backgroundColor: '#fff' }}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: 10, left: 10,
                            zIndex: 20
                        }}
                        onPress={() => { navigation.goBack() }}
                    >
                        <AntDesign name="close" size={24} color="black" />
                    </TouchableOpacity>
                    <View style={{
                        width: "100%", height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,

                    }}>
                        <Image
                            source={{ uri: imageUrl.data }}
                            style={{
                                resizeMode: "cover",
                                width: "100%", height: '100%',
                                opacity: 0.9
                            }}
                            blurRadius={25}
                        />
                        <LinearGradient
                            // Background Linear Gradient
                            colors={['transparent', '#fff']}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                height: "100%",
                            }}
                        />
                    </View>
                    <View style={{ zIndex: 10 }}>
                        <View style={{
                            width: screenWidth / 2, height: (screenWidth / 2) / 2,
                            alignSelf: 'center',
                            marginVertical: 20
                        }}>
                            <Image source={{ uri: imageUrl.data }} style={{
                                width: '100%',
                                height: '100%',
                            }} />
                        </View>
                        <Text style={[styles.mediaTextContainer, { fontWeight: 'bold' }]}>{media.title}</Text>
                        <Text style={styles.mediaTextContainer}>{media.duration}</Text>
                        <TouchableOpacity style={styles.accessButtonContainer}
                            onPress={nav2}
                        >
                            <FontAwesome name="play" size={18} color="black" />
                            <Text style={{ marginLeft: 10 }}>Accèder</Text>
                        </TouchableOpacity>
                    </View>


                </View>

                <Text style={styles.mediaTextContainer}>
                    {media.description}
                </Text>

                <View style={styles.mediaInteractionContainer}>
                    <TouchableOpacity style={styles.interactionButton}>
                        <AntDesign name="plus" size={18} color="black" />
                        <Text>
                            Ma liste
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.interactionButton}>
                        <AntDesign name="star" size={18} color="black" />
                        <Text>
                            Évaluer
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.interactionButton}>
                        <Feather name="share" size={24} color="black" />
                        <Text>
                            Partager
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontWeight: "bold", fontSize: 18, marginLeft: 5 }}>Similaires</Text>
                <FlatList
                    data={mediaSimilaire}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={(item) => (

                        <View style={{
                            width: screenWidth, height: screenWidth / 2,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                        }}>

                            <TouchableOpacity key={item.index}
                                style={{
                                    width: '100%', height: "100%",
                                }}
                            >
                                <Image
                                    source={{ uri: item.item.image }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 5
                                    }} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </ScrollView>

    </SafeAreaView>)
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        position: "relative"
    },
    accessButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        padding: 7,
        marginVertical: 15,
        width: "90%",
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffaf31',
    },
    mediaInteractionContainer: {
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row',
        marginVertical: 10
    },
    interactionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    mediaSection: {
        backgroundColor: '#fff',
        // shadowOffset: {
        //     width: 0, height: 5
        // },
        // shadowRadius: 5,
        // shadowOpacity: 0.4,
        borderBottomColor: '#F1F1F1',
        borderBottomWidth: 2
    },
    mediaTextContainer: {
        width: '90%',
        alignSelf: 'center'
    }
})