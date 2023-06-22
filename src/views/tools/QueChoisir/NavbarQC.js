import {Dimensions, SafeAreaView, StyleSheet, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import Svg, {Circle, Line, Text as SvgText} from 'react-native-svg';
import React from 'react';
import CurrentStep from '../../../../assets/queChoisir/help_icon.svg'

export const NavbarQC = ({global, questionIndex}) => {
    const screenHeight = Dimensions.get('screen').height;

    return (
        <LinearGradient
            colors={['#E8764A', '#EC4C70']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Svg height={screenHeight} width={"100%"} style={styles.leftView}>
                <View style={{height: (questionIndex) * (screenHeight / global.length), top: 20, backgroundColor: 'white', width: 1, marginLeft: 12}}/>
                {global.map((step, index) => (
                    <React.Fragment key={index}>
                        <React.Fragment>
                                {/*<Line*/}
                                {/*    x1={'15%'}*/}
                                {/*    y1={(index - 0.5) * (screenHeight / global.length)}*/}
                                {/*    x2={'15%'}*/}
                                {/*    y2={(index + 0.5) * (screenHeight / global.length)}*/}
                                {/*    stroke={index < questionIndex ? 'white' : 'gray'}*/}
                                {/*/>*/}
                                <Circle
                                    cx={'15%'}
                                    cy={index * (screenHeight / global.length) + 15}
                                    r={5}
                                    fill="white"
                                />
                            </React.Fragment>
                        <SvgText
                            x={"30%"}
                            y={index * (screenHeight / global.length) + 20}
                            fill={index === questionIndex ? 'white' : 'gray'}
                            fontSize={12}
                            fontWeight={index === questionIndex ? 'bold' : 'normal'}
                            textAnchor="start"
                        >
                            {'Étape ' + (index + 1) }
                        </SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        borderBottomRightRadius: 16,
        borderTopRightRadius: 16,
        width: '20%',
        height: '100%',
        position: 'absolute'
    },
    leftView: {
        flex: 1,
        marginTop: 30,
    },
})