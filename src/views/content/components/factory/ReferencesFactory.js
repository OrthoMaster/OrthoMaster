import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet
} from "react-native";


export const ReferencesFactory = ({ config }) => {
    const [isTriggered, setIsTriggered] = useState(false)


    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => setIsTriggered(!isTriggered)}
            >
                <Text style={styles.buttonTxt}>Nos références</Text>
                <Image
                    source={require('../../../../../assets/navigation/right-arrow.png')}
                    style={[
                        styles.buttonArrow,
                        isTriggered ? {
                            transform: [
                                { rotateZ: '90deg' }
                            ]
                        } : null
                    ]} />
            </TouchableOpacity>
            {isTriggered ?
                <View style={styles.refBox}>
                    <Text style={styles.refTxt}>{config.value}</Text>
                </View>
                : null
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F1F1F1',
        alignItems: 'center',
        width: '100%'
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%',
        paddingVertical: 10
    },
    buttonTxt: {
        fontSize: 18,
        fontWeight: '600',
    },
    buttonArrow: {
        width: 15,
        height: 15,
    },
    refBox: {
        width: '85%',
        alignItems: 'center',
        marginBottom: 20
    },
    refTxt: {
        textAlign: 'justify'
    }
})