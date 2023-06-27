import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from 'react';
import CurrentStep from '../../../../assets/queChoisir/current_roadmap.svg'
import CheckStep from '../../../../assets/queChoisir/check_road_map.svg'
import RoadMapStep from '../../../../assets/queChoisir/roadmap_point.svg'
import { useState } from "react";
import DashedLine from "react-native-dashed-line";

export const NavbarQC = ({ global, questionIndex, onPress }) => {
   // const [totalWidth, setTotalWidth] = useState(20)  //is navbar open ?
    const [scaleAnim] = useState(new Animated.Value(45))  // Initial value for scale: 0

    // React.useEffect(() => {
    //     Animated.spring(
    //         scaleAnim,
    //         {
    //             toValue: totalWidth === 20 ? 45 : 20,
    //             friction: 3,
    //             useNativeDriver: true,
    //             delay: 3000,
    //             velocity: 2,
    //         }
    //     ).start();
    // }, [totalWidth])

    const NavBarIcon = ({index}) => {
        if (index === questionIndex) {
            return <CurrentStep  width={'100%'} height={'100%'} />
        } else if (index < questionIndex) {
            return <CheckStep  width={'100%'} height={'100%'} />
        } else {
            return <RoadMapStep width={'100%'} height={'100%'} />
        }
    }

    return (
        <Animated.View style={[styles.container, {
            //width: totalWidth + '%', shadowColor: '#EC4C70',
            shadowOffset: { width: 15, height: 15 },
            shadowOpacity: 0.4,
            shadowRadius: 5, 
        }]}>
            <TouchableOpacity onPress={() => {
                // if (totalWidth === 20) {
                //     setTotalWidth(45)
                // } else {
                //     setTotalWidth(20);
                // }
                
            }}>
                <LinearGradient
                    colors={['#E8764A', '#EC4C70']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    // style={{ borderBottomRightRadius: 50, borderTopRightRadius: 50}}
                >
                    <View style={{ flexDirection: 'row', height:'100%', alignItems: 'center'}}>

                        <View style={{height: '90%', width: '5%', alignItems: 'center', backgroundColor: 'green'}}>
                            <DashedLine axis="vertical" dashLength={6} dashThickness={2} dashGap={5} dashColor='#DADADA'
                                style={[styles.verticalLineDotted, {height: '100%'}]} />
                            <View style={[styles.verticalLine, { height: (100 * (questionIndex) / (global.length - 1)) + '%' }]} />
                            {global.map((item, index) => (
                                <View style={[styles.itemWrap, { top: (100 * (index) / (global.length - 1)) + '%'}]} key={index}>
                                    <NavBarIcon index={index}/>
                                </View>
                            ))}
                        </View>



                        {/* <View style={styles.verticalWrap}>
                            {global.map((item, index) => (
                                <View key={index} style={{
                                    top: (100 * (index) / (global.length - 1)) + '%',
                                    position: 'absolute',
                                    }}>
                                <TouchableOpacity style={{}} onPress={() => {
                                    if (index < questionIndex)
                                        onPress(index);
                                }}>
                                    <Text style={[{ fontSize: 12, color: '#F1F5F9' }]}>
                                        {'Étape ' + (index + 1)}
                                    </Text>
                                </TouchableOpacity>
                                {(questionIndex === index && totalWidth === 45) &&
                                    <View>
                                        <Text style={{ fontSize: 12, color: '#F1F5F9' }}>
                                            Tesxt de ma question 
                                        </Text>
                                    </View>
                                }
                            </View>
                            ))}
                        </View> */}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        position: 'absolute',
        borderBottomRightRadius: 50,
        borderTopRightRadius: 50,
    },
    verticalLine: {
        width: 5,
        borderWidth: 1,
        borderColor: 'white',
        position: 'absolute',
        backgroundColor: 'red'
    },
    verticalLineDotted: {
        height: '100%',
    },
    verticalWrap: {
        height: '90%',
        backgroundColor: 'blue',
    },
    itemWrap: {
        position: 'absolute',
        width: Dimensions.get('screen').width*0.03,
        height: Dimensions.get('screen').width*0.03,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentMarkerFullWidth: {
        fontWeight: 600
    },
    currentMarkerMinWidth: {
        fontSize: 5,
        fontWeight: 600
    }
})