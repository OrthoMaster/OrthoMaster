import React, { useState, useEffect, memo } from 'react'
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    View,
    Image
} from 'react-native'
import { useQuery } from "react-query";
import { getS3Image } from '../../../services/S3Service'

import ModuleProgress, {
    MODULE_NOT_STARTED,
    MODULE_STARTED,
    MODULE_FINISHED
} from './ModuleProgress';

const ModuleButton = ({ module, index, onPress, isBlocked }) => {
    
    const imgUrl = useQuery(
        ['Formation', 'GET', "contentImage", module.module.logo_path],
        () => getS3Image(module.module.logo_path + '/logo.png'))

    return (
        <TouchableOpacity
            style={[styles.button, { alignSelf: (index % 2) == 0 ? 'flex-start' : 'flex-end' }]}
            onPress={() => {if (!isBlocked) onPress(module)}}
            key={module.module.module_num}
        >

            <ModuleProgress
                color={module.module.theme_color}
                moduleImg={imgUrl.data}
                nbLesson={module.total_lesson}
                nbLessonValidate={module.lesson_succeed}
                moduleState={
                    module.lesson_succeed == 0
                        ? MODULE_NOT_STARTED
                        : module.lesson_succeed == module.total_lesson
                            ? MODULE_FINISHED
                            : MODULE_STARTED
                }
            />
            <Text style={[styles.moduleTitle, { color: module.lesson_succeed == 0 ? "#828392" : "#000000" }]}>{module.module.title}</Text>
            {
                isBlocked &&
                <View style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    position: 'absolute',
                    zIndex: 1,
                    height: '100%', width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center'

                }}>
                    <Image
                        source={require('../../../../assets/locker-icon.png')}
                        style={{
                            height: 50, width: 50
                        }}
                    />
                </View>
            }
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        width: Dimensions.get('screen').width / 2.5 - 10,
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    }
})
const arePropsEqual = (prevProps, nextProps) => {
    return prevProps.module.lesson_succeed === nextProps.module.lesson_succeed;
}

export default memo(ModuleButton, arePropsEqual);