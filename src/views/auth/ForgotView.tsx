import React, { useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

export const ForgotView = ({ navigation, route }) => {
  const webUrl = process.env.EXPO_PUBLIC_AUTH_WEB_URL;
  const webViewRef = useRef(null);

  // Handle messages từ WebView
  const handleWebViewMessage = useCallback((event) => {
    // const data = JSON.parse(event.nativeEvent.data);
    // data.type == 'CLOSE'
    navigation.goBack();
  }, [navigation]);

  // Handle back to login navigation
  const handleBackToLogin = useCallback((): void => {
    navigation.goBack()
  }, []);

  return (
    <View style={Styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Feather name="arrow-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${webUrl}/forgot-password?inapp=true` }}
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