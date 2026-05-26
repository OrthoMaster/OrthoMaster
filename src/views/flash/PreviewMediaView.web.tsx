import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useGetUser } from "../../hooks/useGetUser.hook";
import { getS3Image } from "../../services/S3Service";
import { IContent } from "../../utils/interfaces";
import { orthomasterShare } from "../../futils";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import VideoAdsModal from "./ads/VideoAdsModal";

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';


export type PreviewMediaParams = {
  media: IContent;
};

export const PreviewMediaView = ({ navigation, route }) => {
  const { media }: PreviewMediaParams = route.params;
  const imageUrl = useQuery({
    queryKey: ["contentThumbnail", media.id_content, media.title],
    queryFn: () => getS3Image(`${media.s3_path}/${media.title}/logo.png`),
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
          " par " +
          media2share.author +
          "\n\n" +
          "https://app.orthomaster.fr/open/media-preview?id=" +
          media2share.id_content,
      },
      "média",
      media2share.id_content
    );
  };

  useEffect(() => {
    if (!showAds && grantingAcces) {
      setGrantingAcces(false);
      navigation.navigate("flash-media-viewer", {
        content: media,
      });
    }
  }, [showAds, grantingAcces]);

  return (
    <>
      <View style={styles.previewContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.mediaSection}>
          {/* Background Thumbnail */}
          <Image
            source={{ uri: imageUrl.data }}
            style={styles.backgroundThumbnail}
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
            style={styles.gradientOverlay}
          />

          {/* Content Overlay */}
          <View style={styles.contentOverlay}>
            <View style={styles.mediaInfo}>
              {media.author && (
                <Text style={styles.mediaAuthor}>{media.author}</Text>
              )}
              <Text style={styles.mediaTitle}>{media.title}</Text>
              {media.description && (
                <Text style={styles.mediaDescription}>
                  {media.description}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.accessButton}
                onPress={() => setShowAds(true)}
              >
                <Ionicons name="play" size={20} color={Colors.white} />
                <Text style={styles.accessButtonText}>Accéder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareMedia(media)}
              >
                <Ionicons name="share-social" size={20} color={Colors.white} />
                <Text style={styles.shareButtonText}>Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

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
    </>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    width: '100%',
    height: "100%",
    shadowColor: Colors.gray,
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
    zIndex: 1001,
  },
  backButton: {
    position: "absolute",
    top: Spacings.lg,
    right: Spacings.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  mediaSection: {
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  backgroundThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    paddingHorizontal: Spacings.xl,
    paddingBottom: Spacings.xxxxl,
    zIndex: 2,
  },
  mediaInfo: {
    marginBottom: Spacings.lg,
  },
  mediaTitle: {
    width: '45%',
    fontSize: 50,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    marginBottom: Spacings.lg,
  },
  mediaAuthor: {
    width: '45%',
    fontSize: 25,
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacings.xs,
  },
  mediaDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacings.md,
  },
  mediaDescription: {
    width: '50%',
    fontSize: 20,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    marginBottom: Spacings.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacings.md,
  },
  accessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.red,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderRadius: 16,
    gap: Spacings.sm,
  },
  accessButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: Spacings.sm,
  },
  shareButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },
});