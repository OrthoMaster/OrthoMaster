import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    StyleSheet, View,
    Text,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Linking,
    TouchableOpacity
} from "react-native";
import ReadMore from 'react-native-read-more-text';
import { useQuery } from "react-query";
import { fetchMedias } from "../../services/FlashMediasService";

const { width: screenWidth } = Dimensions.get('screen')

import { IContent } from "../../utils/interfaces";
import { fetchPastEvents } from "../../services/EventsService";
import SimpleCarousel from "../../component/carousel/SimpleContentCarousel";



const ReadMoreButton = ({ value, onPress }) => {
    return (
        <TouchableOpacity style={{
            alignSelf:'flex-end'
        }} onPress={onPress}>
            <Text style={{ color: '#ffaf31', fontWeight: 'bold', fontSize: 12 }}>{value}</Text>
        </TouchableOpacity>
    )
}


export type ChannelMediaViewParams = {
    channelType: 'event' | 'author';
    logoUrl: string;
    name: string;
    description: string;
    targetId: number;
    website: string;
}
const ChannelMediaView: React.FC<any> = ({ navigation, route }) => {
    const channelParams: ChannelMediaViewParams = route.params
    const allMediaFromChannel = useQuery(["medias-channel", channelParams.name], () => fetchMedias({ event: channelParams.targetId }))
    const pastEvents = useQuery(["past-events", channelParams.targetId], () => fetchPastEvents({ eventID: channelParams.targetId }), {
        enabled: channelParams.channelType === "event"
    })
    const [eventCarousels, setEventCarousels] = useState<React.ReactNode[]>([])

    const getEventCarousels = async () => {

        let carousels: React.ReactNode[] = []
        for await (const pastEventsElem of pastEvents.data) {
            let contents = await allMediaFromChannel.data.filter((ct: IContent) => ct.id_past_event == pastEventsElem.id)
            carousels.push(
                <View key={pastEventsElem.id} style={{
                    marginVertical: 20,
                    flexDirection: "row",
                    alignItems: 'center',
                    height: 170
                }}>
                    <View style={{
                        backgroundColor: '#ffaf31',
                        height: '100%',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{
                            fontWeight: 'bold',
                            fontSize: 20,
                            color: '#fff',
                            transform: "rotate(-90deg)",
                            fontFamily: "impact"
                        }}>{pastEventsElem.edition_year}</Text>
                    </View>
                    <View style={{ flex: 1, height: '100%' }}>
                        <SimpleCarousel data={contents} nbElement2Display={2} onSelect={(content: IContent) => {
                            // onSelectContent(content)
                            navigation.push("flash-media-preview", {
                                media: content
                            })

                        }} />
                    </View>
                </View>
            )
        }
        setEventCarousels(carousels)
    }

    useEffect(() => {
        if (allMediaFromChannel.data && pastEvents.data) {
            getEventCarousels()
        }
    }, [allMediaFromChannel.data, pastEvents.data])

    return <SafeAreaView style={styles.container}>
        <ScrollView>

            <View style={{
                padding: 10
            }}>
                <Image
                    source={{ uri: channelParams.logoUrl }}
                    style={{
                        height: screenWidth * 0.25,
                        width: screenWidth * 0.25,
                        alignSelf: 'center',
                        objectFit: 'contain',
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        shadowOffset: {
                            width: 0, height: 0
                        },
                        shadowOpacity: 1,
                        shadowRadius: 2
                    }}
                />
                <View style={{
                    padding: 10,
                }}>
                    <Text style={styles.headerTitle}>{channelParams.name}</Text>
                    {
                        channelParams.description &&
                        <ReadMore
                            
                            numberOfLines={4}
                            renderTruncatedFooter={(truncated) => {
                                return <ReadMoreButton value="Lire la suite" onPress={truncated} />
                            }}
                            renderRevealedFooter={(revealed) => {
                                return <ReadMoreButton value="Voir moins" onPress={revealed} />
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                textAlign: 'justify',
                                color: '#fff',
                            }}
                                numberOfLines={4}
                            >{channelParams.description}</Text>
                        </ReadMore>
                    }
                    {
                        channelParams.website &&
                        <Text style={{
                            fontSize: 12,
                            marginTop: 10,
                            color: '#fff',
                        }}
                            onPress={() => {
                                Linking.openURL(channelParams.website)
                            }}>
                            <Text style={{ color: '#fff'}}>🌐 Site internet</Text>
                        </Text>
                    }
                </View>
            </View>

            <View style={{}}>
                {eventCarousels}
            </View>
        </ScrollView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#303030"
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        color: '#fff',
    }
})

export default ChannelMediaView