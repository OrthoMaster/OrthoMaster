import { View, Text } from "react-native"


export const PointedText = ({
    children,
    style,
    pointColor
}) => {
    return <View style={{
        flexDirection: 'row',
        alignItems: 'center'
    }}>
        <View style={{
            backgroundColor: pointColor ? pointColor : style?.color ? style?.color : "#000",
            width: 5, height: 5,
            marginRight: 10
        }} />
        <Text style={{
            color: style?.color ? style?.color : "#000",
            fontSize: style?.fontSize
        }}>{children}</Text>
    </View>
}
