import React from 'react'
import { TouchableOpacity, StyleSheet, Text, Image } from 'react-native'

export const HomeHeaderButton = ({ value, icon, color, style, onPress }) => {
    return (
        <TouchableOpacity style={[styles.container, { backgroundColor: color }, style]}
        onPress={()=>onPress()}
        >
            <Image
                style={styles.icons}
                source={icon}
                />
            <Text style={styles.textButton}>
                {value}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 100,
        borderRadius: 12,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 12,
    },
    textButton: {
        fontSize: 12,
        alignSelf: 'center',
        textAlign: 'center',
        marginTop: 5,
        color: "#fff",
        fontWeight: '600',
    },
    icons: {
        resizeMode: 'contain',
        width: 40,
        height: 40,
    }
})