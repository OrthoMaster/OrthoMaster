import { Text, View, StyleSheet, TouchableOpacity } from "react-native"
import { AntDesign } from '@expo/vector-icons';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnUI } from "react-native-reanimated";


export const FlipCard = ({
    frontComponent,
    backComponent
}) => {
    const rotateFront = useSharedValue(0);
    const rotateBack = useSharedValue(180);

    const frontStyle = useAnimatedStyle(() => {
        return {
            transform: [{ perspective: 3000 }, { rotateY: `${rotateFront.value}deg` }]
        };
    });
    const backStyle = useAnimatedStyle(() => {
        return {
            transform: [{ perspective: 3000 }, { rotateY: `${rotateBack.value}deg` }]
        };
    });
    const onAnimate = () => {
        "worklet";
        if (rotateFront.value === 180) {
            rotateFront.value = withTiming(0, { duration: 1000 });
            rotateBack.value = withTiming(180, { duration: 1000 });
            return;
        }
        rotateFront.value = withTiming(180, { duration: 1000 });
        rotateBack.value = withTiming(360, { duration: 1000 });
    };
    const animate = () => {
        runOnUI(onAnimate)();
    };


    return <View style={styles.container}>

        <Animated.View style={[styles.boxContainer, frontStyle]}>
            <View style={{ flex: 1}}>
                {frontComponent}
                <TouchableOpacity
                    style={styles.button}
                    onPress={animate}>
                    <AntDesign name="pluscircle" size={40} color="#FFAF31" />
                </TouchableOpacity>
            </View>
        </Animated.View>
        <Animated.View style={[styles.boxContainer, backStyle]}>
            <View style={{ flex: 1 }}>
                {backComponent}
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={animate}>
                <AntDesign name="closecircle" size={40} color="#FFAF31" />
            </TouchableOpacity>
        </Animated.View>
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    boxContainer: {
        width: "95%",
        height: "95%",
        backfaceVisibility: "hidden",
        position: 'absolute',
        borderRadius: 20,
        padding: 10
    },
    button: {
        alignSelf: 'center',
        position: 'absolute',
        bottom: 20
    }
})