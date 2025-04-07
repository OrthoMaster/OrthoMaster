import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    TextInput,
    NativeSyntheticEvent,
    TextInputChangeEventData,
    Pressable,
    Dimensions,
    Keyboard,
    ScrollView,
    Image,
    SafeAreaView,
    NativeScrollEvent
} from 'react-native'
import Modal from 'react-native-modal';

import Animated, { useSharedValue, withSpring, LinearTransition } from 'react-native-reanimated';
import { getS3Image } from '../services/S3Service.js';
import { connect, useDispatch } from 'react-redux';
import { getSearchList, searchSuccess, listEnded } from '../actions/searchAction.js';

import { API_SEARCH_CLEAN } from '../actions/types.js';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { fetchSearchList } from '../services/SearchService.js';
import { getCurrentUser } from '../services/UserService.js';
//import { registerFormation, getUserRegisteredFormation } from '../../services/FormationService';
import { ISearchContent } from '../interfaces.js';

const { width: screenWidth } = Dimensions.get('screen')
const PAGE_SIZE = 10

type SearchCardProps = {
    content: ISearchContent,
    onSelect: (content: ISearchContent) => any
}
const SearchCard: React.FC<SearchCardProps> = ({ content, onSelect }) => {
    const thumbnail = useQuery(['ContentSelection', 'GET', 'contentThumbnail', content.id_content, content.title],
        () => getS3Image(createS3Path(content)))


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
            flex: 2,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {
                thumbnail.data
                    ? <Image
                        style={{
                            // width: Dimensions.get('screen').width * 0.4,
                            // height: Dimensions.get('screen').width * 0.15,
                            width: '100%',
                            height: '100%',
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
            flex: 3,
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

    const [listEnded, setListEnded] = useState<boolean>(false)
    let fetchingMore = false
    const [page, setPage] = useState<number>(1)
    const [searchText, setSearchText] = useState<string>(null)
    const [searchResult, setSearchResult] = useState<ISearchContent[]>(null)
    const fetchContent = useQuery(["search", keyId, searchText], () => fetchSearchList({
        contentType: contentType ? [contentType] : null,
        searchText: searchText
    }, page, PAGE_SIZE), {
        onSuccess: val => {

            if (val.length == 0) {
                // TODO list ended
                console.log("EVENT : List ended");

                setListEnded(true)
            }
            // TODO get result
            console.log("FETCH SUCCESS: ", Array.isArray(val), val.length);
            if (fetchingMore) {
                setSearchResult([...searchResult, val])
                fetchingMore = false
            } else {
                setSearchResult(val)
            }
        },
        onError: err => {
            // TODO error message
            console.log("FETCH ERROR: ", err);

        },
        enabled: false
    })
    const requestAPI = () => {
        fetchContent.refetch()
    }
    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    }



    const fetchMoreData = () => {
        if (fetchingMore === false) {

            console.log("EVENT: Fetching more");
            fetchingMore = true
            setPage(page + 1)
        }
    }

    const handleSearchChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        setSearchText(e.nativeEvent.text)
    }


    const startSearchAnim = () => searchBarWidth.value = withSpring((screenWidth * 0.95) * 0.8)
    const endSearchAnim = () => searchBarWidth.value = withSpring(screenWidth * 0.95)


    useEffect(() => {
        if (page > 1)
            requestAPI();
    }, [page])

    useEffect(() => {
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
                            marginHorizontal: 20
                        }}
                        placeholder='Rechercher...'
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
                            setIsSearching(false)
                            setSearchText(null)
                            endSearchAnim()
                            Keyboard.dismiss()
                            setSearchResult(null)
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
                        if (isCloseToBottom(nativeEvent)) {
                            fetchMoreData()
                        }
                    }}
                >
                    {
                        (Array.isArray(searchResult) && searchResult.length > 0) &&
                        searchResult.map((value: ISearchContent, index: number) => {
                            return <SearchCard
                                key={index}
                                onSelect={(content) => {
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
                        }}>Aucun média trouvé</Text>
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
        paddingHorizontal: 5
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