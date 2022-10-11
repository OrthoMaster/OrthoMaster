import React, { useState, useRef } from 'react'
import {
    Image,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'

import GestureRecognizer from 'react-native-swipe-gestures';
import Device from 'react-native-device-detection';


const BODY_POS_ON_CLOSE = '0%'
const BODY_POS_ON_OPEN = '45%'


// tmaster

const MenuBodyButton = ({ button, onSelect, currentSelected, index }) => {

    return <TouchableOpacity
        style={[styles.menuButton,
        {
            top: button.position.top, left: button.position.left
        }]}
        onPress={() => {
            onSelect(button.category)
        }}
    >
        <View style={
            currentSelected == index
            ? styles.menuButtonShapeSelected
            : styles.menuButtonShape} />
    </TouchableOpacity>
}



export const MenuBody = ({ menuIsOpen, onSwipeReturn, onSelect }) => {

    const [current, setcurrent] = useState(-1)

    const buttons = [
        {
            category: {
                name: 'Cervicales',
                tags: ['cervicale']
            },
            position: {
                top: '11%', left: 'auto'
            }
        },
        {
            category: {
                name: 'Epaule et clavicule',
                tags: ['épaule', 'clavicule']
            },
            position: {
                top: '18%', left: '25%'
            }
        },
        {
            category: {
                name: 'Coude et avant-bras',
                tags: ['coude', 'avant-bras']
            },
            position: {
                top: '35%', left: '13%'
            }
        },
        {
            category: {
                name: 'Poignet',
                tags: ['poignet']
            },
            position: {
                top: '46%', left: '8%'
            }
        },
        {
            category: {
                name: 'Main et doigts',
                tags: ['main', 'doigts', 'pouce']
            },
            position: {
                top: '53%', left: '5%'
            }
        },
        {
            category: {
                name: 'Lombaires',
                tags: ['lombaires']
            },
            position: {
                top: '40%', left: 'auto'
            }
        },
        {
            category: {
                name: 'Genou',
                tags: ['genou']
            },
            position: {
                top: '71%', left: '31%'
            }
        },
        {
            category: {
                name: 'Cheville',
                tags: ['cheville']
            },
            position: {
                top: '89%', left: '32%'
            }
        },
        {
            category: {
                name: 'Pied',
                tags: ['pied']
            },
            position: {
                top: '96%', left: '30%'
            }
        },

    ]

    return (
        <GestureRecognizer
            onSwipe={(direction) => {
                setcurrent(-1)
                onSwipeReturn(direction)
            }}
            style={[styles.menuContainer, { left: menuIsOpen ? BODY_POS_ON_OPEN : BODY_POS_ON_CLOSE }]}>
            <Image
                source={require('../../../../assets/formation/menu.png')}
                style={styles.corpseImg}
            />

            {buttons.map((button, index) => {
                return (
                    <MenuBodyButton
                        button={button}
                        key={index}
                        onSelect={(category) => {
                            onSelect(category)
                            setcurrent(index)
                        }}
                        currentSelected={current}
                        index={index}
                    />
                )
            })}


        </GestureRecognizer>
    )
}

const styles = StyleSheet.create({

    menuContainer: {
        height: '73%',
        width: Device.isTablet ? '40%' : '60%',
        alignItems: 'center',
        marginTop: 10,
    },
    corpseImg: {
        height: '100%',
        width: '100%',
        resizeMode: 'contain',
        position: 'absolute',
    },
    menuButton: {
        width: 40,
        height: 40,
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center'
    },
    menuButtonShape: {
        backgroundColor: '#FF9900',
        height: '100%',
        width: '100%',
        borderRadius: 50,
        opacity: 0.3
    },
    menuButtonShapeSelected: {
        backgroundColor: '#E14900',
        height: '70%',
        width: '70%',
        borderRadius: 50,
        opacity: 1,
        borderWidth: 5,
        borderColor: '#ED8A38',
    }
})