import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, TextInput } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
const { width: screenWidth } = Dimensions.get("screen")

import { IContent } from "../../../interfaces";
import SimpleAdaptiveCarousel, { CarouselItem } from "../../../component/carousel/SimpleAdaptiveCarousel";
import SimpleCarousel from "../../../component/carousel/SimpleContentCarousel";


type EventSelectedTagProps = {
    label: string;
    onClose: () => any
}
const EventSelectedTag: React.FC<EventSelectedTagProps> = ({
    label,
    onClose
}) => {
    return <View style={{
        backgroundColor: '#203864',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: 20,
        paddingVertical: 5, paddingHorizontal: 10,
        borderRadius: 50
    }}>
        <Text style={{ color: '#fff', fontSize: 12 }}>{label}</Text>
        <TouchableOpacity
            style={{ marginLeft: 5 }}
            onPress={() => onClose()}
        >
            <AntDesign name="closecircleo" size={16} color="#fff" />
        </TouchableOpacity>
    </View>
}



type CongresCarousselProps = {
    items: IContent[],
    onSelectContent: (content: IContent) => IContent
}

const CongresCaroussel: React.FC<CongresCarousselProps> = ({
    items,
    onSelectContent
}) => {
    const [events, setEvents] = useState(null)
    const [mainEvents, setMainEvents] = useState<CarouselItem[]>([])
    const [eventSelected, setEventSelected] = useState<string>(null)
    const searchResult = []
    const formatEvents = async () => {
        let evts = {};
        items.forEach(content => {
            if (content.event == null)
                return

            if (evts[content.event]) {
                if (evts[content.event][content.event_edition_year]) {
                    evts[content.event][content.event_edition_year] = [...evts[content.event][content.event_edition_year], content]
                } else {
                    evts[content.event] = {
                        ...evts[content.event],
                        [content.event_edition_year]: [content]
                    }
                }
            } else {
                evts[content.event] = {
                    [content.event_edition_year]: [content]
                }
            }
        });
        return evts
    }

    const getEventCarousels = (): React.ReactNode => {
        let carousels: React.ReactNode[] = []
        for (const [key, value] of Object.entries(events[eventSelected])) {
            carousels.push(<View key={eventSelected + key} style={{
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
                        fontSize: 26,
                        color: '#fff',
                        transform: "rotate(-90deg)",
                    }}>{key}</Text>
                </View>
                <View style={{flex: 1}}>
                    <SimpleCarousel data={value} nbElement2Display={2} onSelect={(content) => {
                        onSelectContent(content)
                    }} />
                </View>
            </View>)
        }
        return <View>
            {carousels}
        </View>
    }

    useEffect(() => {
        formatEvents()
            .then(events => {
                let mEvents: CarouselItem[] = []
                for (const [key, value] of Object.entries(events)) {
                    mEvents.push({
                        key: key,
                        content: <TouchableOpacity style={{
                            backgroundColor: '#203864',
                            width: 100, height: '100%',
                            alignItems: 'center', justifyContent: 'center',
                            padding: 5,
                            borderRadius: 10
                        }}
                            onPress={() => { setEventSelected(key) }}
                        >
                            <Text style={{ color: "#fff", textAlign: 'center' }}>{key}</Text>
                        </TouchableOpacity>
                    })
                }

                setMainEvents(mEvents)
                setEvents(events)
            })
    }, [])

    return (<View>
        <View style={{
            backgroundColor: '#6E7DA6',
            paddingHorizontal: 20, paddingVertical: 10,
            marginVertical: 10,
            flexDirection: 'row',
        }}>
            <TextInput style={{
                backgroundColor: '#fff',
                width: "50%",
                borderRadius: 5,
                padding: 3,
                flex: 1
            }} placeholder="Mot clé."
            clearButtonMode="always"
            />
            <Text style={{color: "#203864", flex: 1, alignSelf: 'center', textAlign: 'center'}}>{searchResult.length} résultats</Text>
        </View>
        {
            eventSelected == null ?
                <SimpleAdaptiveCarousel
                    items={mainEvents}
                    height={70}
                    widthPercent={1}
                    cardSpacing={5}
                />
                : <EventSelectedTag
                    label={eventSelected}
                    onClose={() => setEventSelected(null)}
                />
        }
        {
            eventSelected &&
            getEventCarousels()
        }
    </View>);
}

export default CongresCaroussel;