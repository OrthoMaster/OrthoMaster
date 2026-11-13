import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { IContent } from "../../../../utils/interfaces";
import { useQuery } from "@tanstack/react-query";
import { fetchSearchList } from "../../../../services/SearchService";
import { getS3Image } from "../../../../services/S3Service";
import { ScrollView } from "react-native-gesture-handler";

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

const COLOR = '#5AC4F6';
const COLOR_DARK = '#143A71';

export const LearningSupportButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.bigButton} onPress={onPress}>
      <Image
        source={require('../../../../../assets/tools/learning-support/access-icon.png')}
        style={styles.bigButtonImage}
      />
      <Text style={styles.bigButtonText}>Supports pédagogiques</Text>
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
      <View style={[styles.iconBox, showSpinner && styles.loadingContainer]}>
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
            <ActivityIndicator size="small" color={COLOR} />
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
    <SafeAreaView style={styles.wrapper}>
      {/* La boîte prend la hauteur de son contenu (sans dépasser l'écran) ; seul le contenu défile. */}
      <View style={styles.box}>
        {/* En-tête fixe : reste visible quand la liste défile. */}
        <Image
          source={require('../../../../../assets/tools/learning-support/learning-support.png')}
          style={styles.headerImage}
        />

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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

          {/* Web : une colonne par catégorie, côte à côte. */}
          <View style={styles.columns}>
            {!isLoading && !isError && anatomieContents.length > 0 && (
              <View style={styles.section}>
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
              </View>
            )}

            {!isLoading && !isError && pathologieContents.length > 0 && (
              <View style={styles.section}>
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
              </View>
            )}
          </View>

          {/* Empty State */}
          {!isLoading && !isError && anatomieContents.length === 0 && pathologieContents.length === 0 && (
            <View style={styles.centerContainer}>
              <Text style={styles.statusText}>Aucun contenu disponible</Text>
            </View>
          )}
        </ScrollView>

        {/* Fermer : même bouton que la popup Guide patient, à la couleur de la popup. */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
          <Ionicons name="close" size={24} color={COLOR} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // Marge verticale autour de la popup : elle ne colle plus aux bords de l'écran.
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacings.lg,
  },
  box: {
    maxHeight: '100%',
    backgroundColor: COLOR,
    borderRadius: 15,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: 220,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: Spacings.md,
  },
  // flexShrink : la liste rétrécit et défile quand la boîte atteint la hauteur maximale.
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: Spacings.lg,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  section: {
    flex: 1,
  },
  // Bouton Fermer de la popup Guide patient.
  closeButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 100,
    position: 'absolute',
    right: 10,
    top: 10,
    shadowOpacity: 0.25,
    shadowOffset: { width: 5, height: 5 },
    zIndex: 99999,
  },
  // Quatre planches : deux en haut, deux en bas (2 cases de 120 + marges de 5).
  contentsTwoByTwo: {
    width: 260,
    alignSelf: 'center',
  },
  contentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  contentsSectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: Spacings.md,
    textAlign: 'center',
    color: COLOR_DARK
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },

  // Button
  bigButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR,
    padding: Spacings.md,
    borderRadius: 16,
    height: 220,
    minWidth: 300,
    shadowColor: '#979797',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  bigButtonImage: {
    width: 100,
    height: 100,
    marginBottom: Spacings.sm
  },
  bigButtonText: {
    fontSize: 22,
    letterSpacing: 1,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    textAlign: "center",
  },

  // Vignette : case de taille fixe, hauteur minimale pour qu'un titre sur deux lignes ne déborde pas.
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
  iconSpinner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading view
  loadingContainer: {
    backgroundColor: Colors.white,
  },

  icon: {
    width: 90,
    height: 90,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  iconTitle: {
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    fontSize: 12,
    marginVertical: Spacings.xs,
    color: COLOR_DARK,
  }
})