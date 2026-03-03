import React from "react";
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

  return (
    <TouchableOpacity
      key={content.id_content}
      style={{
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: 120,
        height: 120,
        margin: 5,
      }}
      onPress={() => onPress(content)}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLOR} />
        </View>
      ) : (
        <Image
          source={
            imageUrl && !isError
              ? { uri: imageUrl }
              : require('../../../../../assets/tools/learning-support/access-icon.png')
          }
          style={styles.icon}
        />
      )}
      <Text style={styles.iconTitle}>
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
      <ScrollView
        style={{
          backgroundColor: COLOR,
          borderRadius: 15,
          flex: 1,
        }}
      >
        <Image
          source={require('../../../../../assets/tools/learning-support/learning-support.png')}
          style={{
            width: "100%",
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
            <View style={styles.contentsContainer}>
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
            <Text style={[styles.contentsSectionTitle, { marginTop: Spacings.xl }]}>Pathologie</Text>
            <View style={styles.contentsContainer}>
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

      <TouchableOpacity
        style={{
          alignSelf: 'center',
          position: 'absolute',
          bottom: 10,
          padding: 10,
          borderRadius: 20,
        }}
        onPress={onClose}
      >
        <Ionicons name="close-circle" size={34} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
    fontFamily: 'Poppins-Medium'
  },

  // Loading view
  loadingContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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