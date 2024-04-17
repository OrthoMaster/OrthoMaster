import React, { useState } from "react";
import {
    Text,
    View,
    TouchableOpacity
} from "react-native";
import AppModal from "../../../component/AppModal";
import { FontAwesome5 } from '@expo/vector-icons';

const SectionDrawer = ({ help }) => {
    const [isVisible, setIsVisible] = useState(false)
    return <View style={{ width: '100%' }}>
        <TouchableOpacity
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
            onPress={() => setIsVisible(!isVisible)}
        >
            <Text style={{ fontWeight: 'bold' }}>{help.title}</Text>
            <FontAwesome5 name={isVisible ? "caret-down" : "caret-right"} size={24} color="black" />
        </TouchableOpacity>
        {
            isVisible &&
            <Text>
                {help.text}
            </Text>
        }
        <View style={{
            width: '100%',
            height: 0.5,
            backgroundColor: '#000',
            marginTop: 5
        }} />
    </View>
}

export const HelpModal = ({
    isVisible,
    onClose,
    helpToDisplay
}) => {
    return <AppModal
        isVisible={isVisible}
        onClose={onClose}
        style={{ width: "80%" }}
        customRender={
            <View style={{
                display: 'flex',
                width: '90%'
            }}>
                <Text style={{ fontWeight: 'bold', alignSelf: 'center', fontSize: 18, marginBottom: 20 }}>Aides</Text>

                {
                    helpToDisplay.map((value, index) => {
                        if (typeof value == "object") {
                            return <SectionDrawer help={value} key={index} />
                        } else if (typeof value == "string") {
                            return <Text key={index}>{value}</Text>
                        } else {
                            return
                        }
                    })
                }
            </View>
        }
    />
}