
/**
 * Capture guard screen
 * @author Francis
 */

import * as ScreenCapture from "expo-screen-capture";
import { useEffect, useState } from "react";
import { View, Image, Text } from "react-native";

function CaptureGuard({ children }) {
    const [captured, setCaptured] = useState(false);

    useEffect(() => {
        // Android: prevent screenshot / record
        ScreenCapture.preventScreenCaptureAsync();

        // Listen screenshot event (iOS)
        const listener = ScreenCapture.addScreenshotListener(() => {
            setCaptured(true);
            setTimeout(() => setCaptured(false), 1500);
        });

        // Cleanup
        return () => {
            listener.remove();
            ScreenCapture.allowScreenCaptureAsync(); // Re-open
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            {children}
            {captured && (
                <View
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#09090b",
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Image
                        style={{ width: 200, height: 300, resizeMode: "contain" }}
                        source={require('../../../assets/images/capture-guard/capture-guard.webp')}
                    />
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600', textAlign: 'center', paddingTop: 20, width: '70%' }}>
                        Désolé, le contenu{'\n'}est protégé !
                    </Text>
                </View>
            )}
        </View>
    );
}

export default CaptureGuard;