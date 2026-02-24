import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, ScrollView, Switch, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SettingsIcon, 
  UserGuideIcon,
  ServerIcon
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
  const [isRemote, setIsRemote] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://192.168.1.100:3000/ws');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const model = await AsyncStorage.getItem('model');
      if (model) setActiveModel(model);
      
      const remote = await AsyncStorage.getItem('isRemote');
      if (remote) setIsRemote(remote === 'true');
      
      const url = await AsyncStorage.getItem('serverUrl');
      if (url) setServerUrl(url || 'ws://192.168.1.100:3000/ws');
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const selectActiveModel = async (modelName: string) => {
    setActiveModel(modelName);
    await AsyncStorage.setItem('model', modelName);
  };

  const toggleRemote = async (val: boolean) => {
    setIsRemote(val);
    await AsyncStorage.setItem('isRemote', val.toString());
  };

  const saveServerUrl = async (url: string) => {
    let cleanUrl = url.trim();
    if (cleanUrl && !cleanUrl.startsWith('ws://') && !cleanUrl.startsWith('wss://') && !cleanUrl.startsWith('http')) {
      cleanUrl = 'ws://' + cleanUrl;
    }
    setServerUrl(cleanUrl);
    await AsyncStorage.setItem('serverUrl', cleanUrl);
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
        
        {/* --- Cloud Processing Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRANSCRIPTION ENGINE</Text>
          <View style={styles.card}>
              <View style={styles.optionItemNoBorder}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, {backgroundColor: '#E0EEFF'}]}>
                    <ServerIcon width={20} height={20} color="#007AFF" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.optionTextBold}>Cloud Processing</Text>
                    <Text style={styles.subText}>{isRemote ? 'Enabled' : 'Local Only'}</Text>
                  </View>
                </View>
                <Switch 
                  value={isRemote} 
                  onValueChange={toggleRemote}
                  trackColor={{ false: "#D1D1D1", true: "#007AFF" }}
                  thumbColor="#FFF"
                />
              </View>

              {isRemote && (
                <View style={styles.serverInputWrapper}>
                  <Text style={styles.inputLabel}>WebSocket Endpoint</Text>
                  <TextInput
                    style={styles.serverInput}
                    value={serverUrl}
                    onChangeText={saveServerUrl}
                    placeholder="ws://192.168.1.100:3000/ws"
                    placeholderTextColor="#C7C7CC"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.serverStatusInfo}>
                    <View style={[styles.statusDot, {backgroundColor: '#34C759'}]} />
                    <Text style={styles.serverStatusText}>Ready to connect</Text>
                  </View>
                </View>
              )}
          </View>
        </View>

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
                    <Text style={device.id === connectedDevice?.id ? styles.activeModelText : styles.deviceName}>
                      {device.name || 'Unknown Device'}
                    </Text>
                    <View style={styles.connectChevron} />
                  </Pressable>
                ))}
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>

        {/* --- Local Model Selection Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCAL MODELS</Text>
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
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionTextBold: { fontSize: 16, color: "#1A1A1A", fontWeight: "700" },
  subText: { fontSize: 13, color: "#8E8E93", fontWeight: "500", marginTop: 1 },
  optionItemNoBorder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serverInputWrapper: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  inputLabel: { fontSize: 12, fontWeight: "800", color: "#8E8E93", marginBottom: 8, marginLeft: 2 },
  serverInput: { backgroundColor: "#F2F2F7", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1A1A1A", fontWeight: "600", borderWidth: 1, borderColor: '#E5E5EA' },
  serverStatusInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  serverStatusText: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  cardContainer: {
    position: 'relative',
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
    fontSize: 14,
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
