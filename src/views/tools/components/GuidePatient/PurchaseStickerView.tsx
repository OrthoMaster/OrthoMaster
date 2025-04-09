import React from "react";
import { FlatList, Image, Linking, Text, TouchableOpacity, View } from "react-native";


const PURCHASE_LINKS = [
    { name: "Amazon", img: require('../../../../../assets/tools/guide-patient/amazon.png'), link: 'https://www.amazon.fr/gp/product/B07Z2PT35F/ref=ppx_od_dt_b_asin_title_s00?ie=UTF8&th=1' },
    { name: "Office Dépot", img: require('../../../../../assets/tools/guide-patient/Avery.png'), link: 'https://boutique-avery.fr/products/etiquettes-l7104rev-20?utm_medium=cpc&utm_term=Home&utm_source=commerceconnector+%28via+ShoppingFeed%29' },
    { name: "Bureau Vallée", img: require('../../../../../assets/tools/guide-patient/bureau-vallee.png'), link: 'https://www.bureau-vallee.fr/etiquette-enlevable-x240-o60mm-rondes-blanc-avery-218669.html' }
  ]
  
const PurchaseStickerView: React.FC<any> = () => {
    return (

          <View style={{ width: '95%', paddingVertical: 20, backgroundColor: '#fff', marginVertical: 10, borderRadius: 5 }}>
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
        
    );
}
 
export default PurchaseStickerView;