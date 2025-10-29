import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Image,
    ImageBackground
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

export const AuthHome = ({ navigation }) => {
    return (
        <SafeAreaView style={Styles.container}>

            <View style={styles.centerView}>
                <View style={{ alignItems: 'center' }}>
                    <Image
                        source={require("../../../assets/v2_images/logo/logo_primary_1024.png")}
                        style={{
                            height: 140,
                            resizeMode: "contain",
                        }}
                    />
                    <Text style={styles.title}>OrthoMaster</Text>

                </View>
            </View>
            <View style={styles.bottomView}>
                <TouchableOpacity style={Styles.btnPrimary}
                    onPress={() => navigation.navigate('auth-home')}
                >
                    <Text style={Styles.btnPrimaryText}>Se connecter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[Styles.btnWhite, { marginTop: Spacings.md }]}
                    onPress={() => navigation.navigate('register')}
                >
                    <Text style={Styles.btnWhiteText}>Créer un compte</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    centerView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomView: {
        padding: Spacings.lg,
        paddingBottom: Spacings.xxl
    },
    title: {
        fontFamily: 'Poppins-Medium',
        color: Colors.primary,
        fontSize: 32,
        marginTop: Spacings.md
    },
})
