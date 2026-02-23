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
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EchoVision</Text>
        <View style={styles.headerRight}>
          <Pressable 
            onPress={() => router.push('/user_guide' as any)} 
            style={styles.iconButton}
          >
            <UserGuideIcon width={22} height={22} color="#1A1A1A" />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/settings' as any)} 
            style={styles.iconButton}
          >
            <SettingsIcon width={22} height={22} color="#1A1A1A" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- Bluetooth Connection Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HARDWARE CONNECTION</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusIndicator, { backgroundColor: connectedDevice ? '#34C759' : '#FF3B30' }]} />
                <Text style={styles.statusText}>
                  {connectedDevice ? connectedDevice.name : 'No device connected'}
                </Text>
              </View>
              {connectedDevice ? (
                <Pressable onPress={disconnect} style={styles.textButton}>
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </Pressable>
              ) : (
                <Pressable onPress={scanDevices} style={styles.scanButton} disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.scanButtonText}>Search</Text>
                  )}
                </Pressable>
              )}
            </View>

            {!connectedDevice && devices.length > 0 && (
              <View style={styles.deviceList}>
                <Text style={styles.subLabel}>Available Devices</Text>
                {devices.map((device) => (
                  <Pressable 
                    key={device.id} 
                    style={styles.deviceItem}
                    onPress={() => connectToDevice(device)}
                  >
                    <Text style={styles.deviceName}>{device.name || 'Unknown Device'}</Text>
                    <View style={styles.connectChevron} />
                  </Pressable>
                ))}
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>

        {/* --- Model Selection Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRANSCRIPTION ENGINE</Text>
          <View style={styles.card}>
            {downloadedModels.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No local models found.</Text>
                <Pressable onPress={() => router.push('/settings' as any)}>
                   <Text style={styles.linkText}>Go to Downloads →</Text>
                </Pressable>
              </View>
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
                      <Text style={[styles.modelText, isActive && styles.activeModelText]}>
                        {m}
                      </Text>
                      {isActive && <View style={styles.checkIcon} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* --- Start Button --- */}
        <Pressable 
          onPress={() => router.push('/transcription' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Start Transcription</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8E8E93",
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disconnectText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 14,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    marginTop: 15,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  deviceList: {
    marginTop: 5,
    gap: 8,
  },
  deviceItem: {
    backgroundColor: '#F2F2F7',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  connectChevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#C7C7CC',
    transform: [{ rotate: '45deg' }],
  },
  modelList: {
    flexDirection: 'column',
    gap: 10,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeModelRow: {
    backgroundColor: '#F0F7FF',
    borderColor: '#007AFF',
  },
  modelText: {
    fontSize: 15,
    color: '#48484A',
    fontWeight: '500',
  },
  activeModelText: {
    fontWeight: '700',
    color: '#007AFF',
  },
  checkIcon: {
    width: 10,
    height: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#007AFF',
    transform: [{ rotate: '45deg' }, { translateY: -2 }],
    marginRight: 5,
  },
  emptyContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryButton: {
    width: "100%",
    height: 58,   
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
