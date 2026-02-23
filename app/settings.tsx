import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, ScrollView, TextInput, Switch } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

import { BackIcon, DownloadIcon, CheckIcon, TrashIcon, PauseIcon, PlayIcon, CloseIcon, BrightnessIcon, FontIcon, ServerIcon } from '../components/Icons';
import { useDownload } from '../context/DownloadContext';
import { useBluetooth } from "../context/BluetoothContext";

// --- DATA STRUCTURES ---

const MODEL_FAMILIES = [
  { id: 'tiny', name: 'Tiny', hasEn: true, baseSize: 75 },
  { id: 'base', name: 'Base', hasEn: true, baseSize: 145 },
  { id: 'small', name: 'Small', hasEn: true, baseSize: 480 },
];

const QUANT_OPTIONS: Record<string, string[]> = {
  'tiny': ['standard', 'q5_1', 'q8_0'],
  'tiny.en': ['standard', 'q5_1', 'q8_0'],
  'base': ['standard', 'q5_1', 'q8_0'],
  'base.en': ['standard', 'q5_1', 'q8_0'],
  'small': ['standard', 'q5_1', 'q8_0'],
  'small.en': ['standard', 'q5_1', 'q8_0'],
};

const getEstSize = (familyId: string, quant: string) => {
  const family = MODEL_FAMILIES.find(f => f.id === familyId);
  if (!family) return 0;
  if (quant === 'standard') return family.baseSize;
  if (quant.startsWith('q5')) return Math.round(family.baseSize * 0.38);
  if (quant.startsWith('q8')) return Math.round(family.baseSize * 0.55);
  return family.baseSize;
};

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'ar', name: 'Arabic' },
];

type Mode = 'brightness' | 'font';

export default function Settings() {
  const router = useRouter();
  const { sendData } = useBluetooth();
  const { 
    downloadState, downloadModel, pauseDownload, resumeDownload, cancelDownload, downloadedModels, deleteModel: deleteModelFromStore 
  } = useDownload();
  
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeModel, setActiveModel] = useState(''); 
  const [isRemote, setIsRemote] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://192.168.1.100:3000/ws');
  
  const [selFamily, setSelFamily] = useState('tiny');
  const [selType, setSelType] = useState<'en' | 'multilingual'>('en');
  const [selQuant, setSelQuant] = useState('standard');

  const [activeMode, setActiveMode] = useState<Mode>('brightness');
  const [brightness, setBrightness] = useState(60);
  const [fontSize, setFontSize] = useState(24);

  const activeColor = "#007AFF";
  const inactiveColor = "#8E8E93";

  const isBrightness = activeMode === 'brightness';
  const currentValue = isBrightness ? brightness : fontSize;
  const minVal = isBrightness ? 0 : 12;
  const maxVal = isBrightness ? 100 : 40;

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    const family = MODEL_FAMILIES.find(f => f.id === selFamily);
    if (family && !family.hasEn) setSelType('multilingual');
    setSelQuant('standard');
  }, [selFamily]);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem('language');
      const model = await AsyncStorage.getItem('model');
      const remote = await AsyncStorage.getItem('isRemote');
      const url = await AsyncStorage.getItem('serverUrl');
      if (lang) setSelectedLanguage(lang);
      if (model) setActiveModel(model);
      if (remote) setIsRemote(remote === 'true');
      if (url) setServerUrl(url);
    } catch (e) { }
  };

  const saveLanguage = async (lang: string) => {
    setSelectedLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const toggleRemote = async (val: boolean) => {
    setIsRemote(val);
    await AsyncStorage.setItem('isRemote', val.toString());
  };

  const saveServerUrl = async (url: string) => {
    setServerUrl(url);
    await AsyncStorage.setItem('serverUrl', url);
  };

  const currentCombination = useMemo(() => {
    let id = selFamily;
    if (selType === 'en') id += '.en';
    if (selQuant !== 'standard') id += '-' + selQuant;
    return id;
  }, [selFamily, selType, selQuant]);

  const estSize = useMemo(() => getEstSize(selFamily, selQuant), [selFamily, selQuant]);
  const isCurrentDownloaded = downloadedModels.includes(currentCombination);

  const handleDeleteModel = async (m: string) => {
    Alert.alert("Delete Model", `Delete ${m}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteModelFromStore(m);
          if (activeModel === m) { setActiveModel(''); await AsyncStorage.removeItem('model'); }
      }}
    ]);
  };

  const handleSliderChange = (val: number) => {
    if (isBrightness) setBrightness(val); else setFontSize(val);
  };

  const handleSlidingComplete = (val: number) => {
    const roundedVal = Math.round(val);
    if (isBrightness) sendData(`cmd:brightness:${roundedVal}`); else sendData(`cmd:font:${roundedVal}`);
  };

  const availableQuants = QUANT_OPTIONS[selType === 'en' ? `${selFamily}.en` : selFamily] || ['standard'];
  const isDownloadingThis = downloadState.modelId === currentCombination;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon width={22} height={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* --- Server Settings Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRANSCRIPTION ENGINE</Text>
          <View style={styles.card}>
              <View style={styles.optionItemNoBorder}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, {backgroundColor: '#E0EEFF'}]}>
                    <ServerIcon width={20} height={20} color={activeColor} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.optionTextBold}>Cloud Processing</Text>
                    <Text style={styles.subText}>{isRemote ? 'Enabled' : 'Local Only'}</Text>
                  </View>
                </View>
                <Switch 
                  value={isRemote} 
                  onValueChange={toggleRemote}
                  trackColor={{ false: "#D1D1D1", true: activeColor }}
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

        {/* --- Display Controls Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HARDWARE DISPLAY</Text>
          <View style={styles.card}>
                <View style={styles.controlsRow}>
                  <Pressable 
                    style={[styles.controlToggle, isBrightness && styles.activeControlToggle]} 
                    onPress={() => setActiveMode('brightness')}
                  >
                     <BrightnessIcon width={18} height={18} color={isBrightness ? activeColor : inactiveColor} />
                     <Text style={[styles.controlText, isBrightness ? styles.activeControlText : styles.inactiveControlText]}>Brightness</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.controlToggle, !isBrightness && styles.activeControlToggle]} 
                    onPress={() => setActiveMode('font')}
                  >
                     <FontIcon width={18} height={18} color={!isBrightness ? activeColor : inactiveColor} />
                     <Text style={[styles.controlText, !isBrightness ? styles.activeControlText : styles.inactiveControlText]}>Font Size</Text>
                  </Pressable>
                </View>

                <View style={styles.sliderSection}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>{isBrightness ? 'Intensity' : 'Scale'}</Text>
                    <View style={styles.valueBubble}>
                      <Text style={styles.valueBubbleText}>{Math.round(currentValue)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sliderWrapper}>
                    {isBrightness ? <BrightnessIcon width={14} height={14} color="#C7C7CC" /> : <Text style={styles.scaleIcon}>A</Text>}
                    <Slider
                      style={styles.slider}
                      minimumValue={minVal}
                      maximumValue={maxVal}
                      value={currentValue}
                      onValueChange={handleSliderChange}
                      onSlidingComplete={handleSlidingComplete}
                      minimumTrackTintColor={activeColor}
                      maximumTrackTintColor="#E5E5EA"
                      thumbTintColor={activeColor}
                    />
                    {isBrightness ? <BrightnessIcon width={22} height={22} color="#8E8E93" /> : <Text style={[styles.scaleIcon, {fontSize: 20}]}>A</Text>}
                  </View>
                </View>
          </View>
        </View>

        {/* Localization */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCALIZATION</Text>
          <View style={styles.card}>
              {LANGUAGES.map((lang, idx) => (
                <Pressable key={lang.id} style={[styles.optionItem, idx === LANGUAGES.length-1 && {borderBottomWidth:0}]} onPress={() => saveLanguage(lang.id)}>
                  <Text style={[styles.optionText, selectedLanguage === lang.id && styles.selectedText]}>{lang.name}</Text>
                  {selectedLanguage === lang.id && <CheckIcon width={18} height={18} color={activeColor} />}
                </Pressable>
              ))}
          </View>
        </View>

        {/* Model Builder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCAL MODEL BUILDER</Text>
          <Text style={styles.subLabel}>Architecture</Text>
          <View style={styles.chipContainer}>
            {MODEL_FAMILIES.map(f => (
              <Pressable key={f.id} onPress={() => setSelFamily(f.id)} style={[styles.chip, selFamily === f.id && styles.activeChip]}>
                <Text style={[styles.chipText, selFamily === f.id && styles.activeChipText]}>{f.name}</Text>
              </Pressable>
            ))}
          </View>
          {MODEL_FAMILIES.find(f => f.id === selFamily)?.hasEn && (
            <>
              <Text style={styles.subLabel}>Type</Text>
              <View style={styles.chipContainer}>
                <Pressable onPress={() => setSelType('en')} style={[styles.chip, selType === 'en' && styles.activeChip]}><Text style={[styles.chipText, selType === 'en' && styles.activeChipText]}>English</Text></Pressable>
                <Pressable onPress={() => setSelType('multilingual')} style={[styles.chip, selType === 'multilingual' && styles.activeChip]}><Text style={[styles.chipText, selType === 'multilingual' && styles.activeChipText]}>Multilingual</Text></Pressable>
              </View>
            </>
          )}
          <View style={[styles.card, { marginTop: 15, backgroundColor: '#F2F2F7', borderStyle: 'dashed' }]}>
              <View style={styles.statusInfoCenter}>
                <Text style={styles.currentModelLabel}>Identifier</Text>
                <Text style={styles.currentModelName}>{currentCombination}</Text>
                <Text style={styles.sizeText}>≈ {estSize} MB</Text>
              </View>
              {isDownloadingThis || (downloadState.isPaused && downloadState.modelId === currentCombination) ? (
                <View style={styles.downloadProgressCard}>
                  <View style={styles.progressRow}>
                    <ActivityIndicator color={activeColor} size="small" />
                    <Text style={styles.progressText}>{Math.round(downloadState.progress * 100)}%</Text>
                  </View>
                  <View style={styles.downloadButtons}>
                    <Pressable onPress={downloadState.isPaused ? resumeDownload : pauseDownload} style={styles.actionIconButton}>
                      {downloadState.isPaused ? <PlayIcon width={20} height={20} color={activeColor} /> : <PauseIcon width={20} height={20} color={activeColor} />}
                    </Pressable>
                    <Pressable onPress={cancelDownload} style={styles.actionIconButton}><CloseIcon width={20} height={20} color="#FF3B30" /></Pressable>
                  </View>
                </View>
              ) : isCurrentDownloaded ? (
                <View style={styles.downloadedBadge}><CheckIcon color={activeColor} width={16} height={16} /><Text style={styles.downloadedBadgeText}>Local Copy Ready</Text></View>
              ) : (
                <Pressable onPress={() => downloadModel(currentCombination)} style={[styles.downloadAction, downloadState.isDownloading && styles.disabledButton]} disabled={downloadState.isDownloading}>
                  <DownloadIcon color="#FFF" width={20} height={20} />
                  <Text style={styles.downloadActionText}>Download to Device</Text>
                </Pressable>
              )}
          </View>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORAGE MANAGEMENT</Text>
          <View style={styles.card}>
              {downloadedModels.length === 0 ? <Text style={styles.emptyText}>No models on disk.</Text> :
                downloadedModels.map((m, idx) => (
                  <View key={m} style={[styles.optionItem, idx === downloadedModels.length-1 && {borderBottomWidth:0}]}>
                    <View style={styles.modelItemInfo}>
                      <Text style={[styles.optionText, activeModel === m && styles.selectedText]}>{m}</Text>
                      {activeModel === m && <View style={[styles.statusDot, {backgroundColor: activeColor, width:6, height:6}]} />}
                    </View>
                    <Pressable onPress={() => handleDeleteModel(m)} style={styles.deleteButton}><TrashIcon width={18} height={18} color="#FF3B30" /></Pressable>
                  </View>
                ))
              }
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#E5E5E5", marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#8E8E93", marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  subLabel: { fontSize: 12, fontWeight: "700", color: "#48484A", marginBottom: 10, marginLeft: 4 },
  card: { width: "100%", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 20, borderWidth: 1, borderColor: "#E5E5E5", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
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
  controlsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  controlToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: 'transparent' },
  activeControlToggle: { backgroundColor: '#FFFFFF', borderColor: '#007AFF', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  controlText: { fontSize: 14, fontWeight: '700' },
  activeControlText: { color: '#007AFF' },
  inactiveControlText: { color: '#8E8E93' },
  sliderSection: { marginTop: 5 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 0.5 },
  valueBubble: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  valueBubbleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sliderWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slider: { flex: 1, height: 40 },
  scaleIcon: { fontSize: 12, fontWeight: '800', color: '#C7C7CC' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
  optionText: { fontSize: 16, color: "#1A1A1A", fontWeight: "600" },
  selectedText: { color: "#007AFF" },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, paddingHorizontal: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E5E5" },
  activeChip: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#48484A", fontWeight: "600" },
  activeChipText: { color: "#FFF" },
  statusInfoCenter: { alignItems: 'center', marginBottom: 15 },
  currentModelLabel: { fontSize: 11, fontWeight: '800', color: "#8E8E93", textTransform: 'uppercase' },
  currentModelName: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  sizeText: { fontSize: 13, color: "#8E8E93", fontWeight: "600" },
  downloadAction: { backgroundColor: "#1A1A1A", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, width: '100%', gap: 10 },
  disabledButton: { backgroundColor: "#C7C7CC" },
  downloadActionText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  downloadProgressCard: { width: '100%', gap: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  progressText: { fontSize: 14, fontWeight: "700", color: "#007AFF" },
  downloadButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  actionIconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5' },
  downloadedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  downloadedBadgeText: { color: '#007AFF', fontWeight: '800', fontSize: 14 },
  modelItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1F0' },
  emptyText: { textAlign: 'center', color: "#8E8E93", fontSize: 14, fontWeight: "500" }
});