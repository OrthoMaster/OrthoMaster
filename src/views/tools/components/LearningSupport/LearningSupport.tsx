import React from "react";
import { FlatList, Image, Linking, Text, TouchableOpacity, View } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

import { IContent } from "../../../../interfaces";
import { useQuery } from "react-query";
import { fetchSearchList } from "../../../../services/SearchService";
import { getS3Image } from "../../../../services/S3Service";


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

        <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>Supports pédagogiques</Text>
    </TouchableOpacity>)
}


type LearningSupportIconsProps = {
    content: IContent;
    onPress: (content: IContent) => any;
}
const LearningSupportIcons: React.FC<LearningSupportIconsProps> = ({ content, onPress }) => {
    const imageUrl = useQuery(['contentThumbnail', content.id_content, content.title], () => getS3Image(`${content.s3_path}/${content.title}/logo.png`))
    return (<TouchableOpacity
        key={content.id_content}
        style={{
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: 5,
            width: 80, height: 80,
            margin: 5,
        }}
        onPress={() => {
            onPress(content)
        }}
    >
        <Image
            source={{ uri: imageUrl.data }}
            style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                resizeMode: 'cover',
            }}
        />
        <Text style={{ textAlign: 'center', fontSize: 12 }}>{content.title}</Text>
    </TouchableOpacity>)
}

type LearningSupportMenuProps = {
    onClose: () => any;
    onStart: (content: IContent) => any;
}
export const LearningSupportMenu: React.FC<LearningSupportMenuProps> = ({ onClose, onStart }) => {
    const toolContents = useQuery(['Tools', 'GET', 'Contents'], () => fetchSearchList({
        contentType: ['tool'],
        filters: null
    }))


    return (<View style={{
        backgroundColor: "#5AC4F6",
        borderRadius: 15,
        height: '100%',
        width: '100%',
    }}>
        <Text style={{
            color: '#ffffff',
            fontSize: 25,
            fontWeight: 'bold',
            marginVertical: 40,
            paddingLeft: 20,
            textAlign: 'center',
        }}>
            Supports{"\n"}pédagogiques
        </Text>

        <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
        }}>
            {
                (toolContents.isLoading == false && toolContents.data) &&
                toolContents.data?.map((content: IContent) => (<LearningSupportIcons
                    key={content.id_content}
                    content={content}
                    onPress={(content) => {
                        onStart(content)
                        onClose()
                    }}
                />))
            }
        </View>
        <TouchableOpacity
            style={{
                alignSelf: 'center',
                position: 'absolute',
                bottom: 10,
            }}
            onPress={onClose}
        >
            <Ionicons name="close-circle" size={34} color="#fff" />
        </TouchableOpacity>
    </View>)
}