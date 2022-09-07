import React from 'react'
import { StyleSheet, View, Dimensions, Text } from 'react-native';

import buttonFactory from "./ButtonFactory";
import imageFactory from './ImageFactory';
import textFactory from "./TextFactory";
import videoFactory from './VideoFactory';
import linkFactory from './LinkFactory';
import quizzFactory from './quiz/QuizzFactory'

export default function horizontalLayoutFactory(content, contentInfos, index) {
    var componentList = []

    if (content['children']) {
        content['children'].forEach(element => {
            switch (element.name) {
                case 'text':
                    componentList.push(textFactory(element))
                    break;
                case 'button':
                    componentList.push(buttonFactory(element, contentInfos))
                    break;
                case 'image':
                    componentList.push(imageFactory(element, contentInfos))
                    break;
                case 'video':
                    componentList.push(videoFactory(element))
                    break;
            
                case 'quiz':
                    componentList.push(quizzFactory(element))
                    break;
                case 'space':
                    //componentList.push(<View style={{ width: 50}}></View>)
                    break;
                case 'link':
                    componentList.push(linkFactory(element))
                    break;
                default:
                    break;
            }
        });
    }


    return <View style={styles.container} key={index}>
        {componentList.map((elem, index) => {
            return <View key={index} style={styles.element}>{elem}</View>
        })}
    </View>
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#ED7D32',
        width: '100%',

    },
    element: {
        flex: 1,
        alignItems: 'center',
        alignSelf: 'center'

    }
})