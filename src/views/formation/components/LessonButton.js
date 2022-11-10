import React from 'react'
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View
} from 'react-native'

import Svg, { Path } from 'react-native-svg'


const LessonValidateIndicator = () => {
    return <View style={[styles.statusIdicator, { backgroundColor: '#28E000' }]} />
}

const LessonNotStartedIndicator = () => {
    return <View style={[styles.statusIdicator, { backgroundColor: 'grey' }]} />
}

const LessonFailureIndicator = () => {
    return <View style={[styles.statusIdicator, { backgroundColor: '#E75A09' }]} />
}


export const LessonButton = ({ item, onPress }) => {
    return <TouchableOpacity
        style={[styles.button, {
            backgroundColor: item.item.content.published == true ?'#F1F1F1' : '#FFF9F9'
        }]}
        onPress={onPress}>
        {item.item.status == null
            ? <LessonNotStartedIndicator style={styles.statusIdicator} />
            : item.item.status == 1
                ? <LessonValidateIndicator style={styles.statusIdicator} />
                : <LessonFailureIndicator style={styles.statusIdicator} />}

        <Text style={[styles.text, {color: item.item.content.published == false ? '#9C9C9C': '#000000'}]}>{item.item.content.title}</Text>
        {
            item.item.content.published == true ?
            <Svg
            width={20}
            height={20}
            viewBox={`0 0 50 50`}
            style={styles.rightArrow}
        >
            <Path stroke='#000000' strokeWidth={5} strokeLinecap='round' strokeLinejoin='round' d='M20 10 L35 25 L20 40' />
        </Svg>
        : <View style={{
            backgroundColor: '#F76F10',
            padding: 5,
            marginHorizontal: 10,
            borderRadius: 5
        }}>
            <Text style={{
                fontSize: 10,
                color: '#ffffff',
                fontWeight: 'bold'
            }}>
                Bientôt disponible
                </Text>
            </View>
    }
    </TouchableOpacity>
}

const styles = StyleSheet.create({
    button: {
        marginVertical: 5,
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
        borderRadius: 40

    },
    text: {
        textAlign: 'center',
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        marginLeft: '5%'
    },
    statusIdicator: {
        width: 10,
        height: 10,
        borderRadius: 50,
        marginLeft: '5%'
    },
    rightArrow: {
        marginRight: '5%'
    }
})
