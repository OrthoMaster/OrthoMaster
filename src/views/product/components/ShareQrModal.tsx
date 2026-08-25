import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { palette } from '../lib/Theme';

type ShareQrModalProps = {
  visible: boolean;
  onClose: () => void;
  url: string;             // pre-built URL — what the QR encodes
};

export function ShareQrModal({ visible, onClose, url, caption }: ShareQrModalProps) {
  // Ref to the View that wraps the QR — captured to PNG on Save.
  const qrCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      // Render the QR card View into a temporary PNG file.
      // We capture the inner card ref, NOT the modal/screen — output is
      // exactly the QR + title + caption, no status bar, no backdrop.
      const uri = await captureRef(qrCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Open native share sheet — user picks Photos / Messages / Mail / etc.
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Indisponible', 'Le partage n’est pas disponible sur cet appareil.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager le QR code',
        UTI: 'public.png',     // iOS hint
      });
    } catch (err) {
      Alert.alert('Erreur', "Impossible de partager l'image.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {/* Close button sits on the sheet, OUTSIDE qrCardRef — captureRef
              only renders that ref's subtree, so neither this nor the
              share button ends up in the exported PNG. */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={8}
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={26} color={palette.textSecondary} />
          </TouchableOpacity>

          {/* QR card — this is the View that gets captured */}
          <View ref={qrCardRef} collapsable={false} style={styles.qrCard}>
            <Text style={styles.title}>Liste de dispositifs</Text>
            <Text style={styles.caption}>{"Scanner ce code permet de voir\nla liste des dispositifs sélectionnés"}</Text>

            <View style={styles.qrWrap}>
              <QRCode
                value={url}
                size={220}
                backgroundColor="#FFFFFF"
                color={palette.textPrimary}
              />
            </View>

            <Text style={styles.urlPreview}>{"Ce code ne fonctionne qu'avec l'application ORTHOMASTER ouverte."}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveBtn, sharing && styles.saveBtnDisabled]}
              onPress={handleShare}
              activeOpacity={0.85}
              disabled={sharing}
            >
              <Ionicons name="share-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveText}>
                {sharing ? 'Préparation...' : 'Partager / Télécharger'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: palette.textSecondary,
    width: '80%',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  qrWrap: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  urlPreview: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Roboto',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    width: 220,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: palette.cardBg,
    borderRadius: 20,
    padding: 16,
    // Lets the close button overhang the top-right corner.
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: palette.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
});