import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { palette } from '../lib/Theme';

// Web-only style prop not present in React Native's type definitions.
const webClickable = { cursor: 'pointer' } as any;

type ShareQrModalProps = {
  visible: boolean;
  onClose: () => void;
  url: string;             // pre-built URL — what the QR encodes
  caption?: string;        // shown above the QR
};

// Convert a base64 PNG data URL into a Blob for the Clipboard API.
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function ShareQrModal({ visible, onClose, url, caption }: ShareQrModalProps) {
  // react-native-qrcode-svg exposes a toDataURL(cb) method via this ref;
  // it hands back a base64 PNG string we can turn into a clipboard image.
  const qrRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      // 1. Ask the QR component for a PNG data URL (base64, no prefix).
      const base64: string = await new Promise((resolve, reject) => {
        if (!qrRef.current?.toDataURL) {
          reject(new Error('QR ref not ready'));
          return;
        }
        qrRef.current.toDataURL((data: string) => resolve(data));
      });

      const dataUrl = base64.startsWith('data:')
        ? base64
        : `data:image/png;base64,${base64}`;

      // 2. Turn it into a Blob and write it to the clipboard as an image.
      const blob = dataUrlToBlob(dataUrl);

      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof (window as any).ClipboardItem !== 'undefined'
      ) {
        const item = new (window as any).ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: copy the URL text if image clipboard isn't supported.
        await navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // Last-resort fallback — copy the URL text so the user still gets
      // something useful on the clipboard.
      try {
        await navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // give up silently
      }
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner Pressable stops the tap from propagating to the backdrop */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* QR card */}
          <View style={styles.qrCard}>
            <Text style={styles.title}>Partager la liste des produits</Text>
            {!!caption && <Text style={styles.caption}>{caption}</Text>}

            <View style={styles.qrWrap}>
              <QRCode
                value={url}
                size={220}
                backgroundColor="#FFFFFF"
                color={palette.textPrimary}
                getRef={(c: any) => { qrRef.current = c; }}
              />
            </View>

            <Text style={styles.urlPreview} numberOfLines={2}>
              {url}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.closeBtn, webClickable]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, webClickable, copying && styles.saveBtnDisabled]}
              onPress={handleCopy}
              activeOpacity={0.85}
              disabled={copying}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.saveText}>
                {copied ? 'Copié' : copying ? 'Copie…' : 'Copier'}
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
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
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