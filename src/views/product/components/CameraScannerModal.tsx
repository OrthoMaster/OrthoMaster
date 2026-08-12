// import { Ionicons } from '@expo/vector-icons';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import React, { useEffect, useRef } from 'react';
// import {
//   Linking,
//   Modal,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// export type CameraScannerModalProps = {
//   visible: boolean;
//   onClose: () => void;
//   // Fired once per open with the raw string payload (usually a URL).
//   onDetected: (data: string) => void;
// };

// /**
//  * Full-screen QR scanner.
//  *
//  * Uses expo-camera's CameraView with the built-in barcode scanner
//  * limited to QR codes. Fires `onDetected(data)` at most once per open;
//  * a ref lock prevents double-fires from rapid consecutive scans while
//  * the modal is dismissing.
//  *
//  * Permission flow:
//  *   - `useCameraPermissions` returns { granted, canAskAgain, ... }
//  *   - First open: if not granted and `canAskAgain`, ask the OS
//  *   - Denied permanently: shows a button to jump to system Settings
//  */
// export function CameraScannerModal({
//   visible, onClose, onDetected,
// }: CameraScannerModalProps) {
//   const [permission, requestPermission] = useCameraPermissions();
//   const scannedRef = useRef(false);

//   // Ask for camera permission the first time the modal opens (if the
//   // OS still allows asking). If the user previously denied without
//   // "don't ask again", this re-triggers the dialog.
//   useEffect(() => {
//     if (visible && permission && !permission.granted && permission.canAskAgain) {
//       requestPermission();
//     }
//   }, [visible, permission, requestPermission]);

//   // Reset the scanned lock every open so a fresh scan is accepted
//   // after the user closes and re-opens the scanner.
//   useEffect(() => {
//     if (visible) scannedRef.current = false;
//   }, [visible]);

//   const handleBarcodeScanned = ({ data }: { data: string }) => {
//     if (scannedRef.current) return;
//     if (!data) return;
//     scannedRef.current = true;
//     onDetected(data);
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="fade"
//       onRequestClose={onClose}
//       statusBarTranslucent
//     >
//       <View style={styles.root}>
//         {!permission ? (
//           // First-run: permission status not yet resolved by the OS
//           <View style={styles.messageBox}>
//             <Text style={styles.messageText}>Chargement…</Text>
//           </View>
//         ) : !permission.granted ? (
//           // Denied — offer the appropriate remediation depending on
//           // whether we can still ask or the user permanently declined.
//           <View style={styles.messageBox}>
//             <Ionicons name="camera-outline" size={48} color="#FFFFFF" />
//             <Text style={styles.messageTitle}>Accès à la caméra requis</Text>
//             <Text style={styles.messageText}>
//               Nous avons besoin de la caméra pour scanner les codes QR.
//             </Text>
//             {permission.canAskAgain ? (
//               <TouchableOpacity
//                 style={styles.messageBtn}
//                 onPress={requestPermission}
//                 activeOpacity={0.85}
//               >
//                 <Text style={styles.messageBtnText}>Autoriser la caméra</Text>
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity
//                 style={styles.messageBtn}
//                 onPress={() => Linking.openSettings()}
//                 activeOpacity={0.85}
//               >
//                 <Text style={styles.messageBtnText}>Ouvrir les paramètres</Text>
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity
//               style={[styles.messageBtn, styles.messageBtnSecondary]}
//               onPress={onClose}
//               activeOpacity={0.85}
//             >
//               <Text style={styles.messageBtnTextSecondary}>Annuler</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <>
//             <CameraView
//               style={StyleSheet.absoluteFillObject}
//               facing="back"
//               barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
//               onBarcodeScanned={handleBarcodeScanned}
//             />

//             {/* Overlay — target frame + hint. pointerEvents:none so it
//                 doesn't intercept the close button. */}
//             <View style={styles.overlay} pointerEvents="none">
//               <View style={styles.banner}>
//                 <Ionicons
//                   name="qr-code-outline"
//                   size={16}
//                   color="#FFFFFF"
//                   style={{ marginRight: 6 }}
//                 />
//                 <Text style={styles.bannerText}>Scannez le QR code</Text>
//               </View>

//               <View style={styles.targetFrame}>
//                 <View style={[styles.corner, styles.cornerTL]} />
//                 <View style={[styles.corner, styles.cornerTR]} />
//                 <View style={[styles.corner, styles.cornerBL]} />
//                 <View style={[styles.corner, styles.cornerBR]} />
//               </View>

//               <Text style={styles.hint}>
//                 Alignez le code dans le cadre
//               </Text>
//             </View>

//             <TouchableOpacity
//               style={styles.closeBtn}
//               onPress={onClose}
//               hitSlop={12}
//               activeOpacity={0.85}
//             >
//               <Ionicons name="close" size={24} color="#FFFFFF" />
//             </TouchableOpacity>
//           </>
//         )}
//       </View>
//     </Modal>
//   );
// }

// const FRAME_SIZE = 260;
// const CORNER_SIZE = 32;
// const CORNER_THICKNESS = 3;

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },

//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   banner: {
//     position: 'absolute',
//     top: 80,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 999,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//   },
//   bannerText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//     fontSize: 13,
//     letterSpacing: 0.3,
//   },

//   targetFrame: {
//     width: FRAME_SIZE,
//     height: FRAME_SIZE,
//     position: 'relative',
//   },
//   corner: {
//     position: 'absolute',
//     width: CORNER_SIZE,
//     height: CORNER_SIZE,
//     borderColor: '#FFFFFF',
//   },
//   cornerTL: {
//     top: 0, left: 0,
//     borderTopWidth: CORNER_THICKNESS,
//     borderLeftWidth: CORNER_THICKNESS,
//     borderTopLeftRadius: 12,
//   },
//   cornerTR: {
//     top: 0, right: 0,
//     borderTopWidth: CORNER_THICKNESS,
//     borderRightWidth: CORNER_THICKNESS,
//     borderTopRightRadius: 12,
//   },
//   cornerBL: {
//     bottom: 0, left: 0,
//     borderBottomWidth: CORNER_THICKNESS,
//     borderLeftWidth: CORNER_THICKNESS,
//     borderBottomLeftRadius: 12,
//   },
//   cornerBR: {
//     bottom: 0, right: 0,
//     borderBottomWidth: CORNER_THICKNESS,
//     borderRightWidth: CORNER_THICKNESS,
//     borderBottomRightRadius: 12,
//   },
//   hint: {
//     color: 'rgba(255,255,255,0.85)',
//     fontSize: 12,
//     marginTop: 26,
//     fontWeight: '500',
//     letterSpacing: 0.2,
//   },

//   closeBtn: {
//     position: 'absolute',
//     top: 44,
//     right: 18,
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 10,
//   },

//   // Permission denied / loading messages
//   messageBox: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 40,
//     backgroundColor: '#000000',
//   },
//   messageTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginTop: 14,
//     textAlign: 'center',
//   },
//   messageText: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.75)',
//     textAlign: 'center',
//     marginTop: 8,
//     lineHeight: 20,
//   },
//   messageBtn: {
//     marginTop: 16,
//     paddingHorizontal: 22,
//     paddingVertical: 12,
//     borderRadius: 999,
//     backgroundColor: '#3B82F6',
//     minWidth: 220,
//     alignItems: 'center',
//   },
//   messageBtnText: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//     fontSize: 14,
//   },
//   messageBtnSecondary: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.4)',
//   },
//   messageBtnTextSecondary: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//     fontSize: 14,
//   },
// });