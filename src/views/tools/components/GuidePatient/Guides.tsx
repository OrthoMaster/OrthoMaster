import React, { useState } from "react";
import { FlatList, StyleSheet, ActivityIndicator, Alert, Image, Linking, Text, TouchableOpacity, View, Platform, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getS3Image } from "../../../../services/S3Service";
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import PrintView from './PrintView';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const isWeb = Platform.OS === 'web';

export const GUIDES = [{
  name: 'Ceinture lombaire',
  s3_guide_path: "tools/Guide patient/ceinture.png",
  stickers_url: 'https://drive.google.com/file/d/1Tn-8eX8cTRNkMUhb6wvbyOcnz7sxM41W/view?usp=sharing',
  redirect_link: 'https://www.orthomasterpatient.fr/ceinturelombaire'
},
// {
//   name: 'Béquilles',
//   s3_guide_path: "tools/Guide patient/QR guide patient CSL.png",
//   stickers_url: 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/tool-images/lombaire.pdf',
//   redirect_link: 'https://www.orthomasterpatient.fr/s-projects-side-by-side'
// }
]

const GuideCard = ({ config, guideIndex, showGuide }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const guide = useQuery({
    queryKey: ['Guide patient', 'GET', 'QR', config.name],
    queryFn: () => getS3Image(config.s3_guide_path)
  });

  const onShare = async () => {
    const url = config.stickers_url;
    const safeName = config.name.replace(/\s+/g, '-').toLowerCase();
    const fileName = `guide-patient-${safeName}.pdf`;

    if (isWeb) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        console.error(err);
        Alert.alert('Erreur', "Une erreur s'est produite lors du téléchargement");
      }
    } else {
      try {
        const uniqueFileName = `guide-patient-${safeName}-${Date.now()}.pdf`;
        const destination = new File(Paths.cache, uniqueFileName);
        const output = await File.downloadFileAsync(url, destination);

        if (output.exists) {
          await Sharing.shareAsync(output.uri, {
            UTI: 'com.adobe.pdf',
            mimeType: 'application/pdf',
            dialogTitle: "Partager l'image",
          });
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Erreur', "Une erreur s'est produite lors du téléchargement");
      }
    }
  };

  if (guide.isLoading) return <ActivityIndicator />;

  return (
    <View style={styles.subToolContainer}>
      <View style={styles.cardRow}>
        <View style={styles.imageColumn}>
          <View style={styles.imageWrapper}>
            <TouchableOpacity onPress={() => showGuide(guide.data)}>
              <Image source={{ uri: guide.data }} style={styles.image} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.subToolText}>{config.name}</Text>

          <View style={styles.actionsRow}>
            <View style={styles.iconActionWrapper}>
              <TouchableOpacity
                style={styles.iconAction}
                onPress={() => Linking.openURL(config.redirect_link)}
              >
                <Ionicons name="open-outline" size={20} color={Colors.text} />
                <Text style={styles.subToolButtonText}>Ouvrir</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.iconActionWrapper}>
              <TouchableOpacity style={styles.iconAction} onPress={onShare}>
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
                <Text style={styles.subToolButtonText}>Partager</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.iconActionWrapper}>
              <TouchableOpacity
                style={[styles.iconAction, isPrinting && styles.iconActionActive]}
                onPress={() => setIsPrinting(!isPrinting)}
              >
                <Ionicons
                  name="print-outline"
                  size={20}
                  color={isPrinting ? Colors.white : Colors.text}
                />
                <Text style={[styles.subToolButtonText, isPrinting && styles.subToolButtonTextActive]}>
                  Imprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {isPrinting && (
        <View style={styles.printSection}>
          <PrintView guideIndex={guideIndex} />
        </View>
      )}
    </View>
  );
};

const Guides: React.FC<{ onSelect?: (guideUrl: string) => any }> = ({ onSelect }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={GUIDES}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <GuideCard
            config={item}
            guideIndex={index}
            showGuide={(guide) => onSelect?.(guide)}
          />
        )}
        scrollEnabled={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: isWeb ? SCREEN_HEIGHT * 0.6 : SCREEN_HEIGHT - 120,
  },
  list: { width: '100%' },
  listContent: { alignItems: 'center' },
  subToolContainer: {
    backgroundColor: Colors.white,
    width: isWeb ? 350 : '100%',
    borderRadius: 15,
    shadowOpacity: 0.2,
    shadowOffset: { width: 5, height: 5 },
    shadowRadius: 5,
    padding: 10,
    marginVertical: 5,
  },
  cardRow: { flexDirection: 'row', gap: Spacings.xs },
  imageColumn: { flexGrow: isWeb ? 1 : 0.6, justifyContent: 'center' },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 100,
    shadowOpacity: 0.30,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 5,
  },
  image: {
    width: isWeb ? 100 : "100%",
    height: isWeb ? 100 : "100%",
    resizeMode: 'contain',
  },
  infoColumn: { justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', gap: Spacings.sm },
  subToolText: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.primary,
    marginBottom: Spacings.md,
    fontFamily: 'Poppins-Medium',
  },
  subToolButtonText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  subToolButtonTextActive: { color: Colors.white },
  iconActionWrapper: { alignItems: 'center', justifyContent: 'center' },
  iconAction: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 8,
  },
  iconActionActive: { backgroundColor: Colors.primaryLight },
  printSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    alignItems: 'center',
  },
});

export default Guides;