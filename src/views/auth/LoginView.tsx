import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { useLogin } from '../../hooks/auth.hook';

import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import axios from 'axios';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

interface ApiError {
  error?: string;
};

export const LoginView = ({ navigation, route }) => {
  const login = useLogin();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear error message
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [formErrors]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Veuillez saisir votre adresse email !';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez saisir une adresse email valide !';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Veuillez saisir votre mot de passe !';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!login.isError) return;

    const err = login.error;
    if (axios.isAxiosError<ApiError>(err)) {
      const apiMessage = err.response?.data?.error;

      const networkMsg =
        err.code === "ECONNABORTED"
          ? "La connexion a expiré, veuillez réessayer."
          : "Impossible de se connecter au serveur, veuillez vérifier votre connexion réseau. " + err.code;

      setErrorMessage(apiMessage || networkMsg);
    } else {
      setErrorMessage("Une erreur inconnue s’est produite, veuillez réessayer.");
    }
  }, [login.isError, login.error]);

  // Handle login action
  const handleLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    const deviceId = Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;

    // Login
    login.mutate({
      email: formData.email.trim(),
      password: formData.password,
      fcm_token: tokenData.data,
      device_id: deviceId,
      device_type: Device.osName === 'iOS' ? 'ios' : 'android',
    });
  };

  return (
    <SafeAreaView style={Styles.container}>
      <KeyboardAvoidingView
        style={Styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/v2_images/logo/logo_primary_1024.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>OrthoMaster</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.title}>Connexion</Text>

            {errorMessage && (
              <View style={Styles.errorMessageContainer}>
                <Text style={Styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={40}
                mode="outlined"
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                disabled={login.isPending}
                returnKeyType="next"
                error={!!formErrors.email}
                style={Styles.textInput}
                contentStyle={Styles.textInputContent}
                outlineStyle={Styles.textInputOutline}
                theme={{
                  colors: {
                    primary: Colors.primary,
                    error: Colors.danger,
                  }
                }}
              />

              {formErrors.email && (
                <Text style={Styles.fieldErrorText}>{formErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={30}
                mode="outlined"
                label="Mot de passe"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                disabled={login.isPending}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={!!formErrors.password}
                style={Styles.textInput}
                contentStyle={Styles.textInputContent}
                outlineStyle={Styles.textInputOutline}
                right={
                  <TextInput.Icon
                    icon={() => (
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={Colors.gray}
                      />
                    )}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={login.isPending}
                  />
                }
                theme={{
                  colors: {
                    primary: Colors.primary,
                    error: Colors.danger,
                  }
                }}
              />
              {formErrors.password && (
                <Text style={Styles.fieldErrorText}>{formErrors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <View style={styles.forgotPasswordWrapper}>
              <TouchableOpacity
                onPress={() => { navigation.navigate('forgot') }}
                disabled={login.isPending}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                Styles.btnPrimary,
                login.isPending && Styles.btnDisabled
              ]}
              onPress={handleLogin}
              disabled={login.isPending}
              activeOpacity={0.8}
            >
              {login.isPending ? (
                <ActivityIndicator color={Colors.disabled} size="small" />
              ) : (
                <Text style={Styles.btnPrimaryText}>Continuer</Text>
              )}
            </TouchableOpacity>


            {/* Register Button */}
            <Text style={styles.registerSubtext}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => { navigation.navigate('register') }}
              disabled={login.isPending}
            >
              <Text style={styles.registerText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 120,
    marginBottom: Spacings.md,
  },
  brand: {
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    marginBottom: Spacings.xxl,
  },
  form: {
    width: '100%',
    maxWidth: 700,
    paddingHorizontal: Spacings.lg,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: Spacings.md,
    color: Colors.black
  },
  forgotPasswordWrapper: {
    alignItems: 'flex-end',
    marginBottom: Spacings.lg,
  },
  forgotPasswordText: {
    color: Colors.primaryLight,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  registerSubtext: {
    textAlign: 'center',
    color: Colors.subtext,
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacings.xl,
    fontFamily: 'Roboto',
  },
  registerText: {
    color: Colors.primary,
    fontSize: 16,
    lineHeight: 20,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-Medium',
  },
  registerButton: {
    alignItems: 'center',
  },
})
