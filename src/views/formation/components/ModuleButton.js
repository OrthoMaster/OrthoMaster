import React, { useState, useEffect, memo } from 'react'
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions
} from 'react-native'
import { useQuery } from 'react-query';
import { getS3Image } from '../../../services/S3Service'

import ModuleProgress, {
    MODULE_NOT_STARTED,
    MODULE_STARTED,
    MODULE_FINISHED
} from './ModuleProgress';

const ModuleButton = ({ item, onPress }) => {

    const imgUrl = useQuery(
        ["getContentImage", item.item.module.module_order, item.item.lesson_succeed ],
        ()=>getS3Image('lesson/' + item.item.module.module_num + (item.item.lesson_succeed > 0 ? '/logo.png': '/logo_not_started.png')))

    return (
        <TouchableOpacity
            style={[styles.button, { alignSelf: (item.index % 2) == 0 ? 'flex-start' : 'flex-end' }]}
            onPress={() => onPress(item.item)}
            key={item.item.module.module_num}
        >

            <ModuleProgress
                color={item.item.module.theme_color}
                moduleImg={imgUrl.data}
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
const arePropsEqual = (prevProps, nextProps) => {
    return prevProps.item.item.lesson_succeed === nextProps.item.item.lesson_succeed; 
  }

export default memo(ModuleButton, arePropsEqual);