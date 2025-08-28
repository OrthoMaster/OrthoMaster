import React, { useState, useEffect } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Linking,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { Feather } from '@expo/vector-icons';
import { useLogin } from '../../hooks/useLogin.hook';

const Colors = require('../../constants/Colors');
const Styles = require('../../constants/Styles');


export const LoginView = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const login = useLogin();

  // Login failed
  useEffect(() => {
    if (login.isError) {
      setIsChecking(false);
    }
  }, [login.isError]);

  const handleClick = () => {
    setIsChecking(true);
    login.mutate({ email: email, password: password })
  }

  return (
    <SafeAreaView style={Styles.container}>
      <ScrollView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[{ width: '100%' }]}
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='never'
        contentContainerStyle={{ height: '100%' }}
      >
        <View style={Styles.container}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo}
              source={require('../../../assets/images/banners/auth.webp')}
            />
          </View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ padding: 24 }}>
              <Text style={styles.title}>Bonjour,</Text>
              <Text style={styles.subTitle}>Connectez-vous pour continuer !</Text>

              {
                login.isError &&
                <Text style={Styles.errorMessageContainer}>
                  <Text style={Styles.errorText}>{login.error.response.data.message}</Text>
                </Text>
              }
              <TextInput
                style={styles.textInput}
                placeholder="Adresse e-mail"
                value={email}
                onChangeText={setEmail}
                textContentType="email"
                autoCapitalize={'none'}
                autoComplete='email'
                placeholderTextColor={Colors.gray}
                maxLength={45}
                numberOfLines={1}
                ellipsizeMode="tail"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete='password'
                  autoCapitalize={'none'}
                  onBlur={() => Keyboard.dismiss()
                  }
                  placeholderTextColor={Colors.gray}
                  maxLength={45}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={24} color={Colors.gray}
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Linking.openURL("https://espace.orthomaster.fr/web/reset_password")
                }}
              >
                <Text style={styles.forgotButton}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={Styles.btnPrimary}
                onPress={handleClick}
                disabled={isChecking}
              >
                {isChecking
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={Styles.btnPrimaryText}>Continuer</Text>
                }
              </TouchableOpacity>

              <View>
                <Text style={styles.registerSubtext}>Vous n'avez pas de compte ?</Text>
                <Text
                  onPress={() => { Linking.openURL("https://espace.orthomaster.fr/inscription") }}
                  style={styles.registerButton}>
                  Inscrivez-vous
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: '100%',
    resizeMode: 'contain',
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    lineHeight: 30,
    color: Colors.text
  },
  subTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    marginBottom: 32,
    color: Colors.subtext
  },
  textInput: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.text,
    overflow: "hidden",
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingEnd: 16,
  },
  passwordInput: {
    width: '80%',
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  forgotButton: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 16,
    color: Colors.primary,
  },

  registerSubtext: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 48
  },
  registerButton: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
})
