import { useEffect, useState } from "react";
import { evaluateExpression } from "./tools";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import { LinearGradient } from "expo-linear-gradient";

export const ResponseButton = ({ element, onPress, history, onHelp, currentStepHistory }) => {
    const [pressed, setPressed] = useState(false)
    const [isDisplay, setIsDisplay] = useState(true)
    const ButtonContent = () => {
        return (
            <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                padding: 5,
                flex: 1,
            }}>
                <Text style={{
                    textAlign: 'center',
                    alignSelf: 'center'
                }}>{element.response.trim()}</Text>
                {
                    (element.help_text || element.help_img) &&
                    <TouchableOpacity style={{ position: 'absolute', top: 3, right:3 }} onPress={() => onHelp()}>
                        <HelpIcon height={20} width={20} />
                    </TouchableOpacity>
                }
                
            </View>
        )
    }
    useEffect(() => {
        if (element.display_if) {
            evaluateExpression(element.display_if, history)
                .then((val) => {
                    setIsDisplay(val)

                })
        }

        // currentStepHistory?.forEach(response => {
        //     if (response.response.value == element.value) {
        //         setPressed(true)
        //     }
        // });
    }, [])

    useEffect(() => {
        if (currentStepHistory) {
            if (currentStepHistory.some(elem => elem.response.value == element.value)) {
                setPressed(true)
            } else {
                setPressed(false)
            }
        }
    }, [currentStepHistory])


    if (!isDisplay) return null

    return (<TouchableOpacity
        key={element.id}
        onPress={() => {
            onPress({
                response: element,
                status: !pressed
            });
            setPressed(!pressed);
        }}
        style={[styles.container, {
            shadowColor: 'black',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 5, backgroundColor: 'white'
        }]}
    >
        {pressed ? <LinearGradient
            colors={['#E8764A', '#EC4C70']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8 }}
        >
            <View style={[styles.circleGradient]}>
                <ButtonContent />
            </View>
        </LinearGradient>
            : <View style={[styles.circleGradient]}>
                <ButtonContent />
            </View>
        }
    </TouchableOpacity>)
}

const styles = StyleSheet.create({
    container: {
        width: '45%',
        borderRadius: 7,
        marginVertical: 5,
    },
    circleGradient: {
        backgroundColor: "white",
        borderRadius: 7,
        width: '98%',
        minHeight: 80,
        justifyContent: 'center',
        alignSelf: 'center',
        margin: 1
    },
})