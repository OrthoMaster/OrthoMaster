import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    circleGradient: {
        backgroundColor: "white",
        borderRadius: 7,
        width: '98%',
        minHeight: 80,
        justifyContent:'center',
        alignSelf: 'center',
        margin: 1
    },
    buttonPressed: {
        marginVertical: 5,
        minHeight: 80,
        width: '47%',
        borderRadius: 8
    },
    buttonTextQ: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        width: '70%',
        alignSelf: 'center'
    },
    responseAlign: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
})