import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Portal, Dialog, Button } from 'react-native-paper';

import { useQueryClient } from '@tanstack/react-query';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { updateCompany } from '../../services/v2/CompanyService';

interface FormData {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  siret: string;
}
interface FormErrors {
  name?: string;
  email?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  siret?: string;
}

export const CompanyInfoView = ({ navigation, route }) => {
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
  const { mode, company, estabs } = route.params || {};

  // Init data
  const [initialData, setInitialData] = useState<FormData>({
    id: company?.id || '',
    name: company?.name || '',
    type: company?.establishment_id || '',
    email: company?.email,
    phone: company?.phone,
    address: company?.address,
    postalCode: company?.postal_code,
    city: company?.city,
    country: company?.country,
    siret: company?.siret,
  });

  // Form data
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    id: company?.id || '',
    name: company?.name || '',
    type: company?.establishment_id || '',
    email: company?.email,
    phone: company?.phone,
    address: company?.address,
    postalCode: company?.postal_code,
    city: company?.city,
    country: company?.country,
    siret: company?.siret,
  });

  // Check changes
  const hasChanges = useCallback(() => {
    return (
      formData.name !== initialData.name ||
      formData.type !== initialData.type ||
      formData.email !== initialData.email ||
      formData.phone !== initialData.phone ||
      formData.address !== initialData.address ||
      formData.postalCode !== initialData.postalCode ||
      formData.city !== initialData.city ||
      formData.country !== initialData.country ||
      formData.siret !== initialData.siret
    );
  }, [formData, initialData]);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Alert Dialog state
  const [alertDialog, setAlertDialog] = useState({
    visible: false,
    title: '',
    message: ''
  });

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Always clear field error
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate name
    if (!formData.name) {
      errors.name = "Veuillez saisir le nom de l'establissement !";
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Veuillez saisir une adresse email !';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez saisir une adresse email valide !';
    }

    if (!formData.postalCode.trim()) {
      errors.postalCode = "Veuillez saisir le code postal !";
    }
    if (!formData.city.trim()) {
      errors.city = "Veuillez saisir la ville !";
    }
    if (!formData.country.trim()) {
      errors.country = "Veuillez saisir le pays !";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectType = (value: string) => {
    handleInputChange('type', value);
    setShowTypeModal(false);
  };

  const getSelectedTypeLabel = () => {
    const selected = estabs.find(t => t.id === formData.type);
    return selected?.name || '';
  };

  const back = () => {
    mode !== 'create'
      ? navigation.pop()
      : navigation.navigate('profile', { screen: 'account-home' });
  };

  const showAlert = (title: string, message: string) => {
    setAlertDialog({
      visible: true,
      title,
      message
    });
  };

  const hideAlert = () => {
    setAlertDialog({
      visible: false,
      title: '',
      message: ''
    });
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      setShowErrorModal(true);
      return false;
    }

    try {
      const result = await updateCompany({
        id: formData.id,
        name: formData.name,
        establishment_id: formData.type,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postalCode,
        city: formData.city,
        country: formData.country,
        siret: formData.siret,
      });

      if (result?.success) {
        await queryClient.invalidateQueries({ queryKey: ['company'] });
        navigation.goBack();
      } else {
        showAlert('Erreur', result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      showAlert('Erreur', error.message);
    }

    return;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={back}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode == 'create' ? 'Créer Espace Pro' : 'Établissement'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasChanges() ? 120 : Spacings.md }}>

        <View style={styles.webLayout}>
          <View style={styles.leftColumn}>

            <Text style={styles.sectionTitle}>Identité</Text>

            {/* Name */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={100}
                mode="outlined"
                label="Nom de l'établissement"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoCapitalize="none"
                disabled={false}
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

            {/* Type */}
            <View style={Styles.inputContainer}>
              <TouchableOpacity
                onPress={() => setShowTypeModal(true)}
                activeOpacity={0.7}
              >
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    label="Type d'établissement"
                    value={getSelectedTypeLabel()}
                    editable={false}
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <Ionicons
                            name="chevron-down"
                            size={20}
                            color={Colors.text}
                            onPress={() => setShowTypeModal(true)}
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
                textContentType="emailAddress"
                disabled={false}
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
                disabled={false}
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

          </View>
          <View style={styles.rightColumn}>

            <Text style={styles.sectionTitle}>Adresse</Text>
            {/* Address */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={100}
                mode="outlined"
                label="Adresse"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                autoCapitalize="none"
                disabled={false}
                returnKeyType="next"
                error={false}
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

            {/* Postal Code */}
            <View style={Styles.inputContainer}>
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
                disabled={false}
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
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={100}
                mode="outlined"
                label="Ville"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                autoCapitalize="none"
                disabled={false}
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
                autoCapitalize="none"
                disabled={false}
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

            <Text style={styles.sectionTitle}>Légal</Text>
            {/* SIRET */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={14}
                mode="outlined"
                label="Numéro SIRET"
                value={formData.siret}
                onChangeText={(value) => handleInputChange('siret', value)}
                autoCapitalize="none"
                disabled={false}
                returnKeyType="next"
                error={!!formErrors.siret}
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

              {formErrors.siret && (
                <Text style={Styles.fieldErrorText}>{formErrors.siret}</Text>
              )}
            </View>

          </View>
        </View>
      </ScrollView>
      {hasChanges() &&
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              Styles.btnBottom,
              // login.isPending && Styles.btnDisabled
            ]}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <Text style={Styles.btnPrimaryText}>
              {mode == 'create' ? 'Créer' : 'Modifiér'}
            </Text>
          </TouchableOpacity>
        </View>
      }

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Type d'établissement</Text>
              <TouchableOpacity
                onPress={() => setShowTypeModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView style={styles.optionsList}>
              {estabs.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.optionItem}
                  onPress={() => handleSelectType(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionItemLabel}>
                    <Image
                      source={{ uri: process.env.EXPO_PUBLIC_S3_URL + type.image }}
                      style={{
                        width: 40,
                        height: 40,
                      }}
                      resizeMode="contain"
                    />
                    <Text style={formData.type === type.id ? styles.selectedOptionText : styles.optionText}>{type.name}</Text>
                  </View>
                  {formData.type === type.id && (
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

      {/* Alert Dialog using Portal */}
      <Portal>
        <Dialog
          visible={alertDialog.visible}
          onDismiss={hideAlert}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>{alertDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>{alertDialog.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideAlert} textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
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
  content: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.lg,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: 600,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    height: 100,
    backgroundColor: Colors.grayLight,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  optionsList: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.xxxl
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  optionItemLabel: {
    flexDirection: 'row',
    gap: Spacings.md,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },
  selectedOptionText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
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
  errorIconContainer: {
    marginBottom: Spacings.md,
  },
  errorModalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.sm,
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

  webLayout: {
    flexDirection: 'row',
    padding: Spacings.xl,
    gap: Spacings.xl,
    alignSelf: 'center',
    width: '100%',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
});