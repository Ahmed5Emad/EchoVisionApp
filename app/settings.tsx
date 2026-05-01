import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, ScrollView, TextInput, Switch } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

import { BackIcon, DownloadIcon, CheckIcon, TrashIcon, PauseIcon, PlayIcon, CloseIcon, BrightnessIcon, FontIcon } from '../components/Icons';
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
      if (lang) setSelectedLanguage(lang);
      if (model) setActiveModel(model);
      if (remote) setIsRemote(remote === 'true');
    } catch (e) { }
  };

  const saveLanguage = async (lang: string) => {
    setSelectedLanguage(lang);
    await AsyncStorage.setItem('language', lang);
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
  const currentTask = downloadState.modelId === currentCombination ? downloadState : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon width={22} height={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* --- Screen Control Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SCREEN CONTROL</Text>
          
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

                <View style={styles.divider} />

                <Text style={styles.sliderLabel}>Language</Text>
                <View style={[styles.chipContainer, { marginBottom: 0, marginTop: 12 }]}>
                  {LANGUAGES.map((lang) => (
                    <Pressable 
                      key={lang.id} 
                      onPress={() => saveLanguage(lang.id)} 
                      style={[styles.chip, selectedLanguage === lang.id && styles.activeChip]}
                    >
                      <Text style={[styles.chipText, selectedLanguage === lang.id && styles.activeChipText]}>{lang.name}</Text>
                    </Pressable>
                  ))}
                </View>
          </View>
        </View>

        {/* Model Builder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OFFLINE MODEL SETUP</Text>
          <View style={styles.card}>
              <Text style={styles.configLabel}>Model Type</Text>
              <View style={styles.configChipGroup}>
                {MODEL_FAMILIES.map(f => (
                  <Pressable key={f.id} onPress={() => setSelFamily(f.id)} style={[styles.configChip, selFamily === f.id && styles.activeConfigChip]}>
                    <Text style={[styles.configChipText, selFamily === f.id && styles.activeConfigChipText]}>{f.name}</Text>
                  </Pressable>
                ))}
              </View>

              {MODEL_FAMILIES.find(f => f.id === selFamily)?.hasEn && (
                <>
                  <Text style={styles.configLabel}>Model Language</Text>
                  <View style={styles.configChipGroup}>
                    <Pressable onPress={() => setSelType('en')} style={[styles.configChip, selType === 'en' && styles.activeConfigChip]}>
                      <Text style={[styles.configChipText, selType === 'en' && styles.activeConfigChipText]}>English Only</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelType('multilingual')} style={[styles.configChip, selType === 'multilingual' && styles.activeConfigChip]}>
                      <Text style={[styles.configChipText, selType === 'multilingual' && styles.activeConfigChipText]}>Multilingual</Text>
                    </Pressable>
                  </View>
                </>
              )}

              <View style={styles.modelPreviewBox}>
                <View>
                  <Text style={styles.previewLabel}>Model</Text>
                  <Text style={styles.previewValue}>{currentCombination}</Text>
                </View>
                <View style={styles.sizeBadge}>
                   <Text style={styles.sizeBadgeText}>{estSize} MB</Text>
                </View>
              </View>

              {isCurrentDownloaded ? (
                <View style={styles.readyBadge}>
                   <CheckIcon color="#34C759" width={18} height={18} />
                   <Text style={styles.readyBadgeText}>Already in Storage</Text>
                </View>
              ) : currentTask ? (
                <View style={styles.readyBadge}>
                   <ActivityIndicator color={activeColor} size="small" />
                   <Text style={[styles.readyBadgeText, {color: activeColor}]}>{currentTask.isPaused ? 'Paused' : 'Downloading...'}</Text>
                </View>
              ) : (
                <Pressable onPress={() => downloadModel(currentCombination)} style={styles.downloadPrimaryAction}>
                  <DownloadIcon color="#FFF" width={20} height={20} />
                  <Text style={styles.downloadPrimaryActionText}>Start Download</Text>
                </Pressable>
              )}
          </View>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORAGE MANAGEMENT</Text>
          <View style={styles.card}>
              {/* Show Active Download in Storage Management if exists */}
              {downloadState.modelId && (
                <View style={[styles.optionItem, downloadedModels.length > 0 && { borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionText, { color: activeColor }]}>{downloadState.modelId}</Text>
                    <View style={styles.progressRowStorage}>
                      <View style={styles.progressBarBg}>
                         <View style={[styles.progressBarFill, { width: `${downloadState.progress * 100}%` }]} />
                      </View>
                      <Text style={styles.progressPercentageText}>{Math.round(downloadState.progress * 100)}%</Text>
                    </View>
                  </View>
                  <View style={styles.downloadButtonsStorage}>
                    <Pressable onPress={() => downloadState.isPaused ? resumeDownload() : pauseDownload()} style={styles.smallActionBtn}>
                      {downloadState.isPaused ? <PlayIcon width={16} height={16} color={activeColor} /> : <PauseIcon width={16} height={16} color={activeColor} />}
                    </Pressable>
                    <Pressable onPress={() => cancelDownload()} style={styles.smallActionBtn}><CloseIcon width={16} height={16} color="#FF3B30" /></Pressable>
                  </View>
                </View>
              )}

              {downloadedModels.length === 0 && !downloadState.modelId ? (
                <Text style={styles.emptyText}>No models on disk.</Text>
              ) : (
                downloadedModels.map((m, idx) => (
                  <View key={m} style={[styles.optionItem, idx === downloadedModels.length-1 && {borderBottomWidth:0}]}>
                    <View style={styles.modelItemInfo}>
                      <Text style={[styles.optionText, activeModel === m && styles.selectedText]}>{m}</Text>
                      {activeModel === m && <View style={[styles.statusDot, {backgroundColor: activeColor, width:6, height:6}]} />}
                    </View>
                    <Pressable onPress={() => handleDeleteModel(m)} style={styles.deleteButton}><TrashIcon width={18} height={18} color="#FF3B30" /></Pressable>
                  </View>
                ))
              )}
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
    elevation: 3 
  },
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
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 20, width: '100%' },
  scaleIcon: { fontSize: 12, fontWeight: '800', color: '#C7C7CC' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
  optionText: { fontSize: 16, color: "#1A1A1A", fontWeight: "600" },
  selectedText: { color: "#007AFF" },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, paddingHorizontal: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E5E5" },
  activeChip: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#48484A", fontWeight: "600" },
  activeChipText: { color: "#FFF" },
  configLabel: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  configChipGroup: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  configChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  activeConfigChip: { backgroundColor: '#FFFFFF', borderColor: '#007AFF', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  configChipText: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  activeConfigChipText: { color: '#007AFF' },
  modelPreviewBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F2F2F7' },
  previewLabel: { fontSize: 9, fontWeight: '900', color: '#AEAEB2', letterSpacing: 1, marginBottom: 2 },
  previewValue: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  sizeBadge: { backgroundColor: '#E5E5EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sizeBadgeText: { fontSize: 12, fontWeight: '800', color: '#48484A' },
  downloadPrimaryAction: { backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 14, gap: 10 },
  downloadPrimaryActionText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54 },
  readyBadgeText: { fontSize: 15, fontWeight: '800', color: '#34C759' },
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
  progressRowStorage: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#007AFF' },
  progressPercentageText: { fontSize: 12, fontWeight: '700', color: '#8E8E93', minWidth: 35 },
  downloadButtonsStorage: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  smallActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  modelItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1F0' },
  emptyText: { textAlign: 'center', color: "#8E8E93", fontSize: 14, fontWeight: "500" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
});