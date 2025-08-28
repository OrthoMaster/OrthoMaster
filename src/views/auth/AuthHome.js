import React from "react";
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image
} from "react-native";

const Colors = require('../../constants/Colors');
const Styles = require('../../constants/Styles');

export const AuthHome = ({ navigation }) => {
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <SafeAreaView style={[Styles.container, styles.container]}>
        <Image
          source={require("../../../assets/images/logo/white.webp")}
          style={styles.logo}
        />
        <Text style={styles.title}>OrthoMaster</Text>
        <Text style={styles.subTitle}>l'orthopédie dans la poche</Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.btnLogin}
            onPress={() => {
              navigation.navigate('auth-home')
            }}
          >
            <Text style={styles.btnLoginText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnRegister}
            onPress={() => {
              Linking.openURL("https://espace.orthomaster.fr/inscription")
            }}
          >
            <Text style={styles.btnRegisterText}>S'inscrire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL("https://espace.orthomaster.fr/web/reset_password")
            }}
          >
            <Text style={styles.btnForgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    verticalAlign: 'middle',
  },
  logo: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    color: Colors.white,
    marginTop: 16
  },
  subTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: Colors.grayLight,
    paddingBottom: 140,
  },

  actionContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 48
  },

  btnLogin: {
    backgroundColor: Colors.white,
    width: 200,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowColor: Colors.grayLight,
    marginBottom: 16,
  },
  btnLoginText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  btnRegister: {
    borderWidth: 1,
    borderColor: Colors.white,
    width: 200,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnRegisterText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnForgotText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.grayLight,
    marginTop: 24,
    marginBottom: 48,
  }
})
