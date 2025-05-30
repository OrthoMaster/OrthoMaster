import React from "react";
import { Dimensions, Image, Linking, Text, TouchableOpacity, View, StyleSheet, SafeAreaView } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

import { IContent } from "../../../../utils/interfaces";
import { useQuery } from "@tanstack/react-query";
import { fetchSearchList } from "../../../../services/SearchService";
import { getS3Image } from "../../../../services/S3Service";
import { ScrollView } from "react-native-gesture-handler";

const { width: screenWidth } = Dimensions.get('screen')

export const LearningSupportButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
    return (<TouchableOpacity
        style={{
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: '#5AC4F6',
            padding: 20,
            borderRadius: 15,
        }}
        onPress={onPress}
    >
            <Image
                source={require('../../../../../assets/tools/learning-support/access-icon.png')}
                style={{
                    width: screenWidth / 6,
                    height: screenWidth / 6,
                    marginBottom: 10
                }}
            />
        <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>Supports pédagogiques</Text>
    </TouchableOpacity>)
}


type LearningSupportIconsProps = {
    content: IContent;
    onPress: (content: IContent) => any;
}
const LearningSupportIcons: React.FC<LearningSupportIconsProps> = ({ content, onPress }) => {
    const imageUrl = useQuery({
        queryKey: ['contentThumbnail', content.id_content, content.title],
        queryFn: () => getS3Image(`${content.s3_path}/${content.title}/logo.png`)
    })
    return (<TouchableOpacity
        key={content.id_content}
        style={{
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: 120, height: 120,
        }}
        onPress={() => {
            onPress(content)
        }}
    >
        <Image
            source={{ uri: imageUrl.data }}
            style={{
                width: 90,
                height: 90,
                borderRadius: 10,
                resizeMode: 'cover',
            }}
        />
        <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginVertical: 5 }}>{content.title}</Text>
    </TouchableOpacity>)
}

type LearningSupportMenuProps = {
    onClose: () => any;
    onStart: (content: IContent) => any;
}
export const LearningSupportMenu: React.FC<LearningSupportMenuProps> = ({ onClose, onStart }) => {
    const toolContents = useQuery({
        queryKey: ['Tools', 'GET', 'Contents'],
        queryFn: () => fetchSearchList({
        contentType: ['tool'],
        filters: null
    })})


    return (
        <SafeAreaView>
            <ScrollView style={{
                backgroundColor: "#5AC4F6",
                borderRadius: 15,
                height: '100%',
                width: '100%',
            }}
                contentContainerStyle={{
                    paddingBottom: 50,
                }}
            >
                <Image
                    source={require('../../../../../assets/tools/learning-support/learning-support.png')}
                    style={{
                        width: "95%",
                        height: 250,
                        borderRadius: 10,
                        resizeMode: 'contain',
                        alignSelf: 'center'
                    }}
                />

                <Text style={styles.contentsSectionTitle}>Anatomie</Text>
                <View style={styles.contentsContainer}>
                    {
                        (toolContents.isLoading == false && toolContents.data) &&
                        toolContents.data?.map((content: IContent) => {
                            if (content.tags?.includes('anatomie') == true)
                                return <LearningSupportIcons
                                    key={content.id_content}
                                    content={content}
                                    onPress={(content) => {
                                        onStart(content)
                                        onClose()
                                    }}
                                />
                        })
                    }


                </View>

                <Text style={styles.contentsSectionTitle}>Pathologie</Text>
                <View style={styles.contentsContainer} >
                    {
                        (toolContents.isLoading == false && toolContents.data) &&
                        toolContents.data?.map((content: IContent) => {
                            if (content.tags?.includes('pathologie') == true)
                                return <LearningSupportIcons
                                    key={content.id_content}
                                    content={content}
                                    onPress={(content) => {
                                        onStart(content)
                                        onClose()
                                    }}
                                />
                        })
                    }
                </View>
            </ScrollView>
            <TouchableOpacity
                style={{
                    alignSelf: 'center',
                    position: 'absolute',
                    bottom: 10,
                    padding: 10,
                }}
                onPress={onClose}
            >
                <Ionicons name="close-circle" size={34} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 20
    },
    contentsSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
        textAlign: 'center',
        color: "#143A71"
    }
})