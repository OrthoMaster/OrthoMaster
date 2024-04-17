import React from "react"
import {
    View,
    SafeAreaView,
    TouchableOpacity,
    Text
} from "react-native"

import { QueChoisirMenu } from "./QueChoisir/QueChoisirMenu"

export const ToolsView = ({
    navigation
}) =>{
    
    return <SafeAreaView style={{display: "flex", alignItems: 'center', justifyContent: 'center', flex: 1}}>
        <QueChoisirMenu navigation={navigation}/>
    </SafeAreaView>
}