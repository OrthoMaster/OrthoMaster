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
        borderRadius: 16,
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    textButton: {
        fontSize: 12,
        alignSelf: 'center',
        textAlign: 'center',
        marginHorizontal: 5,
        color: "#fff",
        fontWeight: 'bold'
    },
    icons: {
        resizeMode: 'contain',
        width: 50,
        height: 50,
        borderRadius: 5
    }
})