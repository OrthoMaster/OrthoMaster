// ContractView.web.tsx - Web version
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import { Portal, Dialog, Button } from 'react-native-paper';

import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import CelebrationContractScreen from '../company/components/CelebrationContractScreen';

import { generateContract, signContract } from '../../services/v2/CartService';

interface ContractData {
  group: string;
  pdfLinks: string[];
}

export const ContractView = ({ navigation, route }) => {
  // Query client
  const queryClient = useQueryClient();

  // Refs
  const signatureRef = useRef<SignatureCanvas>(null);

  // Get cart Id from route params
  const { cartId } = route.params;

  // Fetch contract data
  const { data: contractData, isLoading, error, refetch } = useQuery({
    queryKey: ['contract'],
    queryFn: () => generateContract(),
    retry: 2,
    retryDelay: 1000,
  });

  const [pdfLoading, setPdfLoading] = useState(false);

  // All other state management
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const [signatureBase64, setSignatureBase64] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [uploading, setUploading] = useState(false);

  // User info
  const [location, setLocation] = useState('');
  const [fullName, setFullName] = useState('');

  // Dialog states
  const [dialogs, setDialogs] = useState({
    emptySignature: false,
    confirmResign: false,
    emptyLocation: false,
    emptyName: false,
    confirmSubmit: false,
    error: false,
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Helper to show/hide dialogs
  const showDialog = (dialogName: string) => {
    setDialogs(prev => ({ ...prev, [dialogName]: true }));
  };

  const hideDialog = (dialogName: string) => {
    setDialogs(prev => ({ ...prev, [dialogName]: false }));
  };

  // Get current PDF URL
  const getCurrentPdfUrl = () => {
    if (!contractData || contractData.length === 0) return null;
    const currentOrg = contractData[selectedOrgIndex];
    return currentOrg?.pdfLinks[selectedPdfIndex] || null;
  };

  // Handle group tab change
  const handleOrgChange = (index: number) => {
    setSelectedOrgIndex(index);
    setSelectedPdfIndex(0);
  };

  // Handle PDF pagination
  const handlePdfChange = (index: number) => {
    setSelectedPdfIndex(index);
  };

  // Handle when user finishes signing
  const handleSaveSignature = () => {
    if (signatureRef.current?.isEmpty()) {
      showDialog('emptySignature');
      return;
    }

    const signature = signatureRef.current?.toDataURL();
    if (signature) {
      setSignatureBase64(signature);
      setShowSignatureModal(false);
    }
  };

  // Clear signature canvas
  const handleClearCanvas = () => {
    signatureRef.current?.clear();
  };

  // Clear signature and sign again
  const handleClearSignature = () => {
    if (!signatureBase64) {
      setShowSignatureModal(true);
      return;
    }

    showDialog('confirmResign');
  };

  // Open info modal to enter location and name
  const handleOpenInfoModal = () => {
    setShowInfoModal(true);
  };

  // Validate user info
  const validateUserInfo = () => {
    if (!location.trim()) {
      showDialog('emptyLocation');
      return false;
    }
    if (!fullName.trim()) {
      showDialog('emptyName');
      return false;
    }
    return true;
  };

  // Submit all signed contracts
  const submitSignedContracts = async () => {
    // Validate
    if (!signatureBase64) {
      setErrorMessage('Veuillez signer avant d\'envoyer !');
      showDialog('error');
      return;
    }

    if (!validateUserInfo()) {
      handleOpenInfoModal();
      return;
    }

    showDialog('confirmSubmit');
  };

  // Execute submit after confirmation
  const executeSubmit = async () => {
    hideDialog('confirmSubmit');

    try {
      setUploading(true);

      // Send to server
      const result = await signContract({
        cartId: cartId,
        signature: signatureBase64,
        location: location.trim(),
        fullName: fullName.trim(),
      });

      // Show celebration modal
      setShowCelebration(true);
      await queryClient.invalidateQueries({ queryKey: ['company'] });

    } catch (error) {
      setErrorMessage('Échec de l\'envoi : ' + error.message);
      showDialog('error');
    } finally {
      setUploading(false);
    }
  };

  // Handle close celebration
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    navigation.popToTop();
  };

  const handleViewContracts = () => {
    setShowCelebration(false);
    navigation.navigate('profile', { screen: 'document-view' });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Chargement des devis ...</Text>
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
        <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Retourner</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Dossiers</Text>
            <Text style={styles.headerSubtitle}>Signez les documents</Text>
          </View>
        </View>
      </View>

      {/* Two Column Layout */}
      <View style={styles.bodyContainer}>
        {/* Left Column - PDF Viewer */}
        <View style={styles.leftColumn}>
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
                    {org.group}
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

          {/* PDF Viewer - Web iframe */}
          <View style={styles.pdfContainer}>
            {currentPdfUrl ? (
              <View style={styles.iframeContainer}>
                <iframe
                  src={currentPdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title="PDF Viewer"
                  onLoad={() => setPdfLoading(false)}
                />
                {pdfLoading && (
                  <View style={styles.pdfLoadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.info} />
                    <Text style={styles.loadingText}>Chargement du PDF...</Text>
                  </View>
                )}
              </View>
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
        </View>

        {/* Right Column - Signature Controls */}
        <ScrollView style={styles.rightColumn} showsVerticalScrollIndicator={false}>
          {/* Signature Section */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureHeader}>
              <Text style={styles.sectionTitle}>Signataire</Text>
            </View>
            {/* Signature preview */}

            <View style={styles.signatureImageWrapper}>
              {signatureBase64 && (
                <Image
                  source={{ uri: signatureBase64 }}
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>

          {/* User Info Display */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>
              Lieu: <Text style={styles.infoValue}>{location}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Nom: <Text style={styles.infoValue}>{fullName}</Text>
            </Text>
          </View>

          {/* Compact Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.compactButtonRow}>
              <TouchableOpacity
                style={[styles.compactButton, styles.signButton]}
                onPress={handleClearSignature}
                disabled={uploading}
              >
                <FontAwesome6 name="signature" size={16} color={Colors.white} />
                <Text style={styles.compactButtonText}>
                  {signatureBase64 ? 'Modifier signature' : 'Signer'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactButton, styles.infoButton]}
                onPress={handleOpenInfoModal}
                disabled={uploading}
              >
                <Ionicons name="person" size={16} color={Colors.white} />
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
        </ScrollView>
      </View>

      {/* User Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
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
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ex: OrthoMaster"
                  placeholderTextColor={Colors.gray}
                  autoCapitalize="words"
                  maxLength={100}
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
        </View>
      </Modal>

      {/* Celebration Screen */}
      <CelebrationContractScreen
        visible={showCelebration}
        onViewDevis={handleViewContracts}
        onClose={handleCelebrationClose}
      />

      {/* Signature Modal */}
      <Modal visible={showSignatureModal} animationType="slide" transparent={false}>
        <View style={styles.signatureModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.signatureTitle}>Signez ici</Text>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
              <Text style={styles.cancelButtonText}>✕ Annuler</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.canvasWrapper}>
            <View style={styles.canvasContainer}>
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  style: {
                    width: '100%',
                    height: '100%',
                  }
                }}
                penColor="rgb(0, 0, 0)"
                minWidth={1.5}
                maxWidth={3}
              />
            </View>

            <View style={styles.signatureControls}>
              <TouchableOpacity
                style={[styles.signatureControlButton, styles.clearButton]}
                onPress={handleClearCanvas}
              >
                <Text style={styles.signatureControlButtonText}>Effacer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signatureControlButton, styles.saveButton]}
                onPress={handleSaveSignature}
              >
                <Text style={styles.signatureControlButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paper Dialogs */}
      <Portal>
        {/* Empty Signature Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.emptySignature} onDismiss={() => hideDialog('emptySignature')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>La signature ne peut pas être vide</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('emptySignature')}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirm Resign Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.confirmResign} onDismiss={() => hideDialog('confirmResign')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.warning }]}>Confirmation</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Voulez-vous signer à nouveau ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('confirmResign')}>Annuler</Button>
            <Button textColor={Colors.warning} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => {
                hideDialog('confirmResign');
                setSignatureBase64('');
                setShowSignatureModal(true);
              }}>
              Signer à nouveau
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Empty Location Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.emptyLocation} onDismiss={() => hideDialog('emptyLocation')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Veuillez entrer le lieu</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('emptyLocation')}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Empty Name Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.emptyName} onDismiss={() => hideDialog('emptyName')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Veuillez entrer votre nom complet</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('emptyName')}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirm Submit Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.confirmSubmit} onDismiss={() => hideDialog('confirmSubmit')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.warning }]}>Confirmation</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Êtes-vous sûr de vouloir envoyer tous les devis signés ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('confirmSubmit')}>Annuler</Button>
            <Button textColor={Colors.warning} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={executeSubmit}>Confirmer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog style={Styles.dialogWeb} visible={dialogs.error} onDismiss={() => hideDialog('error')}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>{errorMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => hideDialog('error')}>Fermer</Button>
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
  centerContainer: {
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
    marginBottom: Spacings.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
  returnButton: {
    backgroundColor: Colors.gray,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
  },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    height: 80,
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },

  // Two Column Layout
  bodyContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1.5,
    backgroundColor: Colors.grayLight,
  },
  rightColumn: {
    flex: 0.5,
    backgroundColor: Colors.white,
    borderLeftWidth: 1,
    borderLeftColor: Colors.line,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingTop: Spacings.xs,
    paddingLeft: Spacings.md,
  },
  tab: {
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    marginRight: Spacings.xs,
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: Colors.blue,
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
  pdfLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
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
  iframeContainer: {
    flex: 1,
    position: 'relative',
  },

  // PDF Navigation
  pdfNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  navButton: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.blue,
    borderRadius: 6,
  },
  navButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },

  // Signature Section
  signatureSection: {
    backgroundColor: Colors.white,
    padding: Spacings.md,
    margin: Spacings.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  signatureImageWrapper: {
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    padding: 12,
    height: 120,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },

  // Info Section
  infoSection: {
    backgroundColor: Colors.white,
    padding: Spacings.md,
    marginHorizontal: Spacings.md,
    marginBottom: Spacings.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Poppins-Regular',
    marginBottom: Spacings.xs,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  // Compact Controls
  controlsContainer: {
    marginHorizontal: Spacings.md,
    backgroundColor: Colors.white,
  },
  compactButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacings.md,
    gap: Spacings.md
  },
  compactButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.md,
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
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacings.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },

  // Signature Modal
  signatureModalContainer: {
    flex: 1,
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
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  cancelButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  canvasWrapper: {
    flex: 1,
    padding: Spacings.md,
  },
  canvasContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: 8,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  signatureControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacings.md,
    gap: Spacings.md,
  },
  signatureControlButton: {
    flex: 1,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: Colors.danger,
  },
  saveButton: {
    backgroundColor: Colors.success,
  },
  signatureControlButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },

  // Info Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    outlineStyle: 'none' as any,
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