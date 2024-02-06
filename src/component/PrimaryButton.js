
import { Text, TouchableOpacity } from "react-native"

export const PrimaryButton = ({
    text,
    onPress,
    containerStyle,
    textStyle
}) => {
    return <TouchableOpacity style={[{
        backgroundColor: '#EB7B0F',
        paddingVertical: 10, paddingHorizontal: 20,
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
        shadowOpacity: 0.4,
        shadowOffset: {
            width: 2,
            height: 2
        },
    },containerStyle]}
    onPress={onPress}>
        <Text style={[{
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center'
        },textStyle]}>
            {text}
        </Text>
    </TouchableOpacity>
}