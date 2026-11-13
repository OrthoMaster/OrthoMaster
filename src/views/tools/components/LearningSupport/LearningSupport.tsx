import React, { useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { IContent } from "../../../../utils/interfaces";
import { useQuery } from "@tanstack/react-query";
import { fetchSearchList } from "../../../../services/SearchService";
import { getS3Image } from "../../../../services/S3Service";
import { ScrollView } from "react-native-gesture-handler";

import Spacings from '../../../../../constants/Spacings';

const { width: screenWidth } = Dimensions.get('screen');
const isWeb = Platform.OS === 'web';

export const LearningSupportButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#5AC4F6',
        padding: 20,
        borderRadius: 15,
        marginVertical: 10,
      }}
      onPress={onPress}
    >
      <Image
        source={require('../../../../../assets/tools/learning-support/access-icon.png')}
        style={{
          width: isWeb ? 100 : screenWidth / 6,
          height: isWeb ? 100 : screenWidth / 6,
          marginBottom: 10
        }}
      />
      <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'Poppins-Medium' }}>
        Supports pédagogiques
      </Text>
    </TouchableOpacity>
  )
}

type LearningSupportIconsProps = {
  content: IContent;
  onPress: (content: IContent) => any;
}

const LearningSupportIcons: React.FC<LearningSupportIconsProps> = ({ content, onPress }) => {
  const { data: imageUrl, isLoading, isError } = useQuery({
    queryKey: ['contentThumbnail', content.id_content, content.title],
    queryFn: () => getS3Image(`${content.s3_path}/${content.title}/logo.png`),
    enabled: !!(content.s3_path && content.title),
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
    retry: 1,
  })

  // L'URL arrive avant l'image elle-même : on garde le bloc de chargement jusqu'à la fin du
  // téléchargement, sinon la case reste vide (ou change de taille) quand le réseau est lent.
  // État rattaché à l'URL : une nouvelle URL repart automatiquement en chargement.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageLoaded = !!imageUrl && loadedUrl === imageUrl;
  const imageFailed = !!imageUrl && failedUrl === imageUrl;

  const hasRemoteImage = !!imageUrl && !isError && !imageFailed;
  const showSpinner = isLoading || (hasRemoteImage && !imageLoaded);

  return (
    <TouchableOpacity
      key={content.id_content}
      style={styles.iconContainer}
      onPress={() => onPress(content)}
    >
      {/* Case de taille fixe : le titre ne bouge pas, quel que soit l'état de l'image. */}
      <View style={[styles.iconBox, showSpinner && styles.iconBoxLoading]}>
        {!isLoading && (
          <Image
            source={
              hasRemoteImage
                ? { uri: imageUrl }
                : require('../../../../../assets/tools/learning-support/access-icon.png')
            }
            style={styles.icon}
            onLoad={() => setLoadedUrl(imageUrl)}
            onError={() => setFailedUrl(imageUrl)}
          />
        )}
        {showSpinner && (
          <View style={styles.iconSpinner}>
            <ActivityIndicator size="small" color="#5AC4F6" />
          </View>
        )}
      </View>
      <Text style={styles.iconTitle} numberOfLines={2}>
        {content.title}
      </Text>
    </TouchableOpacity>
  )
}

type LearningSupportMenuProps = {
  onClose: () => any;
  onStart: (content: IContent) => any;
}

export const LearningSupportMenu: React.FC<LearningSupportMenuProps> = ({ onClose, onStart }) => {
  const { data: toolContents, isLoading, isError } = useQuery({
    queryKey: ['Tools', 'GET', 'Contents'],
    queryFn: () => fetchSearchList({
      contentType: ['tool'],
      filters: null
    }),
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
    retry: 2,
  })

  // Filter contents by tags
  const anatomieContents = React.useMemo(() =>
    toolContents?.filter((content: IContent) =>
      content.tags?.includes('anatomie')
    ) || [],
    [toolContents]
  )

  const pathologieContents = React.useMemo(() =>
    toolContents?.filter((content: IContent) =>
      content.tags?.includes('pathologie')
    ) || [],
    [toolContents]
  )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Conteneur de la boîte : le bouton Fermer se place par rapport à elle, pas aux marges de sécurité. */}
      <View style={{ flex: 1 }}>
      <ScrollView
        style={{
          backgroundColor: "#5AC4F6",
          borderRadius: 15,
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      >
        <Image
          source={require('../../../../../assets/tools/learning-support/learning-support.png')}
          style={{
            width: "95%",
            height: 250,
            borderRadius: 10,
            resizeMode: 'contain',
            alignSelf: 'center',
            marginVertical: 20,
          }}
        />

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.statusText}>Chargement...</Text>
          </View>
        )}

        {/* Error State */}
        {isError && (
          <View style={styles.centerContainer}>
            <Text style={styles.statusText}>Erreur de chargement</Text>
            <Text style={[styles.statusText, { fontSize: 14, marginTop: 10 }]}>
              Veuillez réessayer plus tard
            </Text>
          </View>
        )}

        {/* Anatomie Section */}
        {!isLoading && !isError && anatomieContents.length > 0 && (
          <>
            <Text style={styles.contentsSectionTitle}>Anatomie</Text>
            <View style={[styles.contentsContainer, anatomieContents.length === 4 && styles.contentsTwoByTwo]}>
              {anatomieContents.map((content: IContent) => (
                <LearningSupportIcons
                  key={content.id_content}
                  content={content}
                  onPress={(content) => {
                    onStart(content)
                    onClose()
                  }}
                />
              ))}
            </View>
          </>
        )}

        {/* Pathologie Section */}
        {!isLoading && !isError && pathologieContents.length > 0 && (
          <>
            <Text style={styles.contentsSectionTitle}>Pathologie</Text>
            <View style={[styles.contentsContainer, pathologieContents.length === 4 && styles.contentsTwoByTwo]}>
              {pathologieContents.map((content: IContent) => (
                <LearningSupportIcons
                  key={content.id_content}
                  content={content}
                  onPress={(content) => {
                    onStart(content)
                    onClose()
                  }}
                />
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && anatomieContents.length === 0 && pathologieContents.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.statusText}>Aucun contenu disponible</Text>
          </View>
        )}
      </ScrollView>

      {/* Fermer en haut à droite, comme les autres popups (RGPD, Espace Formation). */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // Même pastille que les popups RGPD / Espace Formation, en bleu foncé pour ressortir sur le fond bleu.
  closeButton: {
    position: 'absolute',
    top: Spacings.md,
    right: Spacings.md,
    backgroundColor: '#143A71',
    padding: Spacings.xs,
    borderRadius: 40,
    zIndex: 99999,
  },
  // Quatre planches : deux en haut, deux en bas (2 cases de 120 + marges de 5).
  contentsTwoByTwo: {
    width: 280,
    alignSelf: 'center',
  },
  // Hauteur minimale au lieu d'une hauteur fixe : un titre sur deux lignes ne déborde plus
  // sur la ligne suivante.
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 120,
    minHeight: 120,
    margin: 5,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iconBoxLoading: {
    backgroundColor: '#f0f0f0',
  },
  icon: {
    width: 90,
    height: 90,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  iconSpinner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTitle: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#143A71',
  },
  contentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  contentsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: "#143A71"
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  statusText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  }
})