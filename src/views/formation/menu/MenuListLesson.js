import React, { useState, useEffect } from 'react'
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Text,
    View,
    ActivityIndicator,
    Image
} from 'react-native'


import { useQuery } from 'react-query';
import { fetchSearchList } from '../../../services/SearchService';
import { getS3Image } from '../../../services/S3Service';
import { logout } from '../../../actions/auth';
import { useDispatch } from 'react-redux';


const MenuButton = ({ item, navigation }) => {
    const [imgUri, setImgUri] = useState(null)

    const fetchImage = async (contentInfos) => {
        let path = contentInfos.content.type + '/' + contentInfos.content.module_num + '/logo_lesson.png'
        try {
            const imageUrl = await getS3Image(path)
            return imageUrl
        } catch (error) {
            console.error('ImageFactory: ' + error);
        }
    }

    useEffect(() => {
        let isDisplay = true
        fetchImage(item).then(data => {
            if (isDisplay) {
                setImgUri(data)
            }
        })
        return () => {
            isDisplay = false
        }
    }, [item])

    return <TouchableOpacity style={styles.button}
        onPress={() => navigation.navigate('formation-content', {
            content: item.content
        })}
    >
        <View style={styles.imgContainer}>
            {imgUri ?
            <Image
                style={{
                    width: 60,
                    height: 60,
                    resizeMode: 'contain'
                }}
                source={{ uri: imgUri }}
            />
        : <ActivityIndicator />
        }
        </View>
        <View style={styles.buttonInfos}>
            <Text style={styles.buttonTitle}>{item.content.title}</Text>
            <Text
                style={styles.buttonDescription}
                numberOfLines={2}
            >
                {item.content.description}
            </Text>
        </View>
    </TouchableOpacity>
}


export const MenuListLesson = ({ navigation, category, filters }) => {
    const dispatch = useDispatch()
    const lessons = useQuery('searchLessonInMenu', () => fetchSearchList({ contentType: 'lesson', filters: filters, body: category.tags }), {
        onError: (error) => {
            if (error.response.data == 'token_not_valid') {
              dispatch(logout())
            }
          }
    })

    useEffect(() => {
        lessons.refetch()
    }, [category, filters])


    if (lessons.isLoading) return <Text>Loading</Text>
    if (lessons.error) return <Text>Error</Text>

    return (
        <FlatList style={styles.menuSelection}
            data={lessons.data}
            renderItem={(item) => <MenuButton item={item.item} navigation={navigation} />}
            keyExtractor={(item, index) => index}
            ListFooterComponent={<View style={{height: 200}}/>}
            showsVerticalScrollIndicator={false}
        />

    )
}

const styles = StyleSheet.create({

    menuSelection: {
        height: '100%',
        width: '65%',
        position: 'absolute',
        left: 0,
        top: 150,
    },
    button: {
        width: '100%',
        marginVertical: 5,
        flexDirection: 'row',
        marginLeft: 5
    },
    imgContainer: {
        width: '25%'
    },
    buttonInfos: {
        width: '75%',
        paddingVertical: 7
    },
    buttonTitle: {
        fontWeight: '600',
        fontSize: 14,
    },
    buttonDescription: {
        fontWeight: '400',
        fontSize: 12,
        color: '#838393',
        width: '100%',
    }
})