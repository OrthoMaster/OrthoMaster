import React from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";

export const TextGame = ({
    text,
    speaker
}) => {
    return (<View style={styles.container}>
        <View style={styles.containerText}>
            <Text style={styles.text}>{text}</Text>
        </View>
        {
            speaker ?
            <View style={styles.containerSpeaker}>
            <Text style={styles.speakerName}>{speaker}</Text>
        </View>
        : null
        }
    </View>)
}

const styles = StyleSheet.create({
    container: {
        width: '100%'
    },
    containerSpeaker: {
        backgroundColor: '#E37106',
        alignSelf: 'flex-start',
        position: 'absolute',
        marginHorizontal: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
        top: -10
    },
    speakerName: {
        color: 'white',
        fontWeight: 'bold'
    },
    containerText: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ffffff'
    },
    text: {
        color: 'white',
        textAlign: 'center'
    }
    
})