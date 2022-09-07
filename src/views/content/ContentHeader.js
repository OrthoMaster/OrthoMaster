import React from "react";
import {
    View,
    StyleSheet,
    Text,
    Image,
    SafeAreaView,
    TouchableOpacity,
    StatusBar
} from "react-native";

export const ContentHeader = ({title, onReturn}) => {
    return (
        <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
            <View style={styles.header}>
            <TouchableOpacity
            style={styles.backButton}
            onPress={onReturn}
            >
                <Image
                    source={require('../../../assets/navigation/right-arrow.png')}
                    style={styles.backButtonImg}
                />
            </TouchableOpacity>
            <View style={styles.headerTxtBox}>

            <Text style={styles.headerTxt} numberOfLines={1}>{title}</Text>
            </View>

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        width: '100%',
        height: 100,
        alignItems: 'center'
        
    },
    header: {
        width: '95%',
        flexDirection: 'row',
        flex: 1
    },
    backButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    backButtonImg: {
        width: 20,
        height: 20,
        transform: [{ rotateZ: '180deg' }]
    },
    headerTxtBox: {
        flex: 7,
        textAlign: 'center',
        justifyContent: 'center',
    },
    headerTxt: {
        fontWeight: 'bold',
        fontSize: 18
    }
})