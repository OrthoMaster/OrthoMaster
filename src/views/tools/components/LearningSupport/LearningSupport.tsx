import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { IContent } from "../../../../utils/interfaces";
import { useQuery } from "@tanstack/react-query";
import { fetchSearchList } from "../../../../services/SearchService";
import { getS3Image } from "../../../../services/S3Service";
import { ScrollView } from "react-native-gesture-handler";

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
        <View style={{
          width: 90,
          height: 90,
          borderRadius: 10,
          backgroundColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="small" color="#5AC4F6" />
        </View>
      ) : (
        <Image
          source={
            imageUrl && !isError
              ? { uri: imageUrl }
              : require('../../../../../assets/tools/learning-support/access-icon.png')
          }
          style={{
            width: 90,
            height: 90,
            borderRadius: 10,
            resizeMode: 'cover',
          }}
        />
      )}
      <Text style={{
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#143A71',
      }}>
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
          backgroundColor: "#5AC4F6",
          borderRadius: 15,
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 80,
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
            <Text style={styles.contentsSectionTitle}>Pathologie</Text>
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
          backgroundColor: 'rgba(0,0,0,0.2)',
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