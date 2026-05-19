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
  caption?: string;        // shown above the QR
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
        {/* Inner Pressable stops the tap from propagating to the backdrop */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* QR card — this is the View that gets captured */}
          <View ref={qrCardRef} collapsable={false} style={styles.qrCard}>
            <Text style={styles.title}>Partager les filtres</Text>
            {!!caption && <Text style={styles.caption}>{caption}</Text>}

            <View style={styles.qrWrap}>
              <QRCode
                value={url}
                size={220}
                backgroundColor="#FFFFFF"
                color={palette.textPrimary}
              />
            </View>

            <Text style={styles.urlPreview} numberOfLines={2}>
              {url}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, sharing && styles.saveBtnDisabled]}
              onPress={handleShare}
              activeOpacity={0.85}
              disabled={sharing}
            >
              <Ionicons name="share-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>
                {sharing ? 'Partage…' : 'Partager'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
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
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: palette.cardBg,
    borderRadius: 20,
    padding: 18,
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
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  caption: {
    fontSize: 12.5,
    color: palette.textSecondary,
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
    fontSize: 10.5,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: 'transparent',
  },
  closeText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});