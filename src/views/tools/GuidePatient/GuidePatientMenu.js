import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Linking,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from 'react-query';
import { AntDesign } from '@expo/vector-icons';
import AppModal from '../../../component/AppModal';
import { getS3Image } from '../../../services/S3Service';
import { Entypo } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';


const GUIDES = [{
  name: 'Ceinture lombaire',
  s3_guide_path: "tools/Guide patient/QR guide patient CSL.png",
  stickers_url: 'https://drive.google.com/file/d/1Tn-8eX8cTRNkMUhb6wvbyOcnz7sxM41W/view?usp=sharing',
  redirect_link: 'https://www.orthomasterpatient.fr/s-projects-side-by-side'
}]

const PURCHASE_LINKS = [
  { name: "Amazon", img: require('../../../../assets/tools/guide-patient/amazon.png'), link: 'https://www.amazon.fr/gp/product/B07Z2PT35F/ref=ppx_od_dt_b_asin_title_s00?ie=UTF8&th=1' },
  { name: "Office Dépot", img: require('../../../../assets/tools/guide-patient/Avery.png'), link: 'https://boutique-avery.fr/products/etiquettes-l7104rev-20?utm_medium=cpc&utm_term=Home&utm_source=commerceconnector+%28via+ShoppingFeed%29' },
  { name: "Bureau Vallée", img: require('../../../../assets/tools/guide-patient/bureau-vallee.png'), link: 'https://www.bureau-vallee.fr/etiquette-enlevable-x240-o60mm-rondes-blanc-avery-218669.html' }
]

const PurchaseStickerView = () => {
  return <View style={{ width: '100%', paddingVertical: 20 }}>
    <Text style={{ alignSelf: 'center', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Comment se procurer des étiquettes vierges à imprimer :</Text>

    <Text style={{ width: '90%', alignSelf: 'center', fontSize: 15 }}><Text style={{ fontWeight: 'bold' }}>Option 1 :</Text> Commandez sur une plateforme en ligne (liens ci-dessous)</Text>
    <FlatList
      data={PURCHASE_LINKS}
      keyExtractor={(item, index) => index}
      renderItem={(item) => <TouchableOpacity
        onPress={() => {
          Linking.openURL(item.item.link)
        }}
      >
        <Image
          style={{ width: 100, height: 50, resizeMode: 'contain' }}
          source={item.item.img}
        />
      </TouchableOpacity>
      }
      scrollEnabled={false}
      numColumns={2}
      columnWrapperStyle={{
        justifyContent: 'space-evenly',
        paddingVertical: 10
      }}
    />
    <Text style={{ width: '90%', alignSelf: 'center', marginVertical: 10, fontSize: 15 }}><Text style={{ fontWeight: 'bold' }}>Option 2 :</Text> Trouvez le bon format en magasin</Text>
    <Text style={{ width: '90%', alignSelf: 'center', marginBottom: 10 }}>Dimensions demandées :</Text>
    <Text style={{ width: '90%', alignSelf: 'center' }}><Text style={{ fontWeight: 'bold' }}>Format :</Text> A4 (210 x 297 mm)</Text>
    <Text style={{ width: '90%', alignSelf: 'center' }}><Text style={{ fontWeight: 'bold' }}>Type de supports :</Text> Étiquettes adhésives imprimables</Text>
    <Text style={{ width: '90%', alignSelf: 'center' }}><Text style={{ fontWeight: 'bold' }}>Type d'étiquettes :</Text> Rondes, diamètre 60 mm</Text>
    <Text style={{ width: '90%', alignSelf: 'center' }}><Text style={{ fontWeight: 'bold' }}>Nombre d'étiquettes par planche :</Text> 12</Text>

  </View>
}

const GuideCard = ({ config }) => {
  const guide = useQuery(['Guide patient', 'GET', 'QR', config.name], () => getS3Image(config.s3_guide_path))
  const fileUri = FileSystem.cacheDirectory + `guide-patient-${config.name.replace(' ', '-')}.png`
  const [showGuide, setShowGuide] = useState(false)


  const onShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync()

      if (isAvailable == false)
        return

      const options = {
        mimeType: 'image/png',
        dialogTitle: "Partager l'image",
        UTI: 'image/png',
      };
      FileSystem.downloadAsync(guide.data, fileUri)
      Sharing.shareAsync(fileUri, options)

    } catch (error) {
      Alert.alert(error.message);
    }
  };

  if (guide.isLoading)
    return <ActivityIndicator />
  return <View style={styles.subToolContainer}>
    <View style={{ flex: 1, flexGrow: 0.6 }}>
      <View style={{
        width: 100, height: 100, borderRadius: 100, shadowOpacity: 0.30,
        shadowOffset: { width: 3, height: 3 }, shadowRadius: 5
      }}>
        <TouchableOpacity
          onPress={() => {
            setShowGuide(true)
            guide.refetch()
          }}
        >
          <Image
            source={{ uri: guide.data }}
            style={{
              width: "100%", height: "100%", resizeMode: 'contain'
            }}
          />
        </TouchableOpacity>

      </View>
    </View>

    <View style={{ flex: 1, alignItems: 'center' }}>

      <Text style={styles.subToolText}>{config.name}</Text>


      <View style={{ flexDirection: 'row', width: '100%', height: 80 }}>

        <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <TouchableOpacity style={{
            alignItems: 'center',
            padding: 5,
            borderRadius: 5,
            marginVertical: 5
          }}
          onPress={()=>{
            Linking.openURL(config.redirect_link)
          }}
          >
            <Ionicons name="open-outline" size={20} color="black" />
            <Text style={styles.subToolButtonText}>Ouvrir</Text>
          </TouchableOpacity>
        </View>


        <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center'}]}>
          <TouchableOpacity style={[{
            width: '80%',
            height: '80%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 15
          }]} onPress={onShare}>
            <Entypo name="share" size={20} color="black" />
            <Text style={styles.subToolButtonText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>




    <AppModal isVisible={showGuide} style={{
      width: '90%', height: '90%',
      justifyContent: 'center'
    }}
      onClose={() => setShowGuide(false)}
      customRender={<Image
        source={{ uri: guide.data }}
        style={{ flex: 1, resizeMode: 'contain', width: '90%' }}
      />}
    />


  </View>
}

export const GuidePatientMenu = () => {
  const [purchaseSticker, setPurchaseSticker] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)


  return <LinearGradient
    colors={['#FBB200', '#FBB200']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.containerTool}
  >


    <Image
      style={styles.toolQCImage}
      source={require('../../../../assets/tools/guide-patient.png')}
    />
    <Text style={styles.toolTitle}>
      Guide patient
    </Text>

    <FlatList
      data={GUIDES}
      keyExtractor={(item, index) => index}
      renderItem={(item) => (<GuideCard config={item.item} />)
      }
      scrollEnabled={false}
      style={{ width: '100%' }}
      contentContainerStyle={{ alignItems: 'center' }}
    />
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
      <AntDesign name="shoppingcart" size={24} color="#FBB200" />

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






    <AppModal isVisible={purchaseSticker} style={{
      width: '90%'
    }}
      onClose={() => setPurchaseSticker(false)}
      customRender={<PurchaseStickerView />}
    />

    <AppModal isVisible={showPrintModal} style={{
      width: '90%',
    }}
      onClose={() => setShowPrintModal(false)}
      customRender={<View style={{ width: '90%', paddingVertical: 20 }}>
        <Text>Le modèle suivant permet d'imprimer vous-même des planches d'étiquettes.</Text>
        <Text>Êtes-vous sûrs d'avoir le bon format d'étiquettes vierges ?</Text>
        <Text>Si non, le bouton « panier » de la page précédente contient des liens vers des magasins / sites marchands proposant le bon format :</Text>
        <View style={[{
          backgroundColor: '#fff',
          borderRadius: 100,
          alignSelf: 'center',
          marginBottom: 20
        }]}>
          <AntDesign name="shoppingcart" size={35} color="#FBB200" />
        </View>

        <TouchableOpacity style={{
          backgroundColor: '#FBB200',
          alignSelf: 'center',
          padding: 10,
          borderColor: '#fff',
          borderWidth: 2,
          borderRadius: 15,
          shadowOpacity: 0.25,
          shadowOffset: { width: 5, height: 5 },
          marginVertical: 10
        }}
          onPress={() => {
            Linking.openURL(config.stickers_url)
          }}>
          <Text style={{ color: 'white' }}>Accéder au fichier</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 10, color: '#394149', fontStyle: 'italic', textAlign: 'center', width: '60%', alignSelf: 'center' }}>L'usage et la diffusion des étiquettes Guide Patient sont réservés aux clients OrthoMaster.</Text>
      </View>
      }
    />
  </LinearGradient>
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  containerTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30
  },
  containerTool: {
    width: '80%',
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 16
  },
  toolQCImage: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
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