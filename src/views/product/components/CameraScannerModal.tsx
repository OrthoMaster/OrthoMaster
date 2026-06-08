import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../lib/Theme';

type CameraScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  // Called once with the raw QR data when a code is scanned. Parent
  // decides how to parse it (e.g. extract filters from the URL) and
  // typically closes the modal afterwards.
  onScanned?: (data: string) => void;
};

export function CameraScannerModal({
  visible, onClose, onScanned,
}: CameraScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  // Guard against the same QR being fired many times per second while
  // the scanner is settling on a target. We lock after the first read.
  const [scannedOnce, setScannedOnce] = useState(false);

  // Reset scan lock every time the modal opens.
  useEffect(() => {
    if (visible) setScannedOnce(false);
  }, [visible]);

  // Ask for permission once the modal is shown.
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scannedOnce) return;
    setScannedOnce(true);
    if (onScanned) onScanned(data);
  };

  const renderBody = () => {
    // Permissions are async — show a neutral state until we know.
    if (!permission) {
      return (
        <View style={styles.centerMessage}>
          <Text style={styles.message}>Loading camera…</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerMessage}>
          <Ionicons name="camera-outline" size={42} color="#FFFFFF" />
          <Text style={styles.messageTitle}>Camera access required</Text>
          <Text style={styles.message}>
            Please grant camera permission to scan a QR code.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={styles.permBtnText}>Grant permission</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.message, { marginTop: 12, fontStyle: 'italic' }]}>
              Enable it from your system settings.
            </Text>
          )}
        </View>
      );
    }

    return (
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        // Restricting types to QR keeps the parser from firing on
        // unrelated barcodes the camera happens to see.
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scannedOnce ? undefined : handleBarcode}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        {renderBody()}

        {/* Overlay UI — close button + framing reticle + hint label.
            Sits on top of the camera so users always have a way out. */}
        <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={['top', 'bottom']}>
          <View style={styles.topBar} pointerEvents="box-none">
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12} activeOpacity={0.85}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Reticle — purely cosmetic, signals where to point the QR */}
          <View style={styles.reticleWrap} pointerEvents="none">
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.hint}>Aim at a filter QR code</Text>
          </View>

          <View style={styles.bottomSpace} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const RETICLE = 260;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: RETICLE,
    height: RETICLE,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  hint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginTop: 18,
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  bottomSpace: {
    height: 80,
  },

  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  messageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginTop: 14,
    marginBottom: 6,
  },
  message: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  permBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  permBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },
});