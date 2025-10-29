import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  Platform,
  Alert,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useGlobal } from '../../component/GlobalContext';
import { login } from '../../services/v2/AuthService';
import { AxiosError } from 'axios';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginView = ({ navigation, route }) => {
  const { handleLoginSuccess } = useGlobal();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Handle login action
  const handleLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.status === 'success') {
        if (handleLoginSuccess) {
          await handleLoginSuccess();
        }
      }
    } catch (error) {
      let message = 'Une erreur est survenue. Veuillez réessayer !';

      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          message = 'Vos identifiants ne semblent pas corrects. Veuillez réessayer !';
        } else if (!error.response) {
          message = 'Erreur de connexion. Vérifiez votre internet !';
        }
      }

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                Styles.btnPrimary,
                isLoading && Styles.btnDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
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
              disabled={isLoading}
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
