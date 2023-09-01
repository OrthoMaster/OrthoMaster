import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, memo, useState, useMemo } from 'react';
import DashedLine from 'react-native-dashed-line';

export const NavbarQC = memo(({ global, questionIndex, onPress }) => {

    return (
        <View style={[styles.container, {justifyContent: 'center'}]}>
            <View style={{ height: '90%', alignItems: 'center', justifyContent: 'space-between' }}>
                <DashedLine axis="vertical" dashLength={10} dashThickness={3}  dashColor="#DADADA" style={[styles.verticalLineDotted]} />
                <View style={[styles.verticalLine, { height: `${(100 * questionIndex) / (global.length - 1)}%` }]} />
                {global.map((item, index) => (
                    <View style={[{
                        width: index == questionIndex ? 40 : 30,
                        height: index == questionIndex ? 40 : 30,
                        backgroundColor: index == questionIndex ? '#EC4E6E' : index < questionIndex ? '#EC4E6E' : '#BDBDBD',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 50
                    }]} key={index}>
                        <View style={{
                            height: '70%',
                            width: '70%',
                            backgroundColor: '#ffffff',
                            borderRadius: 50,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                color: index == questionIndex ? '#EC4E6E' : index < questionIndex ? '#000000' : '#BDBDBD',
                                fontWeight: 'bold',
                                fontSize: index == questionIndex ? 18 : 13 
                                }}>{index + 1}</Text>

                        </View>
                    </View>
                ))}
            </View>

                <StatusBar barStyle={'dark-content'}/>
        </View>
    );
});

const styles = StyleSheet.create({
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    container: {
        width: '12%',
        height: '100%',
        position: 'absolute',
        backgroundColor: '#E99A6E',
    },
    verticalLine: {
        width: 10,
        borderWidth: 3,
        borderColor: '#EC4E6E',
        backgroundColor: '#ffffff',
        position: 'absolute',
    },
    verticalLineDotted: {
        position: 'absolute',
        height: '100%',
    },
    verticalWrap: {
        height: '90%',
    },
    itemWrap: {
        width: Dimensions.get('screen').width * 0.03,
        height: Dimensions.get('screen').width * 0.03,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentMarkerFullWidth: {
        fontWeight: 600,
    },
    currentMarkerMinWidth: {
        fontSize: 5,
        fontWeight: 600,
    },
});

export default NavbarQC;


