import React, { useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';

const TextSectionOpener = ({ title, text }) => {
    const [isOpen, setIsOpen] = useState(false)

    return <View style={{
        borderTopWidth: 0.4,
        borderColor: '#000'
    }}>
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                height: 40,
                alignItems: 'center'
            }}
            onPress={() => setIsOpen(!isOpen)}
        >
            <Text style={styles.subtitle}>
                {title}
            </Text>
            {
                isOpen ?
                    <AntDesign name="caret-down" size={10} color="#000" />
                    :
                    <AntDesign name="caret-right" size={10} color="#000" />
            }
        </TouchableOpacity>
        {
            isOpen &&
            <View style={{ marginBottom: 10 }}>
                <Text style={styles.paragraphe}>
                    {text}
                </Text>
            </View>
        }
    </View>
}

export default TextSectionOpener;

const styles = StyleSheet.create({
    subtitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: "#000"
    },
    paragraphe: {
        fontSize: 12,
        color: '#000'
    },
    sectionContainer: {
        marginVertical: 10
    }
})