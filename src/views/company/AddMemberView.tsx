import React, { useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

export const AddMemberView = ({ navigation, route }) => {
  const { webUrl, onGoBack } = route.params;
  const webViewRef = useRef(null);

  // Hide bottom nav
  useFocusEffect(
    useCallback(() => {
      // Hide
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });

      // Re-Show when unmount
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: { display: 'flex' }
        });
      };
    }, [navigation])
  );

  // Handle messages WebView
  const handleWebViewMessage = useCallback((event) => {
    onGoBack?.();
    navigation.goBack();
  }, [navigation]);

  // Handle back to login navigation
  const handleBackToView = useCallback((): void => {
    navigation.goBack()
  }, []);

  return (
    <View style={Styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToView}
        >
          <Feather name="arrow-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${webUrl}` }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={Styles.container}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
});