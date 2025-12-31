// ContractView.tsx - Enhanced with API integration and multi-organization support
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import SignatureCanvas from 'react-native-signature-canvas';
import { useQuery } from '@tanstack/react-query';

import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { generateContract, signContract } from '../../services/v2/CartService';

interface ContractData {
  organization: string;
  pdfLinks: string[];
}

export const ContractView = ({ navigation, route }) => {
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

  // Fetch contract data
  const { data: contractData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => generateContract(),
  });

  // State management
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const [signatureBase64, setSignatureBase64] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // User info
  const [location, setLocation] = useState('');
  const [fullName, setFullName] = useState('');

  const webViewRef = useRef(null);

  // Get current PDF URL
  const getCurrentPdfUrl = () => {
    if (!contractData || contractData.length === 0) return null;
    const currentOrg = contractData[selectedOrgIndex];
    return currentOrg?.pdfLinks[selectedPdfIndex] || null;
  };

  // Handle organization tab change
  const handleOrgChange = (index: number) => {
    setSelectedOrgIndex(index);
    setSelectedPdfIndex(0); // Reset to first PDF when changing org
  };

  // Handle PDF pagination
  const handlePdfChange = (index: number) => {
    setSelectedPdfIndex(index);
  };

  // Handle when user finishes signing
  const handleSignature = (signature: string) => {
    setSignatureBase64(signature);
    setShowSignatureModal(false);
  };

  // Clear signature and sign again
  const handleClearSignature = () => {
    if (!signatureBase64) {
      setShowSignatureModal(true);
      return;
    }

    Alert.alert('Confirmation', 'Voulez-vous signer à nouveau ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Signer à nouveau',
        onPress: () => {
          setSignatureBase64('');
          setShowSignatureModal(true);
        },
      },
    ]);
  };

  // Open info modal to enter location and name
  const handleOpenInfoModal = () => {
    setShowInfoModal(true);
  };

  // Validate user info
  const validateUserInfo = () => {
    if (!location.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le lieu');
      return false;
    }
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return false;
    }
    return true;
  };

  // Submit all signed contracts
  const submitSignedContracts = async () => {
    // Validate
    if (!signatureBase64) {
      Alert.alert('Erreur', 'Veuillez signer avant d\'envoyer !');
      return;
    }

    if (!validateUserInfo()) {
      handleOpenInfoModal();
      return;
    }

    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir envoyer tous les devis signés ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setUploading(true);

              // Send to server
              const result = await signContract({
                signature: signatureBase64,
                location: location.trim(),
                fullName: fullName.trim(),
              });

              setUploading(false);

            } catch (error) {
              console.error('Error uploading:', error);
              Alert.alert('Erreur', 'Échec de l\'envoi : ' + error.message);
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Chargement des devis...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur de chargement</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No data state
  if (!contractData || contractData.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Aucun contrat disponible</Text>
      </View>
    );
  }

  const currentOrg = contractData[selectedOrgIndex];
  const currentPdfUrl = getCurrentPdfUrl();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Organization Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {contractData.map((org: ContractData, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                selectedOrgIndex === index && styles.tabActive,
              ]}
              onPress={() => handleOrgChange(index)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedOrgIndex === index && styles.tabTextActive,
                ]}
              >
                {org.organization}
              </Text>
              {org.pdfLinks.length > 1 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{org.pdfLinks.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PDF Pagination Indicator (if multiple PDFs in current org) */}
      {currentOrg.pdfLinks.length > 1 && (
        <View style={styles.pdfPaginationContainer}>
          <Text style={styles.pdfPaginationText}>
            Document {selectedPdfIndex + 1} sur {currentOrg.pdfLinks.length}
          </Text>
          <View style={styles.pdfPaginationDots}>
            {currentOrg.pdfLinks.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePdfChange(index)}
                style={[
                  styles.dot,
                  selectedPdfIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* PDF Viewer via WebView */}
      <View style={styles.pdfContainer}>
        {currentPdfUrl ? (
          <WebView
            ref={webViewRef}
            source={{ uri: currentPdfUrl }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement du PDF...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text>Aucun PDF disponible</Text>
          </View>
        )}
      </View>

      {/* Navigate between PDFs (if multiple) */}
      {currentOrg.pdfLinks.length > 1 && (
        <View style={styles.pdfNavigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              selectedPdfIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={() => handlePdfChange(selectedPdfIndex - 1)}
            disabled={selectedPdfIndex === 0}
          >
            <Text style={styles.navButtonText}>← Précédent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              selectedPdfIndex === currentOrg.pdfLinks.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={() => handlePdfChange(selectedPdfIndex + 1)}
            disabled={selectedPdfIndex === currentOrg.pdfLinks.length - 1}
          >
            <Text style={styles.navButtonText}>Suivant →</Text>
          </TouchableOpacity>
        </View>
      )}

      {(location || fullName || signatureBase64) && (
        <View style={styles.signatureSection}>
          <View style={styles.signatureHeader}>
            <Text style={styles.sectionTitle}>Signataire</Text>
          </View>
          {/* Signature preview */}
          {signatureBase64 && (
            <View style={styles.signatureImageWrapper}>
              <Image
                source={{ uri: signatureBase64 }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      )}

      {/* User Info Display */}
      {(location || fullName) && (
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>
            Lieu: <Text style={styles.infoValue}>{location}</Text>
          </Text>
          <Text style={styles.infoLabel}>
            Nom: <Text style={styles.infoValue}>{fullName}</Text>
          </Text>
        </View>
      )}

      {/* Compact Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.compactButtonRow}>
          <TouchableOpacity
            style={[styles.compactButton, styles.signButton]}
            onPress={handleClearSignature}
            disabled={uploading}
          >
            <FontAwesome6 name="signature" size={12} color={Colors.white} />
            <Text style={styles.compactButtonText}>
              {signatureBase64 ? 'Signature' : 'Signer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.compactButton, styles.infoButton]}
            onPress={handleOpenInfoModal}
            disabled={uploading}
          >
            <Ionicons name="person" size={12} color={Colors.white} />
            <Text style={styles.compactButtonText}>
              {location || fullName ? 'Modifier signataire' : 'Signataire'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!signatureBase64 || !location || !fullName || uploading) && styles.buttonDisabled,
          ]}
          onPress={submitSignedContracts}
          disabled={!signatureBase64 || uploading || !location || !fullName}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              Confirmer & Envoyer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Signature Modal */}
      <Modal visible={showSignatureModal} animationType="slide" transparent={false}>
        <View style={styles.signatureModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSignatureModal(false)}
            >
              <Text style={styles.cancelButtonText}>✕ Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.signatureTitle}>Signez ici</Text>
            <View style={{ width: 60 }} />
          </View>

          <SignatureCanvas
            onOK={handleSignature}
            onEmpty={() => {
              Alert.alert('Erreur', 'La signature ne peut pas être vide');
            }}
            descriptionText="Dessinez votre signature ci-dessous"
            clearText="Effacer"
            confirmText="✓ Confirmer"
            webStyle={`
              .m-signature-pad {
                box-shadow: none;
                border: none;
                margin: 0;
              }
              .m-signature-pad--body {
                border: 2px dashed #E0E0E0;
                border-radius: 10px;
                margin: 20px;
              }
              .m-signature-pad--footer {
                display: flex;
                justify-content: space-between;
                padding: 20px;
              }
              .m-signature-pad--footer .button {
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
              }
              .m-signature-pad--footer .button.clear {
                background-color: #E53935;
              }
              .m-signature-pad--footer .button.save {
                background-color: #43A047;
              }
            `}
          />
        </View>
      </Modal>

      {/* User Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowInfoModal(false)}
          />
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Informations du signataire</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoModalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ex: Paris, France"
                  placeholderTextColor={Colors.gray}
                  autoCapitalize="words"
                  maxLength={100}
                  numberOfLines={1}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ex: OrthoMater"
                  placeholderTextColor={Colors.gray}
                  autoCapitalize="words"
                  maxLength={100}
                  numberOfLines={1}
                />
              </View>

              <TouchableOpacity
                style={styles.infoModalButton}
                onPress={() => {
                  if (validateUserInfo()) {
                    setShowInfoModal(false);
                  }
                }}
              >
                <Text style={styles.infoModalButtonText}>✓ Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: Spacings.md,
  },
  retryButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingTop: Spacings.xs,
    paddingLeft: Spacings.xs,
  },
  tab: {
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  tabActive: {
    backgroundColor: Colors.info,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  tabTextActive: {
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.infoBackground,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.info,
  },

  // PDF Pagination
  pdfPaginationContainer: {
    backgroundColor: Colors.white,
    padding: Spacings.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  pdfPaginationText: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'Poppins-Regular'
  },
  pdfPaginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grayLight,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: Colors.info,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // PDF Viewer
  pdfContainer: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },

  // PDF Navigation
  pdfNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.grayLight,
  },
  navButton: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.blue,
    borderRadius: 6,
  },
  navButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: 'Poppins-Regular',
  },

  // Signature Section
  signatureSection: {
    backgroundColor: Colors.white,
    padding: Spacings.xs,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  signatureImageWrapper: {
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    padding: 8,
    height: 80,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },

  // Info Section
  infoSection: {
    backgroundColor: '#FFF',
    paddingLeft: Spacings.xs,
    marginBottom: Spacings.sm
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.gray,
    fontFamily: 'Poppins-Regular',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: Colors.text,
  },

  // Compact Controls
  controlsContainer: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.xs,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  compactButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacings.xs,
    gap: Spacings.xs
  },
  compactButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  signButton: {
    backgroundColor: Colors.warning,
  },
  infoButton: {
    backgroundColor: Colors.blue,
  },
  compactButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },

  // Signature Modal
  signatureModalContainer: {
    flex: 1,
    marginTop: Spacings.xxxl,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  signatureTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  cancelButton: {},
  cancelButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },

  // Info Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoModalContainer: {
    backgroundColor: Colors.white,
    paddingBottom: Spacings.lg,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  infoModalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  closeModalText: {
    fontSize: 24,
    color: Colors.gray,
    fontWeight: '300',
  },
  infoModalContent: {
    padding: Spacings.md,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginBottom: Spacings.xxs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.grayLight,
  },
  infoModalButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacings.sm,
  },
  infoModalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});