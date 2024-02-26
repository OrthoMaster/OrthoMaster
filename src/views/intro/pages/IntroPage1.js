import { useEffect } from "react"
import { Text, View, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "react-native"
import Animated, { runOnUI, useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated"

export default IntroPage1 = () => {
    const height = useSharedValue(0)

    const cardStyle = useAnimatedStyle(() => {
        return {
            height: `${height.value}%`
        };
    });

    const onAnimate = () => {
        "worklet";
        height.value = withTiming(95, { duration: 1000 })
    };
    const animate = () => {
        runOnUI(onAnimate)();
    };

    useEffect(() => {
        setTimeout(()=>{
            animate()
        }, 500)
    }, [])



    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[cardStyle, { width: "95%" }]}>
            <LinearGradient
                colors={['#3F70A7', '#162754']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, borderRadius: 20, justifyContent: 'center', padding: 30 }}
            >
                <Image
                    source={require('../../../../assets/logo-text-white.png')}
                    style={{
                        height: '5%', width: '100%',
                        resizeMode: 'contain',
                        position: 'absolute',
                        top: 10,
                        alignSelf: 'center'
                    }}
                />
                <Text style={{ color: '#fff', fontSize: 16 }}>Bienvenue sur votre application</Text>
                <Text style={{ color: '#fff', fontSize: 35 }}>ORTHOMASTER</Text>
            </LinearGradient>
        </Animated.View>
    </View>
}