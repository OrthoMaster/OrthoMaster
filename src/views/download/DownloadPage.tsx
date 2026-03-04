import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

type DeviceType = 'ios' | 'android' | 'desktop';

const DownloadPage = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setDeviceType('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const handleAppStorePress = () => {
    Linking.openURL('https://apps.apple.com/us/app/orthomaster/id1644851864');
  };

  const handlePlayStorePress = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo ou icône de l'app */}
        <View style={styles.iconContainer}>
          <Image source={require('../../../assets/v2_images/logo/icon.png')} style={styles.icon} resizeMode="contain" />
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          Téléchargez notre application
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Pour une meilleure expérience sur mobile, veuillez télécharger notre application.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {(deviceType === 'ios' || deviceType === 'desktop') && (
            <TouchableOpacity
              style={styles.storeButton}
              onPress={handleAppStorePress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <FontAwesome6 name="apple" size={40} color='#fff' />
                <View style={styles.buttonText}>
                  <Text style={styles.downloadText}>Télécharger sur</Text>
                  <Text style={styles.storeName}>App Store</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(deviceType === 'android' || deviceType === 'desktop') && (
            <TouchableOpacity
              style={styles.storeButton}
              onPress={handlePlayStorePress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <FontAwesome6 name="google-play" size={30} color='#fff' />
                <View style={styles.buttonText}>
                  <Text style={styles.downloadText}>Télécharger sur</Text>
                  <Text style={styles.storeName}>Google Play</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer info */}
        <Text style={styles.footer}>
          Version web disponible uniquement sur écran plus large
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins-Bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  storeButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  playIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  buttonText: {
    alignItems: 'flex-start',
    marginLeft: 10
  },
  downloadText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  storeName: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Poppins-Light',
  },
});

export default DownloadPage;