import { Text, View, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

export default IntroPage2 = () => {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
            width: "95%", height: "95%"
        }}>
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
                <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                    Voici comment ORTHOMASTER
                </Text>
                <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                    vous accompagne pour rendre
                </Text>
                <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                    votre délivrance en orthopédie
                </Text>
                <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                    plus efficace <Text style={{color:"#FFAF31", fontWeight: 'bold'}}>en 3 temps</Text>...
                </Text>
            </LinearGradient>
        </View>
    </View>
}