import React, { useState, useEffect, useRef } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    TextInput,
    NativeSyntheticEvent,
    TextInputChangeEventData,
    Pressable,
    Dimensions,
    Keyboard,
    ScrollView,
    Image,
    SafeAreaView,
    NativeScrollEvent,
    TouchableWithoutFeedback
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Animated, { useSharedValue, withSpring, LinearTransition } from 'react-native-reanimated';
import { getS3Image } from '../services/S3Service.js';

import { useQuery } from "@tanstack/react-query";
import { fetchSearchList } from '../services/SearchService.js';
import { ISearchContent } from '../utils/interfaces.js';

const { width: screenWidth } = Dimensions.get('screen')
const PAGE_SIZE = 10

type SearchCardProps = {
    content: ISearchContent,
    onSelect: (content: ISearchContent) => any
}
const SearchCard: React.FC<SearchCardProps> = ({ content, onSelect }) => {
    const thumbnail = useQuery({
        queryKey: ['ContentSelection', 'GET', 'contentThumbnail', content.id_content, content.title],
        queryFn: () => getS3Image(createS3Path(content))
    })


    const createS3Path = (cardInfo: ISearchContent) => {
        let path = cardInfo.s3_path
        if (cardInfo.type == 'lesson') {
            path = path + '/logo_lesson.png'
        } else {
            path = path + '/' + cardInfo.title + '/logo.png'
        }
        return path
    }


    const formatType = (type: string) => {
        switch (type) {
            case 'lesson':
                return 'Leçon'
            case 'qa':
                return 'Questions / réponses'
            case 'flash':
                return 'Ressource'
            default:
                return '👍'
        }
    }

    const DisplayTags = ({ tags }) => {
        const [tagsString, setTagsString] = useState('')
        const vals = tags?.split(';')
        const nbTags = vals?.length
        const setTags = async (vals: string[]) => {
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
                style={cardStyle.tagText}
                numberOfLines={1}
            >
                {tagsString}
            </Text>
        )
    }

    return <TouchableOpacity style={cardStyle.card}
        onPress={() => {
            onSelect(content)
        }}
    >
        <View style={{
            width: screenWidth / 2.5,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {
                thumbnail.data
                    ? <Image
                        style={{
                            width: screenWidth / 2.5,
                            height: (screenWidth / 2.5) * (9 / 16),
                            backgroundColor: '#000'
                        }}
                        source={{
                            uri: thumbnail.data
                        }}
                        resizeMode={'contain'}
                    />
                    : <ActivityIndicator />
            }

        </View>


        <View style={{
            flex: 1,
            paddingHorizontal: 5,
            display: 'flex',
            justifyContent: 'flex-start'
        }}>
            {
                content.formation_name &&
                <Text style={{ fontSize: 10, }}>{content.formation_name}</Text>
            }
            <Text style={cardStyle.cardInfoTitle} numberOfLines={2}>{content.title}</Text>
            {
                content.author &&
                <Text
                    style={{
                        fontSize: 10, fontWeight: 'bold', color: '#ffaf31', marginVertical: 3
                    }}
                >
                    {content.author}
                </Text>
            }
            <View style={cardStyle.cardInfoDesc}>
                <View style={cardStyle.contentTypeTag}>
                    <Text style={cardStyle.contentTypeTagText}>{formatType(content.type)}</Text>
                </View>
                <Text style={cardStyle.cardInfoDescText}>⏱ {content.duration}</Text>
            </View>
            <DisplayTags tags={content.tags} />

        </View>
    </TouchableOpacity>
}

type SearchComponentProps = {
    keyId: string
    contentType?: "flash" | "lesson";
    isVisible: boolean;
    onSelect: (content: ISearchContent) => any;
    onClose?: () => any
}

const SearchModalComponent: React.FC<SearchComponentProps> = ({ contentType, keyId, onSelect, onClose, isVisible }) => {
    const [isSearching, setIsSearching] = useState(false)
    const searchBarWidth = useSharedValue(screenWidth * 0.95)
    const [errorMessage, setErrorMessage] = useState<string>(null)

    const [listEnded, setListEnded] = useState<boolean>(false)
    const [fetchingMore, setFetchingMore] = useState<boolean>(false)
    const [page, setPage] = useState<number>(1)
    const [searchText, setSearchText] = useState<string>(null)
    const [searchResult, setSearchResult] = useState<ISearchContent[]>(null)
    const fetchContent = useQuery({
        queryKey: ["search", keyId, searchText],
        queryFn: () => fetchSearchList({
            contentType: contentType ? [contentType] : null,
            searchText: searchText
        }, page, PAGE_SIZE),
        enabled: false
    })

const requestAPI = () => {
    fetchContent.refetch()
        .then(res => {
            const val = res.data
            if (val.length == 0) {
                setListEnded(true)
            }
            if (fetchingMore) {
                setSearchResult([...searchResult, ...val])
                setFetchingMore(false)
            } else {
                setSearchResult(val)
            }
        })
}
const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
}



const fetchMoreData = () => {
    if (fetchingMore === false) {
        setFetchingMore(true)
        setPage(page + 1)
    }
}

const handleSearchChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setSearchText(e.nativeEvent.text)
}


const startSearchAnim = () => searchBarWidth.value = withSpring((screenWidth * 0.95) * 0.8)
const endSearchAnim = () => searchBarWidth.value = withSpring(screenWidth * 0.95)

const resetValues = () => {
    setPage(1)
    setListEnded(false)
    setSearchText(null)
    setFetchingMore(false)
    setIsSearching(false)
    setSearchResult(null)
}

useEffect(() => {
    if (page > 1)
        requestAPI();
}, [page])

useEffect(() => {
    setPage(1)
    setListEnded(false)
    if (searchText != null) {
        requestAPI()
    }
}, [searchText])


return <Modal
    isVisible={isVisible}
    style={{
        width: '100%',
        height: '100%',
        alignSelf: 'center',
        alignItems: 'center',
    }}>

    <SafeAreaView style={{
        backgroundColor: '#fff',
        height: "90%",
        width: '95%',
        borderRadius: 5
    }}>

        <View style={{ // SEARCH BAR
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 20
        }}>
            <Animated.View style={{
                width: searchBarWidth,
                alignItems: 'center',
            }}>
                <TextInput
                    style={{
                        backgroundColor: '#F1F1F1',
                        borderRadius: 10,
                        padding: 10,
                        alignSelf: 'center',
                        width: "90%",
                        marginHorizontal: 20,
                        color: "#000"
                    }}
                    placeholder='Rechercher...'
                    placeholderTextColor={"gray"}
                    clearButtonMode='never'
                    value={searchText}
                    onChange={handleSearchChange}
                    autoFocus
                    onFocus={() => {
                        setIsSearching(true)
                        startSearchAnim()
                    }}
                />
            </Animated.View>
            {
                isSearching &&
                <Pressable
                    onPress={() => {
                        resetValues()
                        Keyboard.dismiss()
                        endSearchAnim()
                        onClose()
                    }}
                    style={{
                        width: screenWidth * 0.2,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{
                        fontWeight: 'bold',
                        color: '#ffaf31'
                    }}>Annuler</Text>
                </Pressable>
            }
        </View>
        {
            (isSearching) &&
            <ScrollView
                onScroll={({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
                    Keyboard.dismiss()
                    if (listEnded == false && searchText != null) {
                        if (isCloseToBottom(nativeEvent)) {
                            fetchMoreData()
                        }
                    }
                }}
            >
                {
                    (Array.isArray(searchResult) && searchResult.length > 0) &&
                    searchResult.map((value: ISearchContent, index: number) => {
                        return <SearchCard
                            key={index}
                            onSelect={(content) => {
                                resetValues()
                                onSelect(content)
                            }}
                            content={value}
                        />
                    })
                }
                {
                    (Array.isArray(searchResult) && searchResult.length == 0) &&
                    <Text style={{
                        alignSelf: 'center',
                        marginVertical: 20
                    }}>
                        Aucun média trouvé
                    </Text>
                }
                {
                    fetchContent.isLoading &&
                    <ActivityIndicator />
                }
                {
                    searchResult === null &&
                    <Text style={{
                        color: 'gray',
                        textAlign: 'center'
                    }}>
                        Recherchez par mot(s) clé(s), nom d'auteur ou thématique
                    </Text>
                }

                {
                    (fetchContent.isError) &&
                    <Text style={{
                        color: '#000',
                        textAlign: 'center'
                    }}>
                        {fetchContent.error.message}
                    </Text>
                }
            </ScrollView>
        }
    </SafeAreaView>
</Modal>
}

const cardStyle = StyleSheet.create({
    card: {
        width: '100%',
        marginVertical: 5,
        flexDirection: 'row',
        height: screenWidth * 0.25,
        paddingHorizontal: 5,
    },
    cardInfoTitle: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#20123A',
    },
    cardInfoDesc: {
        flexDirection: 'row',
    },
    cardInfoDescText: {
        fontWeight: '400',
        fontSize: 10,
        color: '#838393',
        marginLeft: 5
    },
    tagText: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#9493A1',
    },
    contentTypeTag: {
        backgroundColor: '#20113A',
        borderRadius: 20,
        paddingHorizontal: 5, paddingVertical: 2
    },
    contentTypeTagText: {
        fontSize: 10,
        color: '#fffefd',
        fontWeight: '500'
    }
})

export default SearchModalComponent;