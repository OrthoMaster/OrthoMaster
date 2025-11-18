/** @author Francis */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, ImageSourcePropType } from "react-native";

export const LoadingContent = () => {
    const PROJECT_NAME = "OrthoMaster";
    const logoSource = require("../../assets/v2_images/logo/logo_black_origin.png");

    // Nhịp tim cho logo
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Animation cho từng ký tự
    const letterValues = useRef(
        PROJECT_NAME.split("").map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        // Logo nhịp tim
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 650,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 350,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Chữ xuất hiện lần lượt
        const animateLetters = () => {
            // reset
            letterValues.forEach(v => v.setValue(0));

            Animated.stagger(
                80,
                letterValues.map(v =>
                    Animated.timing(v, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    })
                )
            ).start(() => {
                setTimeout(animateLetters, 500);
            });
        };

        animateLetters();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={logoSource}
                style={[
                    styles.logo,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
                resizeMode="contain"
            />

            <View style={styles.nameContainer}>
                {PROJECT_NAME.split("").map((char, index) => {
                    const animatedStyle = {
                        opacity: letterValues[index],
                        transform: [
                            {
                                translateY: letterValues[index].interpolate({
                                    inputRange: [0, 0],
                                    outputRange: [0, 0], // trồi nhẹ lên
                                }),
                            },
                        ],
                    };

                    return (
                        <Animated.Text
                            key={`${char}-${index}`}
                            style={[styles.projectLetter, animatedStyle]}
                        >
                            {char}
                        </Animated.Text>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 160,
        height: 160,
    },
    nameContainer: {
        flexDirection: "row",
        marginTop: 18,
    },
    projectLetter: {
        fontSize: 26,
        fontFamily: 'Poppins-Semi',
        color: "#000000",
    },
});