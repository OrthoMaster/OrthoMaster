import React, { useEffect, useState } from "react";

import { View, Text, SafeAreaView, TouchableOpacity, Dimensions, Image, StyleSheet, ScrollView, FlatList, ImageBackground, ActivityIndicator } from "react-native";
import { useQuery } from "react-query";
import { getS3Image } from "../../services/S3Service";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { IContent } from "../../interfaces";

import { LinearGradient } from 'expo-linear-gradient';
import { fetchSearchList } from "../../services/SearchService";

const screenWidth = Dimensions.get('screen').width;

type SimilarMediasContentCardProp = { media: IContent, onSelect: (media: IContent) => any }
const SimilarMediasContentCard: React.FC<SimilarMediasContentCardProp> = ({ media, onSelect }): React.ReactNode => {
    const imageUrl = useQuery(['contentThumbnail', media.id_content, media.title], () => getS3Image(`${media.s3_path}/${media.title}/logo.png`))
    // console.log(media);

    return <TouchableOpacity style={{
        flexDirection: 'row',
        marginVertical: 3,
        height: 100, width: "100%",
        borderRadius: 5,
        borderStartStartRadius: 5,
        shadowOffset: {
            width: 0, height: 0
        },
        shadowRadius: 1,
        shadowOpacity: 0.5,
        backgroundColor: '#fff'
    }}
        onPress={()=>onSelect(media)}
    >
        <Image
            source={{ uri: imageUrl.data }}
            style={{
                width: '40%',
                height: "100%",
                objectFit: 'cover',
                borderTopLeftRadius: 5, borderBottomLeftRadius: 5
            }}
        />
        <View style={{
            flex: 3,
            padding: 5
        }}>
            <Text style={{
                fontWeight: 'bold',
                fontSize: 12,
                marginTop: 5
            }}>{media.title}</Text>
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap'
            }}>
                <Text style={{fontSize: 10, color: '#ffaf31', fontWeight: 'bold', marginRight: 5}}>{media.author}</Text>
                <Text style={{fontSize: 10}}>⏱️ {media.duration}</Text>
            </View>
            <Text style={{
                fontSize: 10, color: 'gray'
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
            >
                {
                    media.tags?.split(";").map((value, index) => {
                        return <Text key={index}>{String(value).charAt(0).toUpperCase()+String(value).slice(1)}, </Text>
                    })
                }
            </Text>
        </View>
    </TouchableOpacity>
}

export type PreviewMediaParams = {
    media: IContent;
}

export const PreviewMediaView = ({ navigation, route }) => {
    const { media }: PreviewMediaParams = route.params;
    const [similarTags, setSimilarTags] = useState<string>(null)
    const imageUrl = useQuery(['contentThumbnail', media.id_content, media.title], () => getS3Image(`${media.s3_path}/${media.title}/logo.png`))
    const similarContent = useQuery(["search-similar-media", media.id_content], () => fetchSearchList({
        searchText: similarTags,
        contentType: ['flash']
    }, 1, 6), {
        enabled: similarTags !== null
    })



    const nav2 = () => {
        navigation.navigate('flash-media-viewer', {
            content: media
        })
    }

    useEffect(() => {
        const shuffleArray = (arr: string[]): string[] => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return arr
        }
        console.log(media.tags);
        let finalStr: string
        if (media.tags) {
            let tags: string[] = media.tags.split(";")
            tags = shuffleArray(tags)
            tags = tags.slice(0, 3)
            finalStr = tags.join(' ')
            console.log("FINAL", finalStr);
        } else {
            finalStr = ''
        }
        setSimilarTags(finalStr)
    }, [])

    return (<SafeAreaView style={styles.safeArea}>

        <ScrollView>

            <View style={styles.mediaSection}>
                <View style={{ backgroundColor: '#fff' }}>

                    <View style={{
                        width: "100%", height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1
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
                <Text style={{ fontWeight: "bold", fontSize: 18, marginLeft: 5, marginBottom: 10 }}>À voir aussi</Text>
                {
                    similarContent.isLoading ?
                        <ActivityIndicator />
                        : <FlatList
                            data={similarContent.data?.filter((m: { id_content: number; }) => m.id_content != media.id_content)}
                            keyExtractor={(item: any, index: number) => index.toString()}
                            scrollEnabled={false}
                            contentContainerStyle={{
                                width: "95%",
                                alignSelf: 'center'
                            }}
                            renderItem={({ item }) => (
                                <SimilarMediasContentCard media={item} 
                                onSelect={(m) => {
                                    navigation.push('flash-media-preview', {
                                        media: m
                                      } as PreviewMediaParams)
                                }}
                                />
                            )}
                        />
                }

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