import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import {useEffect, useState} from "react";
import {evaluateExpression} from "./tools";

export const ResponseButton = ({ element, onPress, history, onHelp }) => {
    const [pressed, setPressed] = useState(false)
    const [isDisplay, setIsDisplay] = useState(true)

    useEffect(() => {
        if (element.display_if) {
            evaluateExpression(element.display_if, history)
                .then((val) => {
                    setIsDisplay(val)

                })
        }
    }, [])

    if (!isDisplay) return null
    if (!element.help_text) {
        return (
            <TouchableOpacity
                key={element.id}
                style={[styles.rectangleButton, { borderColor: pressed ? 'orange' : 'black'}]}
                onPress={() => {
                    onPress({
                        response: element,
                        status: !pressed
                    });
                    setPressed(!pressed);
                }}
            >
                <Text style={styles.buttonTextQ}>{element.response}</Text>
            </TouchableOpacity>
        )
    } else {
        return (
            <TouchableOpacity
                key={element.id}
                style={[styles.rectangleButton, { borderColor: pressed ? 'orange' : 'black'}]}
                onPress={() => {
                    onPress({
                        response: element,
                        status: !pressed
                    });
                    setPressed(!pressed);
                }}
            >
                <View style={styles.responseAlign}>
                    <Text style={styles.buttonTextQ}>{element.response}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            onHelp()
                        }}
                    >
                        <HelpIcon height={30} width={30}/>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    rectangleButton: {
        borderRadius: 8,
        marginVertical: 5,
        minHeight: 80,
        width: '47%',
        justifyContent:'center',
        borderWidth: 1,
    },
    responseAlign: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    buttonTextQ: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        width: '70%',
        alignSelf: 'center'
    },
})