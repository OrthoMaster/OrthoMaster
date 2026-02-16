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
import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import PurchaseStickerView from './PurchaseStickerView';
import PrintView from './PrintView';
import Guides from './Guides';

const { width: screenWidth } = Dimensions.get('screen');
const isWeb = Platform.OS == 'web';

export const GuidePatientButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (<TouchableOpacity
    onPress={onPress}
    style={{
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#FBB200',
      padding: 20,
      borderRadius: 15,
    }}
  >
    <Image
      source={require('../../../../../assets/tools/guide-patient/access-icon.png')}
      style={{
        width: isWeb ? 100 : screenWidth / 6,
        height: isWeb ? 100 : screenWidth / 6,
        marginBottom: 10
      }}
    />
    <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'Poppins-Medium' }}>Guide patient</Text>
  </TouchableOpacity>)
}


export const GuidePatientMenu: React.FC<{ onClose: () => any }> = ({ onClose }) => {
  const [purchaseSticker, setPurchaseSticker] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [guideToDisplay, setGuideToDisplay] = useState(null)



  return <SafeAreaView>
    <LinearGradient
      colors={['#FBB200', '#FBB200']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.containerTool}
    >

      <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>

        {
          (guideToDisplay != null && showPrintModal == false && purchaseSticker == false) &&
          <Image
            source={{ uri: guideToDisplay }}
            style={{ width: "95%", resizeMode: 'contain', height: 250, marginVertical: 20 }}
          />
        }
        {
          (purchaseSticker == true && showPrintModal == false && guideToDisplay == null) &&
          <PurchaseStickerView />
        }
        {
          (showPrintModal == true && purchaseSticker == false && guideToDisplay == null) &&
          <PrintView />
        }
        {
          (showPrintModal == false && purchaseSticker == false && guideToDisplay == null) &&
          <View style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
          }}>

            <Image
              source={require('../../../../../assets/tools/guide-patient/guide-patient.png')}
              style={{
                width: "95%",
                height: 250,
                borderRadius: 10,
                resizeMode: 'contain',
                alignSelf: 'center'
              }}
            />
            <View style={{
              width: '100%', flex: 1,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Guides onSelect={(guideUrl) => {
                setGuideToDisplay(guideUrl)
              }} />
            </View>

            <TouchableOpacity style={[{
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 100,
              position: 'absolute',
              right: 10,
              top: 10,
              shadowOpacity: 0.25,
              shadowOffset: { width: 5, height: 5 }
            }]}
              onPress={() => {
                setPurchaseSticker(true)
              }}>
              <AntDesign name="shopping-cart" size={24} color="#FBB200" />

            </TouchableOpacity>

            <TouchableOpacity style={[{
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 100,
              position: 'absolute',
              right: 10,
              top: 70,
              shadowOpacity: 0.25,
              shadowOffset: { width: 5, height: 5 }
            }]}
              onPress={() => {
                setShowPrintModal(true)
              }}>
              <AntDesign name="printer" size={20} color="#FBB200" />

            </TouchableOpacity>
          </View>
        }
        {
          (showPrintModal == true || purchaseSticker == true || guideToDisplay != null) &&
          <TouchableOpacity onPress={() => {
            setPurchaseSticker(false)
            setShowPrintModal(false)
            setGuideToDisplay(null)
          }}
            style={{
              backgroundColor: "#eb7b0f",
              padding: 10,
              borderRadius: 5,
              borderColor: "#fff",
              borderWidth: 2,
              marginVertical: 10

            }}>
            <Text style={{
              color: '#fff'
            }}>Fermer</Text>
          </TouchableOpacity>
        }
      </View>
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 10,
          alignSelf: 'center',
        }}
        onPress={onClose}
      >
        <Ionicons name="close-circle" size={34} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  </SafeAreaView>
}

const styles = StyleSheet.create({


  containerTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30
  },
  containerTool: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    borderRadius: 15
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 20
  },
  subToolContainer: {
    backgroundColor: '#F1F1F1',
    width: '90%',
    borderRadius: 15,
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 5, height: 5
    },
    padding: 10,
    marginVertical: 5,
    flexDirection: 'row',
  },
  subToolText: {
    fontSize: 17,
    color: '#FBB200',
    fontWeight: 'bold'
  },
  subToolButton: {

  },
  subToolButtonText: {
    textAlign: 'center',
    fontSize: 10
  }

})