import { Stack } from "expo-router";
import { BluetoothProvider } from "../context/BluetoothContext";
import { DownloadProvider } from "../context/DownloadContext";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [appReady, setAppReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any required resources here if needed
        await new Promise(resolve => setTimeout(resolve, 2500)); // Show credits for 2.5s
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
        // Delay hiding the custom overlay slightly for a smooth transition
        setTimeout(() => setSplashVisible(false), 500);
      }
    }

    prepare();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <DownloadProvider>
        <BluetoothProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'fade',
              statusBarTranslucent: true,
              statusBarStyle: 'dark',
            }} 
          />
        </BluetoothProvider>
      </DownloadProvider>

      {splashVisible && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut.duration(400)} 
          style={styles.splashOverlay}
        >
          <View style={styles.content}>
            <Text style={styles.brand}>ECHOVISION</Text>
            <View style={styles.divider} />
            <Text style={styles.credit}>Created by EchoVision Team</Text>
            <Text style={styles.supervisor}>Supervised by Prof. Sabah Saad</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 20,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#007AFF',
    marginBottom: 20,
  },
  credit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
    textAlign: 'center',
  },
  supervisor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  }
});