import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { palette } from '../lib/Theme';

// Reusable "Guide Patient" modal. Shows a pre-rendered QR image (not
// generated from the URL, per spec) plus a link the user can open
// externally. The Imprimer action captures the QR view as a PNG and
// hands it to the system share sheet — from there the user picks the
// Print destination on iOS or Android.
export const GuidePatientModal = ({
  visible,
  onClose,
  protocolTitle,
  qrImageUri,
  guideUrl,
}: {
  visible: boolean;
  onClose: () => void;
  protocolTitle: string | null;
  qrImageUri: string;
  guideUrl: string;
}) => {
  // Ref on the wrapper View that holds the QR image. captureRef reads
  // the pixel content of this node; collapsable={false} makes sure
  // Android keeps it in the view hierarchy (RN can flatten single-
  // child Views away otherwise).
  const qrRef = useRef<View>(null);
  const [printing, setPrinting] = useState(false);

  const handleOpenExternal = async () => {
    try {
      const supported = await Linking.canOpenURL(guideUrl);
      if (supported) await Linking.openURL(guideUrl);
    } catch { /* silent — nothing the user can do here */ }
  };

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Imprimer le Guide Patient',
          UTI: 'public.png',
        });
      }
    } catch {
      // silent: user cancels or capture fails — no need to nag
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside the card to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          {/* Header — title + subtitle (protocol name) */}
          <View style={styles.header}>
            <Text style={styles.title}>Guide Patient</Text>
            {protocolTitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {protocolTitle}
              </Text>
            )}
          </View>

          {/* QR image — wrapped in ref'd View so captureRef can snapshot
              only this section. White padding so the printed image has
              a clean quiet-zone around the code. */}
          <View
            ref={qrRef}
            collapsable={false}
            style={styles.qrWrap}
          >
            <Image
              source={{ uri: qrImageUri }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Link row — text + external-open icon button. Tap either
              the row itself or the icon opens the URL in the OS browser. */}
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={handleOpenExternal}
          >
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {guideUrl}
            </Text>
            <View style={styles.externalBtn}>
              <Ionicons name="open-outline" size={16} color="#3B82F6" />
            </View>
          </TouchableOpacity>

          {/* Action row — Fermer (left, secondary) + Imprimer (right, primary) */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnTextSecondary}>Fermer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                printing && styles.actionBtnPrimaryBusy,
              ]}
              onPress={handlePrint}
              activeOpacity={0.85}
              disabled={printing}
            >
              {printing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="print-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.actionBtnTextPrimary}>Imprimer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: palette.cardBg,
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 17,
  },

  qrWrap: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 14,
  },
  qrImage: {
    width: 220,
    height: 220,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 18,
    width: '100%',
  },
  linkText: {
    flex: 1,
    fontSize: 11,
    color: palette.textSecondary,
  },
  externalBtn: {
    padding: 2,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
  },
  actionBtnSecondary: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnPrimary: {
    backgroundColor: '#3B82F6',
  },
  actionBtnPrimaryBusy: {
    opacity: 0.75,
  },
  actionBtnTextSecondary: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});