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
import AntDesign from '@expo/vector-icons/AntDesign';

const SearchCardDefault = ({ card, onSelect, studentMode }) => {
    const isDemo = !card.certifying && !card.is_paid && studentMode == false

    const thumbnail = useQuery(['ContentSelection', 'GET', 'contentThumbnail', card.id_content, card.title],
        () => getS3Image(createS3Path(card)))


    const createS3Path = (cardInfo) => {
        let path = cardInfo.s3_path
        if (cardInfo.type == 'lesson') {
            path = path + '/logo_lesson.png'
        } else {
            path = path + '/' + cardInfo.title + '/logo.png'
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
        const vals = tags?.split(';')
        const nbTags = vals?.length
        const setTags = async (vals) => {
            var str = ''
            vals.forEach((element, index) => {
                str += (element.charAt(0).toUpperCase() + element.slice(1) + (index + 1 == nbTags ? '' : ', '))
            });

            setTagsString(str)
        }

        useEffect(() => {
            var isDisplayed = true
            if (vals) {
                setTags(vals)
            }
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
        onPress={() => {
            onSelect(card)
        }}
    >
        <View style={{
            width: '100%',
            flexDirection: 'row',
            paddingVertical: 10
        }}>

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
                <Text style={{ fontSize: 10 }}>{card.formation_name}</Text>
                <Text style={stylesDefault.cardInfoTitle}>{card.title}</Text>
                <Text
                    style={[stylesDefault.cardInfoDescText, { height: card.description != '' ? 'auto' : 0 }]}
                    numberOfLines={2}
                >
                    {card.description}
                </Text>
                <View style={stylesDefault.cardInfoDesc}>
                    <View style={stylesDefault.contentTypeTag}>
                        <Text style={stylesDefault.contentTypeTagText}>{formatType(card.type)}</Text>
                    </View>
                    <Text style={stylesDefault.cardInfoDescText}>⏱ {card.duration}</Text>
                </View>
                <DisplayTags tags={card.tags} />

            </View>
        </View>
        {
            (isDemo && card.demo_access == false) &&
            <View style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                position: 'absolute',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Text style={{ color: "#DEDEDE" }}>Débloquer le contenu</Text>
                <AntDesign name="unlock" size={30} color="#DEDEDE" />
            </View>
        }
    </TouchableOpacity>
}





const QaCard = ({ card, onSelect, color }) => {
    const thumbnail = useQuery(['Qa', 'GET', 'qaThumbnail', card.id_content, card.title],
        () => getS3Image(`${card.s3_path}/${card.title}/logo.png`))

    return (
        <TouchableOpacity style={stylesQa.card}
            onPress={() => onSelect(card)}
        >

            <View style={{
                width: '100%',
            }}>
                {
                    thumbnail
                        ? <Image
                            style={{
                                width: "100%",
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
                    <Text style={stylesQa.cardTitle} >{card.title}</Text>

                </LinearGradient>
            </View>

            <View style={[stylesQa.cardDescriptionContainer, { backgroundColor: color }]}>
                <Text>⏱ {card.duration} | {card.description}</Text>
            </View>
        </TouchableOpacity>
    )
}

export const ContentSelection = ({
    content,
    onSelect,
    cardLayout,
    onEndReached,
    onMoreLoading,
    onRetry,
    color,
    studentMode = false
}) => {
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
                            return <QaCard card={item.item} onSelect={(card) => onSelect(card)} color={color} />

                        default:
                            return <SearchCardDefault card={item.item} onSelect={(card) => onSelect(card)} studentMode={studentMode} />
                    }
                }}
                keyExtractor={(item, index) => index}
                ListFooterComponent={onMoreLoading}
                ListEmptyComponent={renderEmpty}
                onEndReachedThreshold={0.20}
                onEndReached={onEndReached}
                automaticallyAdjustKeyboardInsets={true}
            />
        </View>
    )

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    }
})

const stylesDefault = StyleSheet.create({
    card: {
        width: '100%',
        marginVertical: 2
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
        width: '80%',
        marginBottom: 20,
        alignSelf: 'center',
    },

    cardDescriptionContainer: {
        paddingLeft: 5,
        paddingVertical: 10,
        borderWidth: 0.2,
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