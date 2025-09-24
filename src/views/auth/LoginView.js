import React, { useState, useEffect } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Linking,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../../hooks/useLogin.hook';

export const LoginView = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const login = useLogin()

  // Login failed
  useEffect(() => {
    if (login.isError) {
      setIsChecking(false);
    }
  }, [login.isError]);

  // Handle login button
  const handleClick = () => {
    setIsChecking(true);
    login.mutate({ email: email, password: password })
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[{ width: '100%' }]}
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='never'
        contentContainerStyle={{ height: '100%' }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.logoContainer}>
            <Image
              style={{
                width: '80%',
                height: "100%",
                resizeMode: 'contain',
              }}
              source={require('../../../assets/logo-text.png')}
            />
          </View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.connectionBox}>
              <Text style={styles.title}>Connexion</Text>

              {login.isError &&
                <Text style={styles.authText}>{login.error.response.data.message}</Text>
              }

              <TextInput
                style={[styles.intputField]}
                placeholder="Adresse e-mail"
                value={email}
                onChangeText={setEmail}
                textContentType="email"
                autoCapitalize={'none'}
                autoComplete='email'
                placeholderTextColor={"gray"}
              />

              <View style={styles.passwordField}>
                <TextInput
                  style={{ flex: 1, color: '#000' }}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete='password'
                  autoCapitalize={'none'}
                  onBlur={() => Keyboard.dismiss()}
                  placeholderTextColor={"gray"}
                />
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24} color="#aaa"
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Linking.openURL("https://espace.orthomaster.fr/web/reset_password")
                }}
                style={{ width: '100%', marginVertical: 8 }}
              >
                <Text style={{ color: '#ffaf31', fontSize: 14, width: '100%', textAlign: 'right' }}>Mot de passe oublié</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleClick}
                disabled={isChecking}
              >
                {isChecking
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.signInButtonText}>Continuer</Text>
                }
              </TouchableOpacity>


              <View style={{
                alignItems: 'center',
                marginTop: 16
              }}>
                <Text style={{ fontSize: 16, color: '#aaa' }}>Pas encore de compte ?</Text>
                <Text
                  onPress={() => { Linking.openURL("https://espace.orthomaster.fr/inscription") }}
                  style={{
                    color: '#ffaf31',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textTransform: 'uppercase'
                  }}>
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
  container: {
    backgroundColor: '#F1F1F1',
    flex: 1,
  },
  logoContainer: {
    height: "30%",
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  connectionBox: {
    backgroundColor: '#FFFEFD',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 18,
    color: '#1B1C1E'
  },
  intputField: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#f3f3f3',
    height: 60,
    paddingHorizontal: 16,
    marginVertical: 8
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f3f3',
    height: 60,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8
  },
  signInButton: {
    width: '100%',
    height: 60,
    backgroundColor: "#FFAF31",
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16
  },
  signInButtonText: {
    fontWeight: '600',
    fontSize: 18,
    color: '#FFF',
  },
  authText: {
    color: '#E45204',
    marginBottom: 16,
    fontSize: 14
  },
})
