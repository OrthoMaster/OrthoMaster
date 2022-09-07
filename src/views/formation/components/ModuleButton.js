import React, { useState, useEffect } from 'react'
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions
} from 'react-native'

import { getS3Image } from '../../../services/S3Service'

import {
    ModuleProgress,
    MODULE_NOT_STARTED,
    MODULE_STARTED,
    MODULE_FINISHED
} from './ModuleProgress';


export const ModuleButton = ({ item, onPress }) => {
    const [logo, setLogo] = useState(null)
    const [isActivate, setIsActivate] = useState(false)

    useEffect(() => {
      if (item.item.lesson_succeed > 0) {
        setIsActivate(true)
      }
    }, [item.item.lesson_succeed])
    

    useEffect(() => {
        var isDisplayed = true
        if (item.item) {
            fetchLogo(item).then(value => {
                if (isDisplayed) {
                    setLogo(value)
                }
            })
        }

        return () => {
            isDisplayed = false
        }

    }, [isActivate])
    

    const fetchLogo = async (item) => {
        let path
        if (item.item.lesson_succeed > 0) {
            path = 'lesson/' + item.item.module.module_num + '/logo.png'
        } else {
            path = 'lesson/' + item.item.module.module_num + '/logo_not_started.png'
        }

        try {
            const imageUrl = await getS3Image(path)
            return imageUrl
        } catch (error) {
            console.error('ImageFactory: ' + error);
        }
    }

    return (
        <TouchableOpacity
            style={[styles.button, { alignSelf: (item.index % 2) == 0 ? 'flex-start' : 'flex-end' }]}
            onPress={() => onPress(item.item)}
            key={item.item.module.module_num}
        >

            <ModuleProgress
                color={item.item.module.theme_color}
                moduleImg={logo}
                nbLesson={item.item.total_lesson}
                nbLessonValidate={item.item.lesson_succeed}
                moduleState={
                    item.item.lesson_succeed == 0
                        ? MODULE_NOT_STARTED
                        : item.item.lesson_succeed == item.item.total_lesson
                            ? MODULE_FINISHED
                            : MODULE_STARTED
                }
            />
            <Text style={[styles.moduleTitle, {color: item.item.lesson_succeed == 0 ? "#828392" : "#000000"}]}>{item.item.module.title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        width: Dimensions.get('screen').width / 2.5 - 10,
        alignItems: 'center',
        alignSelf: 'flex-end'
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        width: '80%'
    }
})