import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Animated
} from 'react-native';

import { useSelector } from 'react-redux';
import { selectContent } from '../../../../../reducers/contentReducer';

import { getS3Image } from '../../../../../services/S3Service';

const buttonColor = [
    { index: 6, color: '#7D7D7D' },
    { index: 0, color: '#E27979' },
    { index: 1, color: '#FFAF31' },
    { index: 2, color: '#A8D065' },
    { index: 3, color: '#608DCA' },
    { index: 4, color: '#DC8DE2' },
    { index: 5, color: '#4BB6BE' },
]

const QuizFixedBox = ({ item, index }) => {
    const content = useSelector(selectContent)
    const [boxImage, setBoxImage] = useState(null)

    const fetchBoxImage = async () => {
        try {
            let path = content.type + '/' + content.module_num + '/' + content.title + '/' + item.children[0].attributes.src
            if (content.type != 'lesson') {
                path = content.type + '/' + content.title + '/' + item.children[0].attributes.src
            }
            return await getS3Image(path)
        } catch (error) {
            throw error
        }
    }

    useEffect(() => {
        var isMounted = true

        if (item.children.length > 0) {
            fetchBoxImage().then((url) => {
                if (isMounted) {
                    setBoxImage(url)
                }
            })
        }
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <View
            style={[styles.questionListItem, {
                backgroundColor: buttonColor[index + 1].color
            }]}
        >
            {
                item.children.length > 0 ?
                    boxImage ?
                        <Image source={{ uri: boxImage }} style={{
                            resizeMode: 'contain',
                            height: 100,
                            width: '100%',
                        }} />
                        : <ActivityIndicator />
                    : <Text>{item?.value || 'txt'}</Text>
            }
        </View>
    )
}

const QuizAnswerBox = ({ config, onColorChange, quizDone }) => {

    const content = useSelector(selectContent)
    const [boxColorIndex, setBoxColorIndex] = useState(0)
    const [boxImage, setBoxImage] = useState(null)
    const [animation, setAnimation] = useState(new Animated.Value(0));
    const handleAnimation = () => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false
        }).start()
    };
    const boxInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            "#ffffff",
            config.attributes.ref == boxColorIndex ?
                '#92D051'
                :
                '#ff0000'
        ]
    });

    const fetchBoxImage = async () => {
        try {
            let path = content.type + '/' + content.module_num + '/' + content.title + '/' + config.children[0].attributes.src

            if (content.type != 'lesson') {
                path = content.type + '/' + content.title + '/' + config.children[0].attributes.src
            }
            return await getS3Image(path)
        } catch (error) {
            throw error
        }
    }
    const handleClick = () => {
        if (quizDone) {
            return
        }
        if (boxColorIndex == 6) {
            setBoxColorIndex(0)
        } else {
            setBoxColorIndex(boxColorIndex + 1)
        }
    }


    useEffect(() => {
        var isMounted = true

        if (config.children.length > 0) {
            fetchBoxImage().then((url) => {
                if (isMounted) {
                    setBoxImage(url)
                }
            })
        }
        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        onColorChange({ ref: config.attributes.ref, color: buttonColor[boxColorIndex] })
    }, [boxColorIndex])

    useEffect(() => {
        if (quizDone) {
            handleAnimation()
        }

    }, [quizDone])



    return (
        <TouchableOpacity
            style={[styles.questionListItem, {
                backgroundColor: boxColorIndex == 0 ? '#ffffff' : buttonColor[boxColorIndex].color,
                width: (Dimensions.get('window').width / 3 + 10),
            }]}
            onPress={() => handleClick()}
        >
            <Animated.View
                style={[styles.questionListItem, {
                    backgroundColor: quizDone ? boxInterpolation : null,
                    borderColor: buttonColor[boxColorIndex].color,
                    width: '100%'
                    
                }]}
            >
                {
                    config.children.length > 0 ?
                        boxImage ?
                            <Image source={{ uri: boxImage }} style={{
                                resizeMode: 'contain',
                                height: 125,
                                width: '100%',
                            }} />
                            : <ActivityIndicator />
                        : <Text>{config?.value || 'txt'}</Text>
                }
            </Animated.View>
        </TouchableOpacity>
    )
}


export const QuizMatch = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
    const [userResponse, setuserResponse] = useState(null)


    const handleUserAnswer = () => {
        let isOk = true
        for (const [key, value] of Object.entries(userResponse)) {
            if (value.response) {
                if (value.color.index != value.response.color.index) {
                    isOk = false
                    break;
                }
            } else {
                isOk = false
                break
            }
        }
        if (isOk) {
            onSelect(true)
        } else {
            onSelect(false)
        }
    }

    useEffect(() => {
        init()
    }, [])

    const init = () => {
        let newObject = {}
        quizPossibilities.forEach((element, index) => {
            newObject[element.attributes.ref] = {
                color: buttonColor[index + 1],
                response: null
            }
        });
        setuserResponse(newObject)
    }

    const updateResponse = (val) => {
        if (!userResponse)
            return
        const newResponse = Object.keys(userResponse).slice().reduce((result, key) => {
            result[key] = userResponse[key];

            return result;
        }, {});
        newResponse[val.ref].response = val
        setuserResponse(newResponse)
    }

    return (
        <View style={styles.container}>

            <View style={styles.answerContainer}>
                <View style={styles.receivingContainer}>
                    {quizPossibilities.map((item, index) => {
                        return <QuizFixedBox key={index} item={item} isDisable={true} index={index} />
                    })}
                </View>


                <View style={styles.receivingContainer}>
                    {quizAnswer.map((item, index) => <QuizAnswerBox
                        key={index}
                        quizDone={quizDone}
                        config={item}
                        onColorChange={(val) => updateResponse(val)}
                    />)}
                </View>
            </View>


            <TouchableOpacity style={styles.submitButton}
                onPress={() => handleUserAnswer()}
            >
                <Text style={styles.submitButtonText}>Je valide !</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flex: 1
    },
    draxListContainer: {

    },
    receivingZoneContainer: {
        flex: 1
    },
    receivingZone: {
        width: (Dimensions.get('window').width / 3 + 10),
        height: (Dimensions.get('window').width / 4 - 10),
        backgroundColor: '#fffefd',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
        opacity: 0.5
    },


    receivingContainer: {
        marginHorizontal: 20
    },

    questionListItem: {
        flex: 1,
        backgroundColor: '#fffefd',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
        padding: 10
    },
    answerContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    submitButton: {
        borderRadius: 50,
        backgroundColor: '#D5D4D4',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        marginVertical: 20,
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 18,
    }
});