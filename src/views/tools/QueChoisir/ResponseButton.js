import {useEffect, useState} from "react";
import {evaluateExpression} from "./tools";
import {Text, TouchableOpacity, View} from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import {styles} from "../../../../styles/buttonStyles";
import {LinearGradient} from "expo-linear-gradient";

export const ResponseButton = ({ element, onPress, history, onHelp }) => {
    const [pressed, setPressed] = useState(false)
    const [isDisplay, setIsDisplay] = useState(true)
    const ButtonContent = () => {
        return (
            <View style={styles.responseAlign}>
                <Text style={styles.buttonTextQ}>{element.response}</Text>
                {
                    element.help_text &&
                    <TouchableOpacity onPress={()=>onHelp()}>
                        <HelpIcon height={30} width={30}/>
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
    }, [])

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
        style={[styles.buttonPressed, {shadowColor: 'black',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 5, backgroundColor:'white'}]}
    >
        {pressed ? <LinearGradient
                colors={['#E8764A', '#EC4C70']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{borderRadius: 8}}
            >
                <View style={[styles.circleGradient]}>
                    <ButtonContent/>
                </View>
            </LinearGradient>
            : <View style={[styles.circleGradient]}>
                <ButtonContent/>
            </View>
        }
    </TouchableOpacity>)
}