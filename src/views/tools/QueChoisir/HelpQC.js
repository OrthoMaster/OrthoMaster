import {StyleSheet} from "react-native";
import {SafeAreaView, View, Text, Image, ScrollView, TouchableOpacity} from "react-native";
import HelpIcon from "../../../../assets/queChoisir/help_icon.svg";
import {LinearGradient}  from "expo-linear-gradient";
import GotIt from "../../../../assets/queChoisir/got_it.svg";

export const HelpSection = ({ helpWidth, helpIsActive, onPress }) => {
    return (
        <View style={[styles.helpView, { width: helpWidth, right: helpIsActive ? 0 : helpWidth * -1} ]}>
            <SafeAreaView style={ [styles.helpContent]}>
                <View style={styles.responseAlign}>
                    <Text style={[styles.titleHelpView]}>Title</Text>
                    <HelpIcon style={{marginLeft: 5, marginTop: 3}} height={20} width={20}/>
                </View>
                <Image
                    source={require('../../../../assets/queChoisir/tmp.png')}
                    style={styles.image}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text>Lorem ipsum dolor sit amet consectetur. Lectus massa ac iaculis nisl euismod. Vulputate nulla lectus accumsan neque mi vitae turpis. Nisl mi pellentesque tellus non tristique dictum euismod blandit volutpat. Congue aliquam urna cras elementum. Pharetra pulvinar nunc eget eget.

                        Ac in diam elementum volutpat quis auctor tellus. Morbi vestibulum sem auctor sed velit blandit id ullamcorper sollicitudin. Sed augue iaculis ultricies faucibus eget sit eu facilisis est. Ullamcorper blandit semper pellentesque sed dui eget et ultrices.

                        Proin aliquet fames vitae odio quis nunc. Amet viverra egestas volutpat sapien. Sed massa lobortis eu suscipit urna aliquam. Non a eget diam integer dui. Tortor hendrerit magna posuere cras diam sit neque sit.
                        Ante pellentesque nisl turpis vitae quam faucibus sed eget. Enim vestibulum semper rhoncus maecenas nulla.

                        Proin aliquet fames vitae odio quis nunc. Amet viverra egestas volutpat sapien. Sed massa lobortis eu suscipit urna aliquam. Non a eget diam integer dui. Tortor hendrerit magna posuere cras diam sit neque sit.
                        Ante pellentesque nisl turpis vitae quam faucibus sed eget. Enim vestibulum semper rhoncus maecenas nulla. </Text>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
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