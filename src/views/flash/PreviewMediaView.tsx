import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from "@tanstack/react-query";

import { useGetUser } from "../../hooks/useGetUser.hook";
import { IContent } from "../../utils/interfaces";
import { Ionicons, Feather, FontAwesome, AntDesign } from '@expo/vector-icons';

import { LinearGradient } from "expo-linear-gradient";
import { orthomasterShare } from "../../futils";

import { getRelated } from "../../services/v2/ContentService";

import VideoAdsModal from "./ads/VideoAdsModal";

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width, height } = Dimensions.get("screen");
const isTablet = Platform.OS !== 'web' && width >= 768;

type SimilarMediasContentCardProp = {
  media: IContent;
  onSelect: (media: IContent) => any;
};
const SimilarMediasContentCard: React.FC<SimilarMediasContentCardProp> = ({
  media,
  onSelect,
}): React.ReactNode => {
  return (
    <TouchableOpacity
      style={styles.videoContainer}
      onPress={() => onSelect(media)}
    >
      <Image
        source={{ uri: media.thumbnail }}
        style={styles.videoImage}
      />
      <View style={styles.videoDescription}>
        <Text style={styles.videoAuthor}>{media.expert_names ? media.expert_names : 'OrthoMaster'}</Text>
        <Text style={styles.videoTitle} numberOfLines={2} ellipsizeMode="tail">{media.title}</Text>

        <View style={styles.videoMetadata}>
          <AntDesign name="clock-circle" size={14} color={Colors.subtext2} />
          <Text style={styles.videoMetatext}>{media.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type PreviewMediaParams = {
  media: IContent;
};

export const PreviewMediaView = ({ navigation, route }) => {
  const { media }: PreviewMediaParams = route.params;
  const { data: similarContent, isLoading } = useQuery({
    queryKey: ["related-media", media.id_content],
    queryFn: () => getRelated(media.id_content)
  });
  const { data: user, ...userQuery } = useGetUser();
  const [showAds, setShowAds] = useState(false);
  const [grantingAcces, setGrantingAcces] = useState(false);

  const shareMedia = async (media2share: IContent) => {
    orthomasterShare(
      {
        title: media2share.title,
        message:
          "Voici un contenu intéressant à voir sur OrthoMaster :\n\n" +
          media2share.title +
          "\n\n" +
          "https://go.orthomaster.fr/open/media-preview/" +
          media2share.id_content,
      },
      "média",
      media2share.id_content
    );
  };

  useEffect(() => {
    if (!showAds && grantingAcces) {
      // Visionnage de pub terminée REDIRECTION vers contenu
      setGrantingAcces(false);
      navigation.navigate("flash-media-viewer", {
        content: media,
      });
    }
  }, [showAds, grantingAcces]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.mediaSection}>
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: media.thumbnail }}
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
            <View style={styles.heroInfoContainer}>
              <Text style={styles.heroAuthor}>{media.expert_names ? media.expert_names : 'OrthoMaster'}</Text>
              <Text style={styles.heroTitle}>{media.title}</Text>
              <View style={styles.heroDurationContainer}>
                <AntDesign name="clock-circle" size={14} color={Colors.white} />
                <Text style={styles.heroDuration}>{media.duration}</Text>
              </View>

              {/* Buttons inside hero */}
              <View style={styles.heroButtonsContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    user?.closable_ads ? setGrantingAcces(true) : setShowAds(true)
                  }}
                >
                  <FontAwesome name="play" size={16} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Accéder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => shareMedia(media)}
                >
                  <Feather name="share" size={16} color="#000" />
                  <Text style={styles.secondaryButtonText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>


        <View style={{ paddingVertical: Spacings.lg, backgroundColor: Colors.darkBackground }}>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 18,
              marginLeft: Spacings.lg,
              color: Colors.white,
              width: "100%",
            }}
          >
            {!isLoading && similarContent?.length > 0 ? "À voir aussi" : ""}
          </Text>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={similarContent}
              scrollEnabled={false}
              contentContainerStyle={{
                width: "100%",
                alignSelf: "center",
              }}
              renderItem={({ item }) => (
                <SimilarMediasContentCard
                  media={item}
                  onSelect={(m) => {
                    navigation.push("flash-media-preview", {
                      media: m,
                    } as PreviewMediaParams);
                  }}
                />
              )}
            />
          )}
        </View>
      </ScrollView>
      {showAds && (
        <VideoAdsModal
          enabled={showAds}
          onClose={() => {
            setShowAds(false);
          }}
          grantAccess={() => {
            setGrantingAcces(true);
            setShowAds(false);
          }}
        />
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={25} color={Colors.text} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    position: "relative",
  },
  mediaSection: {
    backgroundColor: Colors.black,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },

  // Netflix-style Hero Section
  heroContainer: {
    width: width,
    height: isTablet ? (width / 16) * 9 : height * 0.6,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '80%',
  },
  heroInfoContainer: {
    position: 'absolute',
    bottom: Spacings.lg,
    left: Spacings.lg,
    maxWidth: '70%',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#fff',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  heroAuthor: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'left',
  },
  heroDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDuration: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Hero Buttons
  heroButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacings.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redDark,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.xl,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  primaryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.xl,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },

  // Description
  mediaDescription: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.white,
    paddingTop: Spacings.md,
  },

  // Back button
  backButton: {
    position: 'absolute',
    left: Spacings.lg,
    top: Spacings.xxxl,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    shadowOpacity: 0.5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },

  // More videos
  videoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: 'flex-start',
    marginVertical: Spacings.sm,
    minHeight: 100,
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
  },
  videoImage: {
    width: 100 * 16 / 9,
    height: 100,
    objectFit: "cover",
    borderRadius: 8,
  },
  videoDescription: {
    flex: 1,
    flexShrink: 1,
  },
  videoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? 18 : 15,
    color: Colors.white,
  },
  videoAuthor: {
    marginTop: Spacings.xs,
    fontSize: isTablet ? 16 : 13,
    color: Colors.primary,
    fontWeight: "500",
    fontFamily: 'Roboto'
  },
  videoMetadata: {
    marginTop: Spacings.xxs,
    flexDirection: "row",
    alignItems: 'center',
    gap: Spacings.xs,
  },
  videoMetatext: {
    fontFamily: 'Poppins-Medium',
    fontSize: isTablet ? 14 : 12,
    color: Colors.subtext2
  },
  videoTag: {
    fontFamily: 'Roboto',
    fontSize: isTablet ? 14 : 12,
    fontStyle: 'italic',
    marginTop: Spacings.xs,
    color: Colors.subtext2
  }
});