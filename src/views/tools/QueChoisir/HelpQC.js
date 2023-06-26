import {StyleSheet} from "react-native";
import {SafeAreaView, View, Text, Image, ScrollView, TouchableOpacity} from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import {LinearGradient}  from "expo-linear-gradient";
import GotIt from "../../../../assets/queChoisir/got_it.svg";

export const HelpSection = ({ helpWidth, helpIsActive, onPress, response }) => {
    return (
        <View style={[styles.helpView, { width: helpWidth, right: helpIsActive ? 0 : helpWidth * -1} ]}>
            <SafeAreaView style={ [styles.helpContent]}>
                <View style={styles.responseAlign}>
                    <Text style={[styles.titleHelpView]}>{response.response}</Text>
                    <HelpIcon style={{marginLeft: 5, marginTop: 3}} height={25} width={25}/>
                </View>
                <Image
                    source={require('../../../../assets/queChoisir/tmp.png')}
                    style={styles.image}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text> {response.help_text} </Text>
                </ScrollView>
                <LinearGradient
                    colors={['#E8764A', '#EC4C70']}
                    style={styles.closeHelp}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity style={styles.closeHelp}
                                      onPress={() => {
                                          onPress();
                                      }}
                    >
                        <Text style={{fontSize: 16, fontWeight:'bold', color: 'white', marginRight: 5}}>Got It</Text>
                        <GotIt style={{marginBottom: 2}} height={30} width={30}/>
                    </TouchableOpacity>
                </LinearGradient>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
    },
    helpView: {
        borderBottomLeftRadius: 16,
        height:"100%",
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.7,
        shadowRadius: 5,
        position:'absolute',
        alignItems:'center',
    },
    helpContent: {
        paddingVertical: 20,
        width: '100%',
        height: '100%',
    },
    titleHelpView: {
        fontSize: 24,
        fontWeight: 600,
        color: '#20123A',
        alignSelf: 'center',
    },
    closeHelp: {
        borderRadius: 16,
        height: 60,
        width: '90%',
        flexDirection: 'row',
        alignItems:'center',
        justifyContent:'center',
        marginLeft: 15,
    },
    image: {
        width: "90%",
        marginBottom: 20,
        marginTop: '10%',
        borderRadius: 16,
        resizeMode: "cover",
        height: "35%",
        alignSelf:'center',
    },
    responseAlign: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
})