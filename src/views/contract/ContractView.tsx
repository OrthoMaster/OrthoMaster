// ContractView.tsx - WORKS WITH EXPO GO
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import SignatureCanvas from 'react-native-signature-canvas';

const PDF_URL = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/quotations/Devis.pdf';
const UPLOAD_API_URL = 'https://your-api.com/api/contracts/upload';

export const ContractView = ({ navigation, route }) => {
  const [signatureBase64, setSignatureBase64] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const webViewRef = useRef(null);

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

  // Upload signature to server
  const uploadSignature = async () => {
    if (!signatureBase64) {
      Alert.alert('Erreur', 'Veuillez signer avant d\'envoyer !');
      return;
    }

    Alert.alert('Confirmation', 'Êtes-vous sûr de vouloir envoyer le contrat signé ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            setUploading(true);

            // Send signature + PDF URL to server
            // Server will handle merging signature into PDF
            const response = await fetch(UPLOAD_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_TOKEN',
              },
              body: JSON.stringify({
                pdfUrl: PDF_URL,
                signature: signatureBase64,
                signaturePosition: {
                  x: 400,
                  y: 100,
                  page: 0,
                },
              }),
            });

            const result = await response.json();

            if (response.ok) {
              Alert.alert('Succès', 'Le contrat a été envoyé au serveur !');
              console.log('Upload result:', result);
            } else {
              Alert.alert('Erreur', 'Impossible d\'envoyer au serveur');
            }
          } catch (error) {
            console.error('Error uploading:', error);
            Alert.alert('Erreur', 'Échec de l\'envoi : ' + error.message);
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* PDF Viewer via WebView */}
      <View style={styles.pdfContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: PDF_URL }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement du PDF...</Text>
            </View>
          )}
        />
      </View>

      {/* Signature preview - Display below PDF */}
      {signatureBase64 && (
        <View style={styles.signatureSection}>
          <View style={styles.signatureHeader}>
            <Text style={styles.sectionTitle}>✓ Votre signature</Text>
            <TouchableOpacity onPress={handleClearSignature}>
              <Text style={styles.editText}>Modifier</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.signatureImageWrapper}>
            <Image
              source={{ uri: signatureBase64 }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.signatureNote}>
            * Cette signature sera jointe au contrat lors de la confirmation
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.signButton]}
          onPress={handleClearSignature}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {signatureBase64 ? '✏️ Signer à nouveau' : '✍️ Signer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            (!signatureBase64 || uploading) && styles.buttonDisabled,
          ]}
          onPress={uploadSignature}
          disabled={!signatureBase64 || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>✓ Confirmer et Envoyer</Text>
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
                background-color: #FF5252;
              }
              .m-signature-pad--footer .button.save {
                background-color: #4CAF50;
              }
            `}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
  signatureSection: {
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    maxHeight: 220,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  editText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  signatureImageWrapper: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    padding: 10,
    marginBottom: 8,
  },
  signatureImage: {
    width: '100%',
    height: 100,
  },
  signatureNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  signButton: {
    backgroundColor: '#2196F3',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signatureModalContainer: {
    flex: 1,
    marginTop: 120,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  signatureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});