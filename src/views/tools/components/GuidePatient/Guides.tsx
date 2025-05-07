import React, { useState } from "react";
import { FlatList, StyleSheet, ActivityIndicator, Alert, Image, Linking, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "react-query";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { getS3Image } from "../../../../services/S3Service";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { orthomasterShareFile } from "../../../../futils";

export const GUIDES = [{
  name: 'Ceinture lombaire',
  s3_guide_path: "tools/Guide patient/QR guide patient CSL.png",
  stickers_url: 'https://drive.google.com/file/d/1Tn-8eX8cTRNkMUhb6wvbyOcnz7sxM41W/view?usp=sharing',
  redirect_link: 'https://www.orthomasterpatient.fr/s-projects-side-by-side'
}]


const GuideCard = ({ config, showGuide }) => {
  const guide = useQuery(['Guide patient', 'GET', 'QR', config.name], () => getS3Image(config.s3_guide_path))
  const fileUri = FileSystem.cacheDirectory + `guide-patient-${config.name.replace(' ', '-')}.png`

  const onShare = async () => {
    try {
      const options = {
        mimeType: 'image/png',
        dialogTitle: "Partager l'image",
        UTI: 'image/png',
      };
      FileSystem.downloadAsync(guide.data, fileUri)
      orthomasterShareFile(fileUri, options)

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
            showGuide(guide.data)
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
            onPress={() => {
              Linking.openURL(config.redirect_link)
            }}
          >
            <Ionicons name="open-outline" size={20} color="black" />
            <Text style={styles.subToolButtonText}>Ouvrir</Text>
          </TouchableOpacity>
        </View>


        <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
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




  </View>
}


const Guides: React.FC<{ onSelect?: (guideUrl: string) => any }> = ({ onSelect }) => {
  return (<View style={{
    width: '100%'
  }}>

    <FlatList
      data={GUIDES}
      keyExtractor={(item, index) => index.toString()}
      renderItem={(item) => (<GuideCard config={item.item} showGuide={(guide) => {
        onSelect(guide)
      }} />)
      }
      scrollEnabled={false}
      style={{ width: '100%'}}
      contentContainerStyle={{ alignItems: 'center' }}
    />
  </View>);
}

const styles = StyleSheet.create({



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

export default Guides;