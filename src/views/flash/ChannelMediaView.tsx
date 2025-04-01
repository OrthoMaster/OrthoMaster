import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    StyleSheet, View,
    Text,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView
} from "react-native";

import { useQuery } from "react-query";
import { fetchMedias } from "../../services/FlashMediasService";

const { width: screenWidth } = Dimensions.get('screen')

import { IContent } from "../../interfaces";
import { fetchPastEvents } from "../../services/EventsService";
import SimpleCarousel from "../../component/carousel/SimpleContentCarousel";

export type ChannelMediaViewParams = {
    channelType: 'event' | 'author';
    logoUrl: string;
    name: string;
    description: string;
    targetId: number;
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
                                marginVertical: 10,
                                flexDirection: "row",
                                alignItems: 'center',
                                backgroundColor: '#6E7DA6',
                                height: 200
                            }}>
                                <View style={{
                                    backgroundColor: '#203864',
                                    height: '100%',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{
                                        fontWeight: 'bold',
                                        fontSize: 22,
                                        color: '#fff',
                                        transform: "rotate(-90deg)",
                                        fontFamily: "impact"
                                    }}>{pastEventsElem.edition_year}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
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
                backgroundColor: 'green',
                padding: 10
            }}>
                <Image
                    source={{ uri: channelParams.logoUrl }}
                    style={{
                        height: screenWidth * 0.25,
                        width: "80%",
                        alignSelf: 'center',
                        objectFit: 'contain',
                        backgroundColor: 'red'
                    }}
                />
                <View style={{
                    padding: 10,
                    position: 'static'
                }}>
                    <Text style={styles.headerTitle}>{channelParams.name}</Text>
                    <Text>{channelParams.description || "Description du congrès"}</Text>
                </View>
            </View>

            <View style={{backgroundColor: 'blue'}}>
                {eventCarousels}
            </View>
        </ScrollView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: 22
    }
})

export default ChannelMediaView