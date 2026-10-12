import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { shareLink } from '../bookingActions';

interface ShowcaseWebViewModalProps {
  visible: boolean;
  url: string | null;
  onClose: () => void;
}

/**
 * Page vitrine web (three.js) affichée dans l'application.
 * La page peut être lourde sur un téléphone ancien : l'en-tête reste au-dessus de la
 * WebView, pour que Fermer réponde même pendant le chargement.
 */
export const ShowcaseWebViewModal: React.FC<ShowcaseWebViewModalProps> = ({ visible, url, onClose }) => {
  const [loading, setLoading] = useState(true);

  // url porte ?inapp=true pour la WebView ; on affiche et on partage l'adresse publique.
  const publicUrl = url ? url.split('?')[0] : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Provider propre à la modale : hors de l'arbre principal, les marges sûres vaudraient 0 sur Android. */}
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.round} onPress={onClose} hitSlop={8} accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Page vitrine web</Text>
              {publicUrl ? (
                <Text style={styles.headerUrl} numberOfLines={1}>
                  {publicUrl.replace(/^https?:\/\//, '')}
                </Text>
              ) : null}
            </View>

            {publicUrl ? (
              <TouchableOpacity style={styles.round} onPress={() => shareLink(publicUrl)} hitSlop={8} accessibilityLabel="Partager">
                <Ionicons name="share-social-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.body}>
            {url ? (
              <WebView
                source={{ uri: url }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                allowsInlineMediaPlayback
                style={styles.webview}
              />
            ) : null}

            {loading && (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator size="large" color={Colors.lblue} />
                <Text style={styles.loadingText}>Chargement de la page…</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  body: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },

  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
  headerUrl: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.subtext,
  },

  /* ---- Chargement ---- */
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    backgroundColor: Colors.blackBackground,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
});