import React, { useEffect, useState } from "react";

import { StyleSheet, View, Text } from 'react-native';

import buttonFactory from './factory/ButtonFactory';
import { ImageFactory } from './factory/ImageFactory';
import { TextFactory } from './factory/TextFactory';
import { VideoFactory } from './factory/video/VideoFactory';
import { LinkFactory } from './factory/LinkFactory';
import { QuizFactory } from './factory/quiz/QuizzFactory'
import { ReferencesFactory } from "./factory/ReferencesFactory";

import { handleColor } from "./factory/stylesXml";

var staticLessonIndex = 0

const buildContent = (content, contentInfos) => {
    var displayContent = []
    if (content.name && content.name == 'layout') {
        var layoutStyle = {
            backgroundColor: "#ffffff",
            flexDirection: 'column',
            alignSelf: 'center',
            width: '100%',
            paddingVertical: 20,
        }
        if (content.attributes) {
            if (content.attributes['direction'])
                layoutStyle.flexDirection = content.attributes['direction']
            if (content.attributes['background-color'])
                layoutStyle.backgroundColor = handleColor(content.attributes['background-color'])
            if (content.attributes['width'])
                layoutStyle.width = content.attributes['width'].includes('%') ? content.attributes['width'] : parseInt(content.attributes['width'])
            if (content.attributes['align-self'])
                layoutStyle.alignSelf = content.attributes['align-self']


        }
        displayContent.push(<View key={staticLessonIndex} style={layoutStyle}>{buildContent(content.children, contentInfos)}</View>)

    } else {
        if (Array.isArray(content)) {
            content.forEach((element) => {
                switch (element.name) {
                    case 'text':
                        displayContent.push(<TextFactory content={element} key={staticLessonIndex} />)
                        break;
                    case 'button':
                        //displayContent.push(buttonFactory(element, contentInfos, index))
                        break;
                    case 'image':
                        displayContent.push(<ImageFactory config={element} key={staticLessonIndex} contentInfos={contentInfos} />)
                        break;
                    case 'video':
                        displayContent.push(<VideoFactory video={element} key={staticLessonIndex} contentInfos={contentInfos}/>)
                        break;

                    case 'layout':
                        displayContent.push(buildContent(element, contentInfos))
                        break;
                    case 'quiz':
                        displayContent.push(<QuizFactory content={element} key={staticLessonIndex} />)
                        break;
                    case 'space':
                        displayContent.push(<View style={{ width: '100%', height: element.attributes.size ? parseInt(element.attributes.size) : 10 }}
                            key={staticLessonIndex}
                        />)
                        break;
                    case 'link':
                        displayContent.push(<LinkFactory config={element} key={staticLessonIndex} />)
                        break;
                    case 'references':
                        displayContent.push(<ReferencesFactory config={element} key={staticLessonIndex} />)
                        break;
                    default:
                        break;
                }
                staticLessonIndex++
            });
        }
    }
    return displayContent
}
export const ContentFactory = ({ component, contentInfos }) => {

    if (!component || component === 'undefined') return <Text>Nous rencontrons un problème...</Text>
    return buildContent(component, contentInfos)
}

const styles = StyleSheet.create({
    container: {
        width: '100%',

    }
})
