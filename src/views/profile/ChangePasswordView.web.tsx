import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Dialog, Portal, Button, TextInput } from 'react-native-paper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { changePassword } from '../../services/v2/AuthService';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export const ChangePasswordView = ({ navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Check if form has data
  const hasData = () => {
    return formData.newPassword.trim() !== '' || formData.confirmPassword.trim() !== '';
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate new password
    if (!formData.newPassword.trim()) {
      errors.newPassword = "Veuillez saisir un nouveau mot de passe !";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères !";
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Veuillez confirmer votre mot de passe !";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas !";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const back = () => {
    navigation.goBack();
  };

  // Dialog states for web (replacing Alert)
  const [showSubmitErrorDialog, setShowSubmitErrorDialog] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      setShowErrorModal(true);
      return false;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword({
        new_password: formData.newPassword,
        new_password_confirmation: formData.confirmPassword,
      });

      if (result?.success) {
        // Show success modal
        setShowSuccessModal(true);

        // Reset form
        setFormData({
          newPassword: '',
          confirmPassword: '',
        });

        // Navigate back after delay
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        setIsSubmitting(false);
        setSubmitErrorMessage(result?.message || 'Une erreur est survenue');
        setShowSubmitErrorDialog(true);
      }
    } catch (error) {
      setIsSubmitting(false);
      setSubmitErrorMessage(error.message || 'Une erreur est survenue');
      setShowSubmitErrorDialog(true);
    }

    return;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={back}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sécurité</Text>
      </View>


      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: 700 }}>
          <Text style={styles.sectionTitle}>Nouveau mot de passe</Text>

          {/* New Password */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Nouveau mot de passe"
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange('newPassword', value)}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="next"
              error={!!formErrors.newPassword}
              right={
                <TextInput.Icon
                  icon={() => (
                    <Feather
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.gray}
                    />
                  )}
                  onPress={() => setShowNewPassword(!showNewPassword)}
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
            {formErrors.newPassword && (
              <Text style={Styles.fieldErrorText}>{formErrors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={Styles.inputContainer}>
            <TextInput
              multiline={false}
              scrollEnabled={false}
              numberOfLines={1}
              maxLength={100}
              mode="outlined"
              label="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="done"
              error={!!formErrors.confirmPassword}
              right={
                <TextInput.Icon
                  icon={() => (
                    <Feather
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.gray}
                    />
                  )}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
            {formErrors.confirmPassword && (
              <Text style={Styles.fieldErrorText}>{formErrors.confirmPassword}</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Le mot de passe doit contenir :</Text>
            <View style={styles.requirementItem}>
              <Ionicons
                name={formData.newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={formData.newPassword.length >= 8 ? Colors.success : Colors.gray}
              />
              <Text style={[
                styles.requirementText,
                formData.newPassword.length >= 8 && styles.requirementTextValid
              ]}>
                Au moins 8 caractères
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons
                name={formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '' ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '' ? Colors.success : Colors.gray}
              />
              <Text style={[
                styles.requirementText,
                formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '' && styles.requirementTextValid
              ]}>
                Les deux mots de passe doivent correspondre
              </Text>
            </View>
          </View>

          {hasData() && (
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
                <Text style={Styles.btnPrimaryText}>Changer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={50} color={Colors.danger} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Erreur de validation</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              Veuillez vérifier les informations saisies et corriger les erreurs.
            </Text>

            {/* Button */}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.danger }]}
              onPress={() => setShowErrorModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Compris</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.success || Colors.primary} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Succès</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              Votre mot de passe a été modifié avec succès !
            </Text>
          </View>
        </View>
      </Modal>

      {/* Portal Dialogs for Web (replacing Alert) */}
      <Portal>
        {/* Submit Error Dialog */}
        <Dialog
          visible={showSubmitErrorDialog}
          onDismiss={() => setShowSubmitErrorDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.danger }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>{submitErrorMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => setShowSubmitErrorDialog(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 100,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
  },
  headerTitle: {
    fontSize: 20,
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
    paddingTop: Spacings.xxl,
  },

  // Requirements Styles
  requirementsContainer: {
    marginTop: Spacings.md,
    padding: Spacings.md,
    backgroundColor: Colors.grayLight || '#F5F5F5',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacings.xs,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginLeft: Spacings.xs,
  },
  requirementTextValid: {
    color: Colors.success || Colors.primary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: Spacings.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacings.lg,
  },
  modalButton: {
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xl,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});