import { useTheme } from "@react-navigation/native"
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, FontAwesome, FontAwesome5 } from '@expo/vector-icons';

export default HeaderLabo = ({navigation}) => {
    const { colors } = useTheme()
    return <SafeAreaView style={{ backgroundColor: colors.primary }}>
        <View style={{
        }}>
            <View style={styles.headerBody}>
                <Image
                    source={require('../../assets/labos/thuasne/thuasne-text.png')}
                    style={{
                        resizeMode:'contain',
                        height:30,
                    }}
                />
                <Text style={{
                    color: '#ffffff',
                    fontWeight: '500',
                    fontSize: 20,
                    paddingBottom: 10,
                    paddingTop: 5
                }}>FORMATIONS</Text>
            </View>
            
        <TouchableOpacity style={[{
            }, styles.sideButton]}>
                <FontAwesome name="search" size={30} color="#ffffff" />
            </TouchableOpacity>
        </View>
    </SafeAreaView>
}
const styles = StyleSheet.create({
    sideButton: {
        alignItems: 'center',
        position: 'absolute',
        height: 70,
        width: 70,
        left: Dimensions.get('screen').width - 70
    },
    headerBody: {
        alignItems: 'center',
    }
})