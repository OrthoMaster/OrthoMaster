import {Dimensions, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, {useCallback, memo, useState, useMemo} from 'react';
import DashedLine from 'react-native-dashed-line';

export const NavbarQC = memo(({ global, questionIndex, onPress }) => {
    const [totalWidth, setTotalWidth] = useState(20)  // Is navbar open?

    const NavBarIcon = useMemo(() => {
        const renderIcon = (index) => {
            if (index.index === questionIndex) {
                return (
                    <Image
                        source={require('../../../../assets/queChoisir/current_roadmap.png')}
                        style={styles.image}
                    />
                );
            } else if (index.index < questionIndex) {
                return (
                    <Image
                        source={require('../../../../assets/queChoisir/check_roadmap.png')}
                        style={styles.image}
                    />
                );
            } else {
                return (
                    <Image
                        source={require('../../../../assets/queChoisir/point_roadmap.png')}
                        style={styles.image}
                    />
                );
            }
        }
        return renderIcon;
    }, [questionIndex]);

    const handlePress = useCallback(
        (index) => {
            if (index < questionIndex) {
                onPress(index);
            }
        },
        [questionIndex, onPress]
    );

    return (
        <View style={[styles.container, { shadowColor: '#EC4C70', shadowOffset: { width: 15, height: 15 }, shadowOpacity: 0.4, shadowRadius: 5 }]}>
            <TouchableOpacity onPress={() => setTotalWidth(totalWidth === 20 ? 45 : 20)}>
                <LinearGradient colors={['#E8764A', '#EC4C70']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderBottomRightRadius: 50, borderTopRightRadius: 50 }}>
                    <View style={{ flexDirection: 'row', height: '100%', alignItems: 'center' }}>
                        <View style={{ height: '90%', alignItems: 'center' }}>
                            <DashedLine axis="vertical" dashLength={6} dashThickness={2} dashGap={5} dashColor="#DADADA" style={[styles.verticalLineDotted, { height: '100%' }]} />
                            <View style={[styles.verticalLine, { height: `${(100 * questionIndex) / (global.length - 1)}%` }]} />
                            {global.map((item, index) => (
                                <View style={[styles.itemWrap, { top: `${(86 * index) / (global.length - 1)}%` }]} key={index}>
                                    <NavBarIcon index={index} />
                                </View>
                            ))}
                        </View>

                        <View style={[styles.verticalWrap, {}]}>
                            {global.map((item, index) => (
                                <View key={index} style={[{ top: `${(81 * index) / (global.length - 1)}%`, alignItems: 'center', justifyContent: 'center' }]}>
                                    <TouchableOpacity style={{}} onPress={() => handlePress(index)}>
                                        <Text style={[{ fontSize: 12, color: '#F1F5F9', width: '100%' }]}>{`Étape ${index + 1}`}</Text>
                                    </TouchableOpacity>
                                    {questionIndex === index && totalWidth === 45 && (
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#F1F5F9' }}>Text de ma question</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
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
        height: '100%',
        position: 'absolute',
        borderBottomRightRadius: 50,
        borderTopRightRadius: 50,
        backgroundColor: 'white',
    },
    verticalLine: {
        width: 5,
        borderWidth: 1,
        borderColor: 'white',
        position: 'absolute',
        backgroundColor: 'red',
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


