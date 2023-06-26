import {Animated, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import React from 'react';
import CurrentStep from '../../../../assets/queChoisir/current_roadmap.svg'
import CheckStep from '../../../../assets/queChoisir/check_road_map.svg'
import RoadMapStep from '../../../../assets/queChoisir/roadmap_point.svg'
import {useState} from "react";
import DashedLine from "react-native-dashed-line";

export const NavbarQC = ({global, questionIndex, onPress}) => {
    const [totalWidth, setTotalWidth] = useState(20)
    const [scaleAnim] = useState(new Animated.Value(45))  // Initial value for scale: 0

    React.useEffect(() => {
        Animated.spring(
            scaleAnim,
            {
                toValue: totalWidth === 20 ? 45 : 20,
                friction: 3,
                useNativeDriver: true,
                delay: 3000,
                velocity: 2,
            }
        ).start();
    }, [totalWidth])

    const getRightStep = (index) => {
        if (index === questionIndex) {
            return <CurrentStep width={40} height={'100%'} style={{marginLeft: totalWidth === 20 ? '-9%' : '2%'}}/>
        } else if (index < questionIndex) {
            return <CheckStep width={20} height={'100%'} style={{marginLeft: totalWidth === 20 ? '2%' : '6%'}}/>
        } else {
            return <RoadMapStep width={17} height={'100%'} style={{marginLeft: totalWidth === 20 ? '2%' : '7%'}}/>
        }
    }

    return (
        <Animated.View style={[styles.container, {width: totalWidth + '%', shadowColor: '#EC4C70',
            shadowOffset: { width: 10, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 5, transform: [{scale: totalWidth === 20 ? totalWidth / 20 : totalWidth / 45}]}]}>
        <TouchableOpacity onPress={() => {
            if (totalWidth === 20) {
                setTotalWidth(45)
            } else {
                setTotalWidth(20);
            }
        }}>
            <LinearGradient
                colors={['#E8764A', '#EC4C70']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{borderBottomRightRadius: 16,
                    borderTopRightRadius: 16, paddingVertical: 10}}
            >
                <View>
                    <DashedLine axis='vertical' dashLength={6} dashThickness={2} dashGap={5} dashColor='#DADADA'
                                style={[styles.verticalLineDotted, {top: (95 * (questionIndex) / (global.length - 1)) + '%', bottom: '4%'}]}/>
                    <View style={[styles.verticalLine, {height: (95 * (questionIndex) / (global.length - 1)) + '%', marginTop: totalWidth === 20 ? '12%' : '5%'}]}/>
                    <View style={styles.verticalWrap}>
                        {global.map((item, index) => (
                            <View style={[styles.itemWrap, {height: '5%'} ]} key={index}>
                                {getRightStep(index)}
                                <View style={{flexDirection: 'column', height: '100%'}}>
                                    <TouchableOpacity style={{ marginLeft: '5%', width: '100%' }} onPress={() => {
                                        if (index < questionIndex)
                                            onPress(index);
                                    }}>
                                        <Text style={[questionIndex === index ? (totalWidth === 45 ? styles.currentMarkerFullWidth : styles.currentMarkerMinWidth) : {marginTop: '20%', marginLeft: '5%'}, {fontSize: 12, color: '#F1F5F9'}]}>
                                            {'Étape ' + (index + 1)}
                                        </Text>
                                    </TouchableOpacity>
                                    {(questionIndex === index && totalWidth === 45 ) &&
                                        <View>
                                            <Text style={{fontSize: 12, color: '#F1F5F9', marginLeft: '-4%', maxWidth: '90%', paddingRight: '5%'}}>
                                                Lorem Ipsum lorem pisavim lorem pisavim. deigfiush oi eljfpomejzfomkseôf kesôfksepojkjfpo sejfopesjfoesjfposejfpoesjfpoesjf
                                            </Text>
                                        </View>
                                    }
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderBottomRightRadius: 48,
        borderTopRightRadius: 32,
        height: '100%',
        position: 'absolute',
    },
    verticalLine: {
        alignSelf: 'flex-start',
        width: 5,
        position: 'absolute',
        left: '10%',
        borderWidth: 1,
        borderColor: 'white',
    },
    verticalLineDotted: {
        alignSelf: 'flex-start',
        position: 'absolute',
        left: '11%',
        marginTop: '4.5%',
    },
    verticalWrap: {
        justifyContent: 'space-between',
        height: '100%',
    },
    itemWrap: {
        width: "100%",
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentMarkerFullWidth: {
        marginLeft: '-10%',
        marginTop: '2%',
        fontWeight: 600
    },
    currentMarkerMinWidth: {
        marginLeft: '-30%',
        marginTop: '10%',
        width: '200%',
        fontSize: 5,
        fontWeight: 600
    },
})