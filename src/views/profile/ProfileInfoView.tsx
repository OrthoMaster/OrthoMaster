import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { BouncingDots } from '../../component/LoadingDots';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetUser } from '../../hooks/auth.hook';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { getPreFormData, updateProfile, me } from '../../services/v2/AuthService';

interface FormData {
  name: string;
  firstname: string;
  firstnameBirth: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  country: string;
  profession: string;
  organization: string;
  no_secu: string;
}

interface FormErrors {
  name?: string;
  firstname?: string;
  firstnameBirth?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  verificationCode?: string;
  profession?: string;
  no_secu?: string;
}

export const ProfileInfoView = ({ navigation, route }) => {
  // Hide bottom nav
  useEffect(() => {
    // Hide
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    // Re-Show when unmount
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const queryClient = useQueryClient();
  const { data: profile } = useGetUser();

  const [professions, setProfessions] = useState([]);
  const [organizations, setOrganizaions] = useState([]);

  // Get data for dropdowns
  const { data: preData, isLoading: isLoadingPreData, error: errorPreData,
    refetch: refetchPreData, isFetching: isFetchingPreData } = useQuery({
      queryKey: ['pre-form-data-profile'],
      queryFn: () => getPreFormData(),
    });
  
  useEffect(() => {
    if (preData?.data?.professions) {
      setProfessions(preData?.data?.professions);
    }
    if (preData?.data?.organizations) {
      setOrganizaions(preData?.data?.organizations);
    }
  }, [preData]);

  // Email verification states
  const [isModifyingEmail, setIsModifyingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isEmailReadonly, setIsEmailReadonly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Init data
  const [initialData, setInitialData] = useState<FormData>({
    name: profile?.name || '',
    firstname: profile?.first_name || '',
    firstnameBirth: profile?.first_name_birth || '',
    dateOfBirth: profile?.date_of_birth || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    postalCode: profile?.postal_code || '',
    city: profile?.city || '',
    country: profile?.country || '',
    profession: profile?.profession_id || '',
    organization: profile?.funding_organization_id || '',
    no_secu: profile?.no_secu || '',
  });

  // Form data
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: profile?.name || '',
    firstname: profile?.first_name || '',
    firstnameBirth: profile?.first_name_birth || '',
    dateOfBirth: profile?.date_of_birth || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    postalCode: profile?.postal_code || '',
    city: profile?.city || '',
    country: profile?.country || '',
    profession: profile?.profession_id || '',
    organization: profile?.funding_organization_id || '',
    no_secu: profile?.no_secu || '',
  });

  // Check changes
  const hasChanges = useCallback(() => {
    return (
      formData.name !== initialData.name ||
      formData.firstname !== initialData.firstname ||
      formData.firstnameBirth !== initialData.firstnameBirth ||
      formData.dateOfBirth !== initialData.dateOfBirth ||
      formData.phone !== initialData.phone ||
      formData.postalCode !== initialData.postalCode ||
      formData.city !== initialData.city ||
      formData.country !== initialData.country ||
      formData.profession !== initialData.profession ||
      formData.organization !== initialData.organization ||
      formData.no_secu !== initialData.no_secu
    );
  }, [formData, initialData]);

  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Always clear field error
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSelectProfession = (value: string) => {
    handleInputChange('profession', value);
    setShowProfessionModal(false);
  };

  const getSelectedProfessionLabel = () => {
    const selected = professions?.find(p => p.id === formData.profession);
    return selected?.name || '';
  };

  const handleSelectOrganization = (value: string) => {
    handleInputChange('organization', value);
    setShowOrganizationModal(false);
  };

  const getSelectedOrganizationLabel = () => {
    const selected = organizations?.find(p => p.id === formData.organization);
    return selected?.name || '';
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Veuillez saisir votre nom !";
    }

    // Validate firstname
    if (!formData.firstname.trim()) {
      errors.firstname = "Veuillez saisir votre prénom !";
    }

    // Validate date of birth
    if ((formData.organization == '1' || formData.organization == '2') && !formData.dateOfBirth.trim()) {
      errors.dateOfBirth = "Veuillez saisir votre date de naissance !";
    }

    // Validate date of birth
    if ((formData.organization == '1' || formData.organization == '2') && !formData.no_secu.trim()) {
      errors.no_secu = "Veuillez saisir le numéro SECU !";
    }

    // Validate phone
    if (!formData.postalCode.trim()) {
      errors.postalCode = "Veuillez saisir le code postal !";
    }
    if (!formData.city.trim()) {
      errors.city = "Veuillez saisir la ville !";
    }

    // Profession
    if (!formData.profession) {
      errors.profession = "Veuillez sélectionner une fonction professionelle !euillez saisir la ville !";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const back = () => {
    navigation.goBack();
  };

  const handleCancelEmailModification = () => {
    setIsModifyingEmail(false);
    setNewEmail('');
    setShowVerificationInput(false);
    setVerificationCode('');
    setIsEmailReadonly(false);
    setFormErrors(prev => ({ ...prev, email: undefined, verificationCode: undefined }));
  };

  const handleVerifyEmail = async () => {
    // Validate new email
    if (!newEmail.trim()) {
      setFormErrors(prev => ({ ...prev, email: 'Veuillez saisir une adresse email !' }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setFormErrors(prev => ({ ...prev, email: 'Veuillez saisir une adresse email valide !' }));
      return;
    }

    setShowVerificationInput(true);
    setIsEmailReadonly(true);

    // TODO
  };

  const handleVerifyCode = async () => {
    // Validate verification code
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setFormErrors(prev => ({ ...prev, verificationCode: 'Veuillez saisir un code à 6 chiffres !' }));
      return;
    }

    // TODO

  };

  const handleSubmit = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Check if email is being modified but not verified
    if (isModifyingEmail) {
      Alert.alert('Attention', 'Veuillez vérifier votre nouvel email avant de sauvegarder.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      setShowErrorModal(true);
      return false;
    }

    setIsSubmitting(true);
    try {
      const result = await updateProfile({
        name: formData.name,
        first_name: formData.firstname,
        first_name_birth: formData.firstnameBirth,
        date_of_birth: formData.dateOfBirth,
        phone: formData.phone,
        postal_code: formData.postalCode,
        city: formData.city,
        country: formData.country,
        profession_id: formData.profession,
        funding_organization_id: formData.organization,
        no_secu: formData.no_secu
      });

      if (result?.success) {
        setShowSuccessModal(true);
        const updatedUser = await me();
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        queryClient.setQueryData(['current-user'], updatedUser);

        // Navigate back after delay
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        setIsSubmitting(false);
        Alert.alert('Erreur', result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Erreur', error.message);
    }

    return;
  };

  return (
    <SafeAreaView style={styles.container}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hasChanges() ? 120 : Spacings.md }}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingPreData && !!errorPreData}
              onRefresh={refetchPreData}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Body */}
          {isLoadingPreData && !errorPreData &&
            <BouncingDots
              color={Colors.primary}
              size={10}
              bounceHeight={5}
              containerStyle={{
                backgroundColor: 'transparent',
                position: 'relative',
                zIndex: 999,
                elevation: 5,
              }}
            />
          }
          {errorPreData && (
            <View style={[Styles.errorMessageContainer, { marginTop: Spacings.md }]}>
              <Text style={Styles.errorText}>Erreur de chargement des données, veuillez réessayer !</Text>
            </View>
          )}


          <Text style={styles.sectionTitle}>Identité</Text>

          {/* Email Display/Modification */}
          <View style={Styles.inputContainer}>
            {!isModifyingEmail ? (
              <>
                <View style={styles.emailDisplayContainer}>
                  <View style={styles.emailTextContainer}>
                    <Text style={styles.emailValue}>{formData.email}</Text>
                  </View>
                  {/* <TouchableOpacity
                    style={styles.modifyButton}
                    onPress={handleModifyEmail}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name={'email-edit-outline'} size={22} color={Colors.danger} />
                  </TouchableOpacity> */}
                </View>
              </>
            ) : (
              <View>
                <TextInput
                  multiline={false}
                  scrollEnabled={false}
                  numberOfLines={1}
                  maxLength={40}
                  mode="outlined"
                  label="Nouvel email"
                  value={newEmail}
                  onChangeText={(value) => {
                    setNewEmail(value);
                    setFormErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  disabled={isEmailReadonly}
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

                {!showVerificationInput ? (
                  <View style={styles.emailButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.emailActionButton, styles.cancelButton]}
                      onPress={handleCancelEmailModification}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.emailActionButton, (formData.email === newEmail) ? styles.cancelButton : styles.verifyButton]}
                      disabled={formData.email === newEmail}
                      onPress={handleVerifyEmail}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.verifyButtonText}>Vérifier</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TextInput
                      multiline={false}
                      scrollEnabled={false}
                      numberOfLines={1}
                      maxLength={6}
                      mode="outlined"
                      label="Code de vérification"
                      value={verificationCode}
                      onChangeText={(value) => {
                        setVerificationCode(value);
                        setFormErrors(prev => ({ ...prev, verificationCode: undefined }));
                      }}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      error={!!formErrors.verificationCode}
                      style={[Styles.textInput, { marginTop: Spacings.sm }]}
                      contentStyle={Styles.textInputContent}
                      outlineStyle={Styles.textInputOutline}
                      theme={{
                        colors: {
                          primary: Colors.primary,
                          error: Colors.danger,
                        }
                      }}
                    />
                    {formErrors.verificationCode && (
                      <Text style={Styles.fieldErrorText}>{formErrors.verificationCode}</Text>
                    )}

                    <View style={styles.emailButtonsContainer}>
                      <TouchableOpacity
                        style={[styles.emailActionButton, styles.cancelButton]}
                        onPress={handleCancelEmailModification}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.emailActionButton, styles.confirmButton]}
                        onPress={handleVerifyCode}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.confirmButtonText}>Confirmer</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>État civil</Text>

          {/* Name */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Nom"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
              disabled={isModifyingEmail}
              returnKeyType="next"
              error={!!formErrors.name}
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
            {formErrors.name && (
              <Text style={Styles.fieldErrorText}>{formErrors.name}</Text>
            )}
          </View>

          {/* Firstname */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Prénom"
              value={formData.firstname}
              onChangeText={(value) => handleInputChange('firstname', value)}
              autoCapitalize="words"
              disabled={isModifyingEmail}
              returnKeyType="next"
              error={!!formErrors.firstname}
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
            {formErrors.firstname && (
              <Text style={Styles.fieldErrorText}>{formErrors.firstname}</Text>
            )}
          </View>

          {/* Firstname Birth */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Nom jeune fille"
              value={formData.firstnameBirth}
              onChangeText={(value) => handleInputChange('firstnameBirth', value)}
              autoCapitalize="words"
              disabled={isModifyingEmail}
              returnKeyType="next"
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
          </View>

          {/* Date of Birth */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={10}
              mode="outlined"
              label="Date de naissance (JJ/MM/AAAA)"
              value={formData.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
              placeholder="01/01/1990"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              disabled={isModifyingEmail}
              returnKeyType="next"
              error={!!formErrors.dateOfBirth}
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
            {formErrors.dateOfBirth && (
              <Text style={Styles.fieldErrorText}>{formErrors.dateOfBirth}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Coordonnées</Text>

          {/* Phone Input */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={30}
              mode="outlined"
              label="Téléphone"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="telephoneNumber"
              disabled={isModifyingEmail}
              returnKeyType="next"
              error={!!formErrors.phone}
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
            {formErrors.phone && (
              <Text style={Styles.fieldErrorText}>{formErrors.phone}</Text>
            )}
          </View>

          <View style={styles.rowContainer}>
            {/* Postal Code */}
            <View style={[Styles.inputContainer, styles.halfWidth]}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={6}
                mode="outlined"
                label="Code postal"
                value={formData.postalCode}
                onChangeText={(value) => handleInputChange('postalCode', value)}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="postalCode"
                disabled={isModifyingEmail}
                returnKeyType="next"
                error={!!formErrors.postalCode}
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
              {formErrors.postalCode && (
                <Text style={Styles.fieldErrorText}>{formErrors.postalCode}</Text>
              )}
            </View>

            {/* City */}
            <View style={[Styles.inputContainer, styles.halfWidth]}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={100}
                mode="outlined"
                label="Ville"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                autoCapitalize="words"
                disabled={isModifyingEmail}
                returnKeyType="next"
                error={!!formErrors.city}
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
              {formErrors.city && (
                <Text style={Styles.fieldErrorText}>{formErrors.city}</Text>
              )}
            </View>
          </View>

          {/* Country */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Pays"
              value={formData.country}
              onChangeText={(value) => handleInputChange('country', value)}
              autoCapitalize="words"
              disabled={isModifyingEmail}
              returnKeyType="next"
              error={!!formErrors.country}
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
            {formErrors.country && (
              <Text style={Styles.fieldErrorText}>{formErrors.country}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Profession</Text>

          {/* Profession */}
          <View style={Styles.inputContainer}>
            <TouchableOpacity
              disabled={isLoadingPreData || !!errorPreData || isModifyingEmail}
              onPress={() => setShowProfessionModal(true)}
              activeOpacity={0.7}
            >
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  label="Fonction professionelle"
                  value={getSelectedProfessionLabel()}
                  editable={false}
                  right={
                    <TextInput.Icon
                      icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={Colors.text}
                        />
                      )}
                    />
                  }
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
              </View>
            </TouchableOpacity>
            {formErrors.profession && (
              <Text style={Styles.fieldErrorText}>{formErrors.profession}</Text>
            )}
          </View>

          {/* Funding organization */}
          <View style={Styles.inputContainer}>
            <TouchableOpacity
              disabled={isLoadingPreData || !!errorPreData || isModifyingEmail}
              onPress={() => setShowOrganizationModal(true)}
              activeOpacity={0.7}
            >
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  label="Organisme de formation"
                  value={getSelectedOrganizationLabel()}
                  editable={false}
                  right={
                    <TextInput.Icon
                      icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={Colors.text}
                        />
                      )}
                    />
                  }
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
              </View>
            </TouchableOpacity>
          </View>

          {/* SECU */}
          <View style={[Styles.inputContainer, { paddingBottom: Spacings.xl }]}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={50}
              mode="outlined"
              label="Numéro SECU"
              value={formData.no_secu}
              onChangeText={(value) => handleInputChange('no_secu', value)}
              disabled={isModifyingEmail}
              returnKeyType="done"
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
            {formErrors.no_secu && (
              <Text style={Styles.fieldErrorText}>{formErrors.no_secu}</Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {hasChanges() && !isLoadingPreData && !errorPreData && !isModifyingEmail && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              Styles.btnBottom,
              isSubmitting && Styles.btnDisabled
            ]}
            disabled={isSubmitting}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <Text style={Styles.btnPrimaryText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profession Modal */}
      <Modal
        visible={showProfessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profession</Text>
              <TouchableOpacity
                onPress={() => setShowProfessionModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView style={styles.optionsList}>
              {professions?.map((profession) => (
                profession.child_flg === true
                  ?
                  <TouchableOpacity
                    key={profession.id}
                    style={styles.optionItem}
                    onPress={() => handleSelectProfession(profession.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={formData.profession === profession.id ? styles.selectedOptionText : styles.optionText}>
                      {profession.name}
                    </Text>
                    {formData.profession === profession.id && (
                      <Ionicons
                        name="checkmark-outline"
                        size={24}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                  :
                  <View
                    key={profession.id}
                    style={[styles.optionItem, styles.optionParentItem]}
                  >
                    <Text style={styles.optionParentText}>
                      {profession.name}
                    </Text>
                  </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Funding Organization Modal */}
      <Modal
        visible={showOrganizationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrganizationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Organisme de formation</Text>
              <TouchableOpacity
                onPress={() => setShowOrganizationModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView style={styles.optionsList}>
              {organizations?.map((organization) => (
                <TouchableOpacity
                  key={organization.id}
                  style={styles.optionItem}
                  onPress={() => handleSelectOrganization(organization.id)}
                  activeOpacity={0.7}
                >
                  <Text style={formData.organization === organization.id ? styles.selectedOptionText : styles.optionText}>
                    {organization.name}
                  </Text>
                  {formData.organization === organization.id && (
                    <Ionicons
                      name="checkmark-outline"
                      size={24}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            {/* Icon */}
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={50} color={Colors.danger} />
            </View>

            {/* Title */}
            <Text style={styles.errorModalTitle}>Erreur de validation</Text>

            {/* Message */}
            <Text style={styles.errorModalMessage}>
              Veuillez vérifier les informations saisies et corriger les erreurs.
            </Text>

            {/* Button */}
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setShowErrorModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.errorModalButtonText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Succès</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              Votre profile a été modifié avec succès !
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },

  // Email Display/Modification Styles
  emailDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailTextContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Colors.primary,
    paddingVertical: Spacings.xxs,

  },
  emailValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    textAlign: 'center',
  },
  modifyButton: {
    marginLeft: Spacings.lg,
  },
  emailButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacings.sm,
    gap: Spacings.sm,
  },
  emailActionButton: {
    flex: 1,
    paddingVertical: Spacings.xs,
    borderRadius: Spacings.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
  },
  verifyButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  confirmButton: {
    backgroundColor: Colors.success || Colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  optionsList: {
    marginBottom: Spacings.lg,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingHorizontal: Spacings.lg,
  },
  optionParentItem: {
    backgroundColor: Colors.grayLight,
  },
  optionParentText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    paddingLeft: Spacings.md
  },
  selectedOptionText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
    paddingLeft: Spacings.md
  },

  // Error Modal Styles
  errorModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacings.xl,
  },
  errorModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: Spacings.md,
  },
  errorModalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  errorModalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacings.lg,
  },
  errorModalButton: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xl,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorModalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  rowContainer: {
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  halfWidth: {
    flex: 1,
  },
  iconContainer: {
    marginBottom: Spacings.md,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: Spacings.xxs,
    marginBottom: Spacings.lg,
  },
});