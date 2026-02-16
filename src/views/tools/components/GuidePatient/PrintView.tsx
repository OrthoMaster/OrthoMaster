import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { GUIDES } from "./Guides";
import { AntDesign } from "@expo/vector-icons";
const PrintView: React.FC<any> = () => {
    return (<View style={{
            width: '95%',
            backgroundColor: '#fff',
            marginVertical: 10,
            padding: 20,
            borderRadius: 5
          }}>
            <Text>Le modèle suivant permet d'imprimer vous-même des planches d'étiquettes.</Text>
            <Text>Êtes-vous sûrs d'avoir le bon format d'étiquettes vierges ?</Text>
            <Text>Si non, le bouton « panier » de la page précédente contient des liens vers des magasins / sites marchands proposant le bon format :</Text>
            <View style={[{
              backgroundColor: '#fff',
              borderRadius: 100,
              alignSelf: 'center',
              marginBottom: 20
            }]}>
              <AntDesign name="shopping-cart" size={35} color="#FBB200" />
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
                Linking.openURL(GUIDES[0].stickers_url)
              }}>
              <Text style={{ color: 'white' }}>Accéder au fichier</Text>
            </TouchableOpacity>
    
            <Text style={{ fontSize: 10, color: '#394149', fontStyle: 'italic', textAlign: 'center', width: '60%', alignSelf: 'center' }}>L'usage et la diffusion des étiquettes Guide Patient sont réservés aux clients OrthoMaster.</Text>
          </View>)
}

export default PrintView;