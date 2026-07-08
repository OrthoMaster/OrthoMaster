import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PurchaseStickerView from './PurchaseStickerView';
import Guides from './Guides';

const { width: screenWidth } = Dimensions.get('screen');
const isWeb = Platform.OS == 'web';

export const GuidePatientButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.accessButton}>
      <Image
        source={require('../../../../../assets/tools/guide-patient/access-icon.png')}
        style={styles.accessIcon}
      />
      <Text style={styles.accessText}>Guide patient</Text>
    </TouchableOpacity>
  )
}


export const GuidePatientMenu: React.FC<{ onClose: () => any }> = ({ onClose }) => {
  const [purchaseSticker, setPurchaseSticker] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [guideToDisplay, setGuideToDisplay] = useState(null)

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <LinearGradient
        colors={['#FBB200', '#FBB200']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.containerTool}
      >
        <View style={styles.innerContainer}>
          {(guideToDisplay != null && showPrintModal == false && purchaseSticker == false) && (
            <Image source={{ uri: guideToDisplay }} style={styles.displayedGuideImage} />
          )}

          {(purchaseSticker == true && showPrintModal == false && guideToDisplay == null) && (
            <PurchaseStickerView />
          )}

          {(showPrintModal == false && purchaseSticker == false && guideToDisplay == null) && (
            <View style={styles.mainContent}>
              <Image
                source={require('../../../../../assets/tools/guide-patient/guide-patient.png')}
                style={styles.headerImage}
              />
              <View style={styles.guidesWrapper}>
                <Guides onSelect={(guideUrl) => {
                  setGuideToDisplay(guideUrl)
                }} />
              </View>

              <TouchableOpacity
                style={[styles.floatingButton, styles.cartButton]}
                onPress={() => setPurchaseSticker(true)}
              >
                <Ionicons name="cart" size={30} color="#FBB200" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingButton, styles.closeButton]}
                onPress={onClose}
              >
                <Ionicons name="close-sharp" size={30} color="#FBB200" />
              </TouchableOpacity>
            </View>
          )}

          {(showPrintModal == true || purchaseSticker == true || guideToDisplay != null) && (
            <TouchableOpacity
              onPress={() => {
                setPurchaseSticker(false)
                setShowPrintModal(false)
                setGuideToDisplay(null)
              }}
              style={styles.fermerButton}
            >
              <Text style={styles.fermerButtonText}>Fermer</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // SafeArea & containers
  safeArea: {
    flex: 1,
    paddingTop: 30
  },
  containerTool: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 15,
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  mainContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },

  // Access button
  accessButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBB200',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#979797',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  accessIcon: {
    width: isWeb ? 100 : screenWidth / 6,
    height: isWeb ? 100 : screenWidth / 6,
    marginBottom: 10,
  },
  accessText: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
  },

  // Images
  displayedGuideImage: {
    width: '95%',
    resizeMode: 'contain',
    height: 250,
    marginVertical: 20,
  },
  headerImage: {
    width: '95%',
    height: 250,
    borderRadius: 10,
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  // Guides list wrapper
  guidesWrapper: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },

  // Floating buttons (cart + close)
  floatingButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 100,
    position: 'absolute',
    right: 10,
    shadowOpacity: 0.25,
    shadowOffset: { width: 5, height: 5 },
  },
  cartButton: {
    top: 70,
  },
  closeButton: {
    top: 10,
  },

  // Fermer button
  fermerButton: {
    backgroundColor: '#eb7b0f',
    padding: 10,
    borderRadius: 5,
    borderColor: '#fff',
    borderWidth: 2,
    marginVertical: 10,
  },
  fermerButtonText: {
    color: '#fff',
  },

  // (kept from original, no longer used but left in case referenced)
  containerTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30,
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 20,
  },
});