import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Button,
    ActivityIndicator,
    Image
} from 'react-native'


import { getS3Image } from '../../../services/S3Service'
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from 'react-query';

const SearchCardDefault = ({ card, onSelect }) => {
    const thumbnail = useQuery(['fetchContentThumbnail', card.content.id_content, card.content.title],
    () => getS3Image(createS3Path(card)), {
        onError: (err) => {
            throw err
        }
    })

    const createS3Path = (cardInfo) => {
        let path = cardInfo.content.s3_path
        if (cardInfo.content.type == 'lesson') {
            path = path + '/logo_lesson.png'
        } else {
            path = path + '/' + cardInfo.content.title + '/logo.png'
        }
        return path
    }


    const formatType = (type) => {
        switch (type) {
            case 'lesson':
                return 'Leçon'
            case 'qa':
                return 'Questions / réponses'
            case 'flash':
                return 'Flash'
            default:
                return '👍'

        }
    }

    const DisplayTags = ({ tags }) => {
        const [tagsString, setTagsString] = useState('')
        const vals = tags.split(';')
        const nbTags = vals.length

        const setTags = async (vals) => {
            var str = ''


            vals.forEach((element, index) => {
                str += (element.charAt(0).toUpperCase() + element.slice(1) + (index + 1 == nbTags ? '' : ', '))
            });

            setTagsString(str)
        }

        useEffect(() => {
            var isDisplayed = true
            setTags(vals)
            return () => {
                isDisplayed = false
            }
        }, [])


        return (
            <Text
                style={stylesDefault.tagText}
                numberOfLines={1}
            >
                {tagsString}
            </Text>
        )
    }

    return <TouchableOpacity style={stylesDefault.card}
        onPress={() => onSelect(card)}
    >
        {
            thumbnail
                ? <Image
                    style={{
                        width: Dimensions.get('screen').width * 0.4,
                        height: Dimensions.get('screen').width * 0.15
                    }}
                    source={{
                        uri: thumbnail.data
                    }}
                    resizeMode={'contain'}
                />
                : <ActivityIndicator />
        }

        <View style={stylesDefault.cardInfos}>
            <Text style={stylesDefault.cardInfoTitle}>{card.content.title}</Text>
            <Text
                style={[stylesDefault.cardInfoDescText, { height: card.content.description != '' ? 'auto' : 0 }]}
                numberOfLines={2}
            >
                {card.content.description}
            </Text>
            <View style={stylesDefault.cardInfoDesc}>
                <View style={stylesDefault.contentTypeTag}>
                    <Text style={stylesDefault.contentTypeTagText}>{formatType(card.content.type)}</Text>
                </View>
                <Text style={stylesDefault.cardInfoDescText}>⏱ {card.content.duration}</Text>
            </View>
            <DisplayTags tags={card.tags} />

        </View>
    </TouchableOpacity>
}





const QaCard = ({ card, onSelect }) => {
    const thumbnail = useQuery(['fetchQaThumbnail', card.content.id_content, card.content.title],
    () => getS3Image(`${card.content.s3_path}/${card.content.title}/logo.png`), {
        onError: (err) => {
            throw err
        }
    })

    return (
        <TouchableOpacity style={stylesQa.card}
            onPress={() => onSelect(card)}
        >
            <View >
                {
                    thumbnail
                        ? <Image
                            width={Dimensions.get('screen').width}
                            style={{
                                width: Dimensions.get('screen').width,
                                height: Dimensions.get('screen').width / 2,
                                resizeMode: 'contain'
                            }}
                            source={{
                                uri: thumbnail.data
                            }}
                        />
                        : <ActivityIndicator />
                }

                <LinearGradient
                    // Button Linear Gradient
                    colors={['transparent', '#000000']}
                    style={stylesQa.cardTitleContainer}>
                    <Text style={stylesQa.cardTitle} >{card.content.title}</Text>

                </LinearGradient>
            </View>

            <View style={stylesQa.cardDescriptionContainer}>
                <Text>⏱ {card.content.duration} | {card.content.description}</Text>
            </View>
        </TouchableOpacity>
    )
}

export const ContentSelection = ({ content, onSelect, cardLayout, onEndReached, onMoreLoading, onRetry }) => {
    const renderEmpty = () => {
        return (
            <View>
                <Text>Nous ne trouvons pas de contenu pour le moment...</Text>
                <Button onPress={() => onRetry()} title='Réessayer' />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={content}
                renderItem={(item) => {
                    switch (cardLayout) {
                        case 'qa':
                            return <QaCard card={item.item} onSelect={(card) => onSelect(card)} />

                        default:
                            return <SearchCardDefault card={item.item} onSelect={(card) => onSelect(card)} />
                    }
                }}
                keyExtractor={(item, index) => index}
                ListFooterComponent={onMoreLoading}
                ListEmptyComponent={renderEmpty}
                onEndReachedThreshold={0.20}
                onEndReached={onEndReached}
            />
        </View>
    )

}
const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

const stylesDefault = StyleSheet.create({
    card: {
        flexDirection: 'row',
        width: '100%',
        marginVertical: 10
    },
    cardInfos: {
        width: '55%',
        marginLeft: 5
    },
    cardInfoTitle: {
        fontWeight: '600',
        fontSize: 14,
        color: '#20123A',
    },
    cardInfoDesc: {
        flexDirection: 'row',
    },
    cardInfoDescText: {
        fontWeight: '400',
        fontSize: 10,
        color: '#838393',
        marginVertical: 2,
        marginLeft: 5
    },
    tagText: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#9493A1',
        marginVertical: 3
    },
    contentTypeTag: {
        backgroundColor: '#20113A',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 20,
        marginVertical: 2
    },
    contentTypeTagText: {
        fontSize: 10,
        color: '#fffefd',
        fontWeight: '500'
    }
})

const stylesQa = StyleSheet.create({
    card: {
        width: '100%',
        marginBottom: 20,
        alignSelf: 'center'
    },

    cardDescriptionContainer: {
        paddingLeft: 5,
        paddingVertical: 10,
        borderWidth: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    cardTitleContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'flex-end',
        position: 'absolute',
        width: "100%",
        height: '100%'
    },

    cardTitle: {
        color: '#fffefd',
        fontWeight: '700',
        fontSize: 15,
    },
    askQuestionButton: {
        backgroundColor: "#E75A08",
        width: '50%',
        height: 45,
        position: 'absolute',
        alignSelf: 'center',
        top: '92%%',
        justifyContent: 'center',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#fffefd'

    },
    askQuestionButtonText: {
        fontWeight: '600',
        fontSize: 15,
        alignSelf: 'center',
        color: '#fffefd'
    }
})