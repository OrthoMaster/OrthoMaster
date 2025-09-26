/**
 * Capture guard screen - Fixed version only Android
 * 
 * @author Francis
 */

import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useGlobal } from '../../component/GlobalContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function UseCaptureGuard({ children }) {
  const { globalData, setGlobalData } = useGlobal();

  useEffect(() => {
    const isCapturePrevented = globalData.isCapturePrevented;
    if (!isCapturePrevented) {
      preventCapture();
      // Add global param
      setGlobalData(prevData => ({
        ...prevData,
        isCapturePrevented: true
      }));
    }
  }, []);

  // Safe prevent capture with 3 times
  const safePreventCapture = async (retryCount = 0) => {
    try {
      if (Platform.OS === 'android') {
        await ScreenCapture.preventScreenCaptureAsync(`prevent_${Date.now()}_${retryCount}`);
      }
      return true;
    } catch (error) {
      Alert.alert("Empêcher la capture d'écran: ", error);
      return false;
    }
  };

  const preventCapture = async () => {
    try {
      if (Platform.OS === 'android') {
        await safePreventCapture();
      }
      return true;
    } catch (error) {
      Alert.alert("Empêcher la capture d'écran: ", error);
      return false;
    };
  };

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      {children}
    </SafeAreaProvider>
  );
}