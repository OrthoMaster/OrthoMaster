import React from 'react'
import { TouchableOpacity, StyleSheet, Text, Image } from 'react-native'

export const HomeHeaderButton = ({ value, icon, color, style, onPress }) => {
    return (
        <TouchableOpacity style={[styles.container, { borderColor: color }, style]}
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
        backgroundColor: '#fff',
        width: 100,
        height: 100,
        borderRadius: 16,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textButton: {
        fontSize: 14,
        alignSelf: 'center',
        textAlign: 'center',
        marginHorizontal: 5
    },
    icons: {
        resizeMode: 'contain',
        width: 50,
        height: 50
    }
})