import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { palette } from '../lib/Theme';

// Web-only style prop not present in React Native's type definitions.
const webClickable = { cursor: 'pointer' } as any;

// Reusable "Guide Patient" modal (web). Shows a pre-rendered QR image
// plus a link the user can open externally. On web, Imprimer opens a
// print window containing the QR image and triggers the browser's print
// dialog — no view capture or native share sheet needed.
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
  const [printing, setPrinting] = useState(false);

  const handleOpenExternal = async () => {
    try {
      const supported = await Linking.canOpenURL(guideUrl);
      if (supported) await Linking.openURL(guideUrl);
    } catch { /* silent — nothing the user can do here */ }
  };

  // Web print: open a small window containing just the QR image (and a
  // caption), wait for the image to load, then invoke the print dialog.
  const handlePrint = () => {
    if (printing) return;
    setPrinting(true);
    try {
      const win = window.open('', '_blank', 'width=520,height=640');
      if (!win) {
        setPrinting(false);
        return;
      }

      const safeTitle = (protocolTitle ?? 'Guide Patient')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const safeUrl = guideUrl
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // The window prints once the image finishes loading. onafterprint
      // closes it. We also guard with a timeout in case the image can't
      // load, so the window doesn't hang open forever.
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Guide Patient</title>
            <meta charset="utf-8" />
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, Segoe UI, Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 32px;
                text-align: center;
              }
              h1 { font-size: 20px; margin-bottom: 4px; }
              p.subtitle { font-size: 14px; color: #555; margin-bottom: 20px; }
              img { width: 300px; height: 300px; object-fit: contain; }
              p.url { font-size: 12px; color: #666; margin-top: 16px; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1>Guide Patient</h1>
            <p class="subtitle">${safeTitle}</p>
            <img id="qr" src="${qrImageUri}" alt="QR Guide Patient" />
            <p class="url">${safeUrl}</p>
            <script>
              var img = document.getElementById('qr');
              function doPrint() { window.focus(); window.print(); }
              img.onload = doPrint;
              img.onerror = doPrint;
              // Fallback if the image is cached and onload doesn't fire.
              setTimeout(doPrint, 1200);
              window.onafterprint = function () { window.close(); };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } catch {
      // silent — popup blocked or write failed
    } finally {
      // Reset the busy state shortly after; the print dialog is handled
      // by the child window from here on.
      setTimeout(() => setPrinting(false), 800);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Guide Patient</Text>
            {protocolTitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {protocolTitle}
              </Text>
            )}
          </View>

          {/* QR image */}
          <View style={styles.qrWrap}>
            <Image
              source={{ uri: qrImageUri }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Link row */}
          <TouchableOpacity
            style={[styles.linkRow, webClickable]}
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

          {/* Action row — Fermer + Imprimer */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary, webClickable]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnTextSecondary}>Fermer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                webClickable,
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
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
    }),
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