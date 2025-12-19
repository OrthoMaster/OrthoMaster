import React, { useState, useEffect } from 'react';
import { View, Image, ViewStyle, StyleSheet, Text } from 'react-native';
import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

interface ImageBlockProps {
  source: string;
  fullWidth: boolean;
  title?: string;
  style?: ViewStyle;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ source, fullWidth = false, title, style }) => {
  const [imageDimensions, setImageDimensions] = useState({
    width: fullWidth ? 1 : 0.6,
    aspectRatio: fullWidth ? 2.3 : 1.2
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (source) {
      setIsLoaded(false);
      setHasError(false);

      // Get image dimension
      Image.getSize(
        source,
        (width, height) => {
          const containerWidth = fullWidth ? 1 : 0.6;
          const aspectRatio = width / height;

          setImageDimensions({
            width: containerWidth,
            aspectRatio: aspectRatio
          });
        },
        (error) => {
          // TODO: Log error
          // console.log('Get size error:', error);
          setHasError(true);
        }
      );
    }
  }, [source, fullWidth]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = (error: any) => {
    // console.log('Image load error:', error);
    setHasError(true);
  };

  // Container style động theo image dimensions
  const imageContainerStyle = [
    fullWidth ? styles.containerFull : styles.containerSmall,
    { aspectRatio: imageDimensions.aspectRatio }
  ];

  return (
    <View style={[{ alignItems: fullWidth ? 'stretch' : 'center' }, style]}>
      {/* Image Container */}
      <View style={imageContainerStyle}>
        {/* Placeholder - hiển thị khi chưa load xong */}
        {!isLoaded && !hasError && (
          <View style={styles.placeholder} />
        )}

        {/* Error placeholder */}
        {hasError && (
          <View style={[styles.placeholder, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 10, color: Colors.subtext }}>Impossible de charger l’image</Text>
          </View>
        )}

        {/* Image */}
        {!hasError && (
          <Image
            source={{ uri: source }}
            style={[
              fullWidth ? styles.imageFull : styles.imageSmall,
              { opacity: isLoaded ? 1 : 0 }
            ]}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </View>

      {/* Title */}
      {title && (
        <Text style={fullWidth ? styles.titleFull : styles.titleSmall}>
          {title}
        </Text>
      )}
    </View>
  );
};

export default ImageBlock;

const styles = StyleSheet.create({
  // Container image - full width (100%)
  containerFull: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  // Container image - small (60%)
  containerSmall: {
    position: 'relative',
    width: '60%',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.grayLight,
    zIndex: 1,
  },
  // Image full width
  imageFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  // Image small
  imageSmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'contain',
  },
  // Title image full width
  titleFull: {
    marginTop: Spacings.xs,
    fontSize: 12,
    color: Colors.subtext,
    marginHorizontal: Spacings.lg
  },
  // Title image small
  titleSmall: {
    marginTop: Spacings.xs,
    fontSize: 12,
    color: Colors.subtext,
    width: '60%',
    marginHorizontal: Spacings.lg
  },
});