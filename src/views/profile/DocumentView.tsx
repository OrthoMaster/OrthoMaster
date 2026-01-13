import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  RefreshControl
} from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";
import * as Sharing from 'expo-sharing';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { BouncingDots } from '../../component/LoadingDots';

import { getDocument } from '../../services/v2/AuthService';

interface DocumentItemProps {
  no: string;
  document: string;
  updated_at: string;
  onDownload: (document: string) => void;
  organization?: string;
  type?: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  no,
  document,
  updated_at,
  onDownload,
  organization,
  type
}) => (
  <View style={styles.settingItem}>
    <View style={styles.settingItemLeft}>
      <View style={styles.iconContainer}>
        {type == 'contract'
          ? <FontAwesome6 name="signature" size={18} color={Colors.success} />
          : <MaterialCommunityIcons name={'invoice-text-outline'} size={20} color={Colors.blue} />
        }

      </View>
      <View style={styles.settingItemText}>
        <Text style={styles.settingItemTitle}>{no}</Text>
        <Text style={styles.settingItemDescription}>{updated_at}</Text>
        {organization && type == 'contract' &&
          <Text style={styles.settingItemDescription}>{organization}</Text>
        }
      </View>
    </View>
    {document &&
      <TouchableOpacity
        onPress={() => onDownload(document)}
      >
        <MaterialCommunityIcons name="download" size={26} color={Colors.primary} />
      </TouchableOpacity>
    }
  </View>
);

export const DocumentView = ({ navigation }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocument,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const back = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'profile-view' }],
    });
  };

  const downloadFile = async (document: string) => {
    const url = document;
    const destination = new Directory(Paths.cache, 'OrthoMaster');

    try {
      if (!destination.exists) {
        destination.create();
      }

      const fileName = url.split('/').pop() || `document_${Date.now()}.pdf`;
      const file = new File(destination, fileName);
      if (file.exists) {
        file.delete();
      }

      const finalFile = await File.downloadFileAsync(url, destination);
      await Sharing.shareAsync(finalFile.uri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Erreur', "Une erreur s'est produite lors du téléchargement");
    }
  }

  return (
    <SafeAreaView style={styles.container}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Devis & Factures</Text>
      </View>

      {!data || (data.invoices?.length == 0 && data.contracts?.length == 0) && (
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray" size={80} color={Colors.gray} />
          <Text style={styles.emptyTitle}>Aucune document</Text>
          <Text style={styles.emptySubtitle}>
            Vous n'avez encore aucun fichier.
          </Text>
        </View>
      )}

      {data &&
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: Spacings.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {isLoading && !error &&
            <BouncingDots
              color={Colors.primary}
              size={10}
              bounceHeight={5}
              containerStyle={{
                backgroundColor: 'transparent',
                bottom: Spacings.xs,
                zIndex: 999,
                elevation: 5,
                marginTop: Spacings.md,
              }}
            />
          }

          {/* Factures Section */}
          {data.invoices?.length > 0 &&
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Factures ({data.invoices?.length || 0})</Text>
              <View style={styles.sectionContent}>
                {data.invoices.map(inv => (
                  <DocumentItem
                    key={'inv' + inv.id}
                    no={inv.no}
                    updated_at={inv.updated_at}
                    document={inv.document}
                    onDownload={downloadFile}
                  />
                ))}
              </View>
            </View>
          }

          {/* Contract Section */}
          {data.contracts?.length > 0 &&
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Devis ({data.contracts?.length || 0})</Text>
              <View style={styles.sectionContent}>
                {data.contracts.map(cont => (
                  <DocumentItem
                    key={'cont' + cont.id}
                    no={cont.no}
                    updated_at={cont.updated_at}
                    document={cont.document}
                    onDownload={downloadFile}
                    organization={cont.organization}
                    type='contract'
                  />
                ))}
              </View>
            </View>
          }
        </ScrollView>
      }
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  section: {
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingHorizontal: Spacings.lg,
    marginBottom: Spacings.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.white,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  settingItemLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacings.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xs,
    textAlign: 'center',
  },
});
