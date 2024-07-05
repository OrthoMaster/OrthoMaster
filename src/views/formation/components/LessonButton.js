import React from 'react'
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
    Image
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


export const LessonButton = ({ lesson, isBlocked, onPress }) => {
    return <TouchableOpacity
        style={[styles.button, {
            backgroundColor: lesson.content.published == true ? '#F1F1F1' : '#FFF9F9'
        }]}
        onPress={() => {
            if (!isBlocked)
                onPress(lesson)
        }}>
        {lesson.status == null
            ? <LessonNotStartedIndicator style={styles.statusIdicator} />
            : lesson.status == 1
                ? <LessonValidateIndicator style={styles.statusIdicator} />
                : <LessonFailureIndicator style={styles.statusIdicator} />}

        <Text style={[styles.text, { color: lesson.content.published == false ? '#9C9C9C' : '#000000' }]}>{lesson.content.title}</Text>
        {
            lesson.content.published == true ?
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
        {
            isBlocked &&
            <View style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                position: 'absolute',
                zIndex: 1,
                height: '100%', width: '100%',
                alignItems: 'center',
                justifyContent: 'center'

            }}>
                <Image
                    source={require('../../../../assets/locker-icon.png')}
                    style={{
                        height: 30, width: 30
                    }}
                />
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
