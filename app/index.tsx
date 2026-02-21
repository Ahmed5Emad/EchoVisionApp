import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SettingsIcon, 
  UserGuideIcon
} from "../components/Icons";
import { useBluetooth } from "../context/BluetoothContext";
import { useDownload } from "../context/DownloadContext";

export default function Index() {
  const router = useRouter();
  const { 
    isScanning, 
    devices, 
    connectedDevice, 
    error, 
    scanDevices, 
    connectToDevice, 
    disconnect
  } = useBluetooth();
  
  const { downloadedModels } = useDownload();
  const [activeModel, setActiveModel] = useState('');

  useEffect(() => {
    loadActiveModel();
  }, []);

  const loadActiveModel = async () => {
    try {
      const model = await AsyncStorage.getItem('model');
      if (model) setActiveModel(model);
    } catch (e) {
      console.error("Failed to load active model", e);
    }
  };

  const selectActiveModel = async (modelName: string) => {
    setActiveModel(modelName);
    await AsyncStorage.setItem('model', modelName);
  };

  return (
    <LinearGradient 
      colors={['#C7BEF4', '#EBF4BE']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Pressable 
            onPress={() => router.push('/user_guide' as any)} 
            style={styles.iconButton}
          >
            <UserGuideIcon width={24} height={24} color="#424242" />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/settings' as any)} 
            style={styles.iconButton}
          >
            <SettingsIcon color="#424242" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- Bluetooth Connection Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContentPadding}>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not Connected'}
                </Text>
                {connectedDevice ? (
                  <Pressable onPress={disconnect} style={styles.disconnectButton}>
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={scanDevices} style={styles.scanButton} disabled={isScanning}>
                    {isScanning ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.scanButtonText}>Scan</Text>
                    )}
                  </Pressable>
                )}
              </View>

              {!connectedDevice && devices.length > 0 && (
                <View style={styles.deviceList}>
                  {devices.map((device) => (
                    <Pressable 
                      key={device.id} 
                      style={styles.deviceItem}
                      onPress={() => connectToDevice(device)}
                    >
                      <Text style={styles.deviceText}>{device.name || 'Unknown Device'}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {error && <Text style={styles.errorText}>{error}</Text>}
            </BlurView>
          </View>
        </View>

        {/* --- Model Selection Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Model</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContentPadding}>
              {downloadedModels.length === 0 ? (
                <Text style={styles.emptyText}>No models downloaded. Go to Settings to download one.</Text>
              ) : (
                <View style={styles.modelList}>
                  {downloadedModels.map((m) => {
                    const isActive = activeModel === m;
                    return (
                      <Pressable 
                        key={m} 
                        style={[styles.modelRow, isActive && styles.activeModelRow]}
                        onPress={() => selectActiveModel(m)}
                      >
                        <View style={[styles.radioButton, isActive && styles.radioButtonSelected]}>
                          {isActive && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={[styles.modelText, isActive && styles.activeModelText]}>
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </BlurView>
          </View>
        </View>

        {/* --- Start Button --- */}
        <Pressable 
          onPress={() => router.push('/transcription' as any)}
          style={styles.glassContainerSmall}
        >
          <BlurView intensity={40} tint="light" style={styles.blurContent}>
            <Text style={styles.showTranscriptText}>Start</Text>
          </BlurView>
        </Pressable>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
    marginBottom: 10,
    marginLeft: 5,
  },
  glassContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContentPadding: {
    padding: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#2E66F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  disconnectButton: {
    backgroundColor: '#FF4B4B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disconnectButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deviceList: {
    marginTop: 10,
    gap: 8,
  },
  deviceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  deviceText: {
    fontSize: 13,
    color: '#424242',
  },
  modelList: {
    flexDirection: 'column',
    gap: 8,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  activeModelRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: '#2E66F5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2E66F5',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E66F5',
  },
  modelText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  activeModelText: {
    fontWeight: 'bold',
    color: '#2E66F5',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 11,
    marginTop: 8,
  },
  glassContainerSmall: {
    width: "100%",
    height: 70,   
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    flex: 1, 
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  showTranscriptText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#424242",
  },
});
