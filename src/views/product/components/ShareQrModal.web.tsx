import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { palette } from '../lib/Theme';

// ============================================================
// Web sibling of ShareQrModal.tsx.
//
// Three things from the native file don't exist on web:
//
//   expo-sharing            isAvailableAsync() is false on web. Replaced
//                           by a download link, plus navigator.share when
//                           the browser supports sharing files (mostly
//                           mobile Safari/Chrome).
//   react-native-view-shot  captureRef has no web implementation. The
//                           card is redrawn on a <canvas> instead, which
//                           also gives a crisper 2x export than a
//                           screenshot would.
//   Alert.alert             not implemented in react-native-web. Errors
//                           and confirmations show as a line under the
//                           button.
// ============================================================

const clickable = { cursor: 'pointer' } as unknown as ViewStyle;

const FILE_NAME = 'orthomaster-qr.png';
const QR_SIZE = 220;

// Canvas export geometry, in CSS pixels before the 2x scale.
const EXPORT = {
  scale: 2,
  width: 460,
  padding: 30,
  qr: 300,
  titleSize: 25,
  captionSize: 15,
  footerSize: 13,
};

type ShareQrModalProps = {
  visible: boolean;
  onClose: () => void;
  url: string;             // pre-built URL — what the QR encodes
  caption?: string;
};

const TITLE = 'Liste de dispositifs';
const CAPTION = 'Scanner ce code permet de voir\nla liste des dispositifs sélectionnés';
const FOOTER = "Ce code ne fonctionne qu'avec l'application ORTHOMASTER ouverte.";

type Status = { tone: 'ok' | 'error'; text: string } | null;

export function ShareQrModal({ visible, onClose, url, caption }: ShareQrModalProps) {
  // Wraps the QR so we can reach the <svg> element react-native-svg
  // renders into the DOM. On web a View ref *is* the DOM node.
  const qrWrapRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  // Label swap after a successful copy, reverted on a timer so the button
  // doesn't stay stuck in the confirmed state.
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopied = useCallback(() => {
    if (copiedTimer.current) {
      clearTimeout(copiedTimer.current);
      copiedTimer.current = null;
    }
    setCopied(false);
  }, []);

  useEffect(() => clearCopied, [clearCopied]);

  const captionText = caption ?? CAPTION;

  useEffect(() => {
    if (!visible) {
      setStatus(null);
      clearCopied();
    }
  }, [visible, clearCopied]);

  // Escape closes — expected on web, and Modal doesn't wire it up.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const buildPng = useCallback(async (): Promise<Blob> => {
    const host = qrWrapRef.current as unknown as HTMLElement | null;
    const svgEl = host?.querySelector?.('svg');
    if (!svgEl) throw new Error('QR introuvable');

    const xml = new XMLSerializer().serializeToString(svgEl);
    const img = await loadImage(
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml),
    );

    const { scale, width, padding, qr, titleSize, captionSize, footerSize } = EXPORT;
    const innerW = width - padding * 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');

    // Measure first so the canvas is exactly as tall as the content.
    ctx.font = `500 ${captionSize}px Poppins, system-ui, sans-serif`;
    const captionLines = captionText.split('\n').flatMap(l => wrapText(ctx, l, innerW));
    ctx.font = `400 ${footerSize}px Roboto, system-ui, sans-serif`;
    const footerLines = wrapText(ctx, FOOTER, innerW);

    const height =
      padding +
      titleSize + 14 +
      captionLines.length * (captionSize + 6) + 16 +
      qr + 18 +
      footerLines.length * (footerSize + 5) +
      padding;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let y = padding;

    ctx.fillStyle = palette.textPrimary;
    ctx.font = `700 ${titleSize}px Poppins, system-ui, sans-serif`;
    ctx.fillText(TITLE, width / 2, y);
    y += titleSize + 14;

    ctx.fillStyle = palette.textSecondary;
    ctx.font = `500 ${captionSize}px Poppins, system-ui, sans-serif`;
    for (const line of captionLines) {
      ctx.fillText(line, width / 2, y);
      y += captionSize + 6;
    }
    y += 16;

    ctx.drawImage(img, (width - qr) / 2, y, qr, qr);
    y += qr + 18;

    ctx.fillStyle = palette.textMuted;
    ctx.font = `400 ${footerSize}px Roboto, system-ui, sans-serif`;
    for (const line of footerLines) {
      ctx.fillText(line, width / 2, y);
      y += footerSize + 5;
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Export impossible'))),
        'image/png',
      );
    });
  }, [captionText]);

  const handleDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await buildPng();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = FILE_NAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      setStatus({ tone: 'ok', text: 'Image téléchargée.' });
    } catch {
      setStatus({ tone: 'error', text: "L'image n'a pas pu être générée." });
    } finally {
      setBusy(false);
    }
  }, [busy, buildPng]);

  // Only offered when the browser can actually share a file. Desktop
  // Chrome and Firefox can't, so they get the download button alone.
  const canShareFiles = typeof navigator !== 'undefined' && !!(navigator as any).canShare;

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await buildPng();
      const file = new File([blob], FILE_NAME, { type: 'image/png' });
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: TITLE });
      } else {
        setStatus({ tone: 'error', text: 'Ce navigateur ne peut pas partager de fichier.' });
      }
    } catch (err: any) {
      // The user dismissing the share sheet throws AbortError — not an error.
      if (err?.name !== 'AbortError') {
        setStatus({ tone: 'error', text: 'Le partage a échoué.' });
      }
    } finally {
      setBusy(false);
    }
  }, [busy, buildPng]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(null);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      setCopied(true);
      copiedTimer.current = setTimeout(() => {
        setCopied(false);
        copiedTimer.current = null;
      }, 5000);
    } catch {
      setStatus({ tone: 'error', text: 'Le lien n’a pas pu être copié.' });
    }
  }, [url]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, clickable]} onPress={onClose}>
        {/* On web a click inside the sheet bubbles up to the backdrop and
            would close the modal, so the sheet swallows its own clicks.
            On native, touches don't propagate and this isn't needed. */}
        <Pressable style={styles.sheet} onPress={() => { }}>
          <Pressable
            style={[styles.closeBtn, clickable]}
            onPress={onClose}
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={26} color={palette.textSecondary} />
          </Pressable>

          <View style={styles.qrCard}>
            <Text style={styles.title}>{TITLE}</Text>
            <Text style={styles.caption}>{captionText}</Text>

            <View ref={qrWrapRef} style={styles.qrWrap}>
              <QRCode
                value={url}
                size={QR_SIZE}
                backgroundColor="#FFFFFF"
                color={palette.textPrimary}
              />
            </View>

            <Text style={styles.urlPreview}>{FOOTER}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.saveBtn, busy && styles.btnDisabled, clickable]}
              onPress={handleDownload}
              disabled={busy}
            >
              <Ionicons name="download-outline" size={19} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={[styles.btnText, styles.saveText]}>
                {busy ? 'Préparation...' : "Télécharger l'image"}
              </Text>
            </Pressable>

            {canShareFiles && (
              <Pressable
                style={[styles.actionBtn, styles.shareBtn, busy && styles.btnDisabled, clickable]}
                onPress={handleShare}
                disabled={busy}
              >
                <Ionicons
                  name="share-social"
                  size={19}
                  color={palette.textSecondary}
                  style={styles.btnIcon}
                />
                <Text style={[styles.btnText, styles.greyText]}>Partager</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionBtn, styles.copyBtn, clickable]}
              onPress={handleCopyLink}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'link-outline'}
                size={19}
                color={palette.textSecondary}
                style={styles.btnIcon}
              />
              <Text style={[styles.btnText, styles.greyText]}>
                {copied ? 'Lien copié' : 'Copier le lien'}
              </Text>
            </Pressable>
          </View>

          {!!status && (
            <Text style={[styles.status, status.tone === 'error' && styles.statusError]}>
              {status.text}
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('SVG illisible'));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = words[i];
    } else {
      line = next;
    }
  }
  lines.push(line);
  return lines;
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
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
  // One column, buttons full width.
  actions: {
    marginTop: 16,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: { marginRight: 8 },
  btnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.3,
  },
  btnDisabled: { opacity: 0.7 },

  saveBtn: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveText: { color: '#FFFFFF' },

  // Grey fill.
  shareBtn: {
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  // White fill, grey outline. Border sits inside the same pill shape, so
  // the height still matches the two above.
  copyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  greyText: { color: palette.textSecondary },
  status: {
    fontSize: 12.5,
    fontFamily: 'Roboto',
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statusError: { color: '#DC2626' },
});