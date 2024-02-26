import { Text, View, Image, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

export default IntroPage6 = () => {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
            width: "95%", height: "95%"
        }}>
            <LinearGradient
                colors={['#3F70A7', '#162754']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, borderRadius: 20, padding: 30, justifyContent: 'space-around' }}
            >
                <Image
                    source={require('../../../../assets/logo-text-white.png')}
                    style={{
                        height: '5%', width: '100%',
                        resizeMode: 'contain',
                        position: 'absolute',
                        top: 10,
                        alignSelf: 'center',
                    }}
                />
                <View style={{
                }}>
                    <Text style={{
                        fontSize: 25,
                        fontWeight: 'bold',
                        color: "#ffaf31",
                    }}>Encore une chose...</Text>

                </View>

                <View>
                    <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                        À tout moment, posez-nous
                        une question sur un cas patient,
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                        un problème technique...
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 16, width: '90%' }}>
                        Vous bénéficiez du support de nos experts en moins de 48 h.
                    </Text>
                </View>
                <Image
                    source={require('../../../../assets/intro/icon-question.png')}
                    style={{
                        width: Dimensions.get("window").width * 0.30,
                        height: Dimensions.get("window").width * 0.30,
                        resizeMode: 'contain',
                        alignSelf: 'center'
                    }}
                />
            </LinearGradient>
        </View>
    </View>
}