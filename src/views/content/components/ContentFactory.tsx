import React, { useEffect, useState, useCallback, useMemo } from "react";

import { View, Text } from 'react-native';
import { ImageFactory } from './factory/ImageFactory';
import { TextFactory } from './factory/TextFactory';
import { VideoFactory } from './factory/video/VideoFactory';
import { LinkFactory } from './factory/LinkFactory';
import { QuizFactory } from './factory/quiz/QuizzFactory'
import { ReferencesFactory } from "./factory/ReferencesFactory";

import { handleColor } from "./factory/stylesXml";

import { ImageLessonContent } from '../../training/components/ImageLessonContent';
import Colors from "../../../../constants/Colors";

import { VideoPlayer } from '../../media/components/VideoPlayer';

var staticLessonIndex = 0
export const ContentFactory = ({ component, contentInfos, onQuizCompleted = null }) => {
    const [quizStates, setQuizStates] = useState({});
    const [totalQuiz, setTotalQuiz] = useState(0);

    useEffect(() => {
        const countQuiz = (content) => {
            let count = 0;
            if (content && content.name === 'layout' && content.children) {
                count += countQuiz(content.children);
            }
            else if (Array.isArray(content)) {
                content.forEach(element => {
                    if (element.name === 'quiz') {
                        count++;
                    } else if (element.name === 'layout' && element.children) {
                        count += countQuiz(element.children);
                    }
                });
            }
            return count;
        };

        setTotalQuiz(countQuiz(component));
    }, [component]);

    useEffect(() => {
        const completedQuiz = Object.values(quizStates).filter(status => status === true).length;

        if (totalQuiz > 0 && completedQuiz === totalQuiz) {
            onQuizCompleted();
        }
    }, [quizStates, totalQuiz]);

    const handleQuizCompleted = useCallback((quizId, status) => {
        setQuizStates(prev => ({
            ...prev,
            [quizId]: status
        }));
    }, []);

    // Build content from xml
    const buildContent = (content, contentInfos) => {
        var displayContent = []
        if (content.name && content.name == 'layout') {
            var layoutStyle = {
                backgroundColor: Colors.white,
                flexDirection: 'column',
                alignSelf: 'center',
                width: '100%',
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
                        case 'image':
                            if (element.attributes['s3']) {
                                displayContent.push(<ImageLessonContent url={element.attributes['s3']} config={element} key={staticLessonIndex} />)
                            } else {
                                displayContent.push(<ImageFactory config={element} key={staticLessonIndex} contentInfos={contentInfos} />)
                            }
                            break;
                        case 'video':
                            if (element.attributes['code']) {
                                // Hls video
                                displayContent.push(<VideoPlayer key={staticLessonIndex} videoCode={element.attributes['code']} />)
                            } else {
                                displayContent.push(<VideoFactory video={element} key={staticLessonIndex} contentInfos={contentInfos} />)
                            }

                            break;
                        case 'layout':
                            displayContent.push(buildContent(element, contentInfos))
                            break;
                        case 'quiz':
                            const quizId = `quiz_${staticLessonIndex}`;
                            displayContent.push(
                                <QuizFactory
                                    content={element}
                                    key={staticLessonIndex}
                                    quizId={quizId}
                                    onQuizCompleted={handleQuizCompleted}
                                    isLast={element.attributes['isLast'] ?? false}
                                />)
                            break;
                        case 'space':
                            displayContent.push(<View style={{ width: '100%', height: element.attributes.size ? parseInt(element.attributes.size) : 5 }}
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

    // Render layout
    const contentElements = useMemo(() => {
        staticLessonIndex = 0; // Reset index
        return buildContent(component, contentInfos);
    }, [component, contentInfos]);


    if (!component || component === 'undefined') return
    <Text>Nous rencontrons un problème...</Text>
    return <>{contentElements}</>
}
