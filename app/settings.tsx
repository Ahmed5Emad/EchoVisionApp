import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  { id: 'medium', name: 'Medium', hasEn: true, baseSize: 1500 },
  { id: 'large-v1', name: 'Large v1', hasEn: false, baseSize: 3000 },
  { id: 'large-v2', name: 'Large v2', hasEn: false, baseSize: 3000 },
  { id: 'large-v3', name: 'Large v3', hasEn: false, baseSize: 3000 },
  { id: 'large-v3-turbo', name: 'Large v3 Turbo', hasEn: false, baseSize: 1600 },
];

const QUANT_OPTIONS: Record<string, string[]> = {
  'tiny': ['standard', 'q5_1', 'q8_0'],
  'tiny.en': ['standard', 'q5_1', 'q8_0'],
  'base': ['standard', 'q5_1', 'q8_0'],
  'base.en': ['standard', 'q5_1', 'q8_0'],
  'small': ['standard', 'q5_1', 'q8_0'],
  'small.en': ['standard', 'q5_1', 'q8_0'],
  'medium': ['standard', 'q5_0', 'q8_0'],
  'medium.en': ['standard', 'q5_0', 'q8_0'],
  'large-v1': ['standard'],
  'large-v2': ['standard', 'q5_0', 'q8_0'],
  'large-v3': ['standard', 'q5_0'],
  'large-v3-turbo': ['standard', 'q5_0', 'q8_0'],
};

// Helper to estimate size in MB
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
    downloadState, 
    downloadModel, 
    pauseDownload, 
    resumeDownload, 
    cancelDownload, 
    downloadedModels, 
    deleteModel: deleteModelFromStore 
  } = useDownload();
  
  // App Settings
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeModel, setActiveModel] = useState(''); 
  
  // Download Selection State
  const [selFamily, setSelFamily] = useState('tiny');
  const [selType, setSelType] = useState<'en' | 'multilingual'>('en');
  const [selQuant, setSelQuant] = useState('standard');

  // Display Controls State
  const [activeMode, setActiveMode] = useState<Mode>('brightness');
  const [brightness, setBrightness] = useState(60);
  const [fontSize, setFontSize] = useState(24);

  const activeColor = "#2E66F5";
  const inactiveColor = "#9D9D9D";

  const isBrightness = activeMode === 'brightness';
  const currentValue = isBrightness ? brightness : fontSize;
  
  const minVal = isBrightness ? 0 : 12;
  const maxVal = isBrightness ? 100 : 40;


  useEffect(() => {
    loadSettings();
  }, []);

  // Update Type and Quant when Family changes
  useEffect(() => {
    const family = MODEL_FAMILIES.find(f => f.id === selFamily);
    if (family && !family.hasEn) setSelType('multilingual');
    setSelQuant('standard');
  }, [selFamily]);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem('language');
      const model = await AsyncStorage.getItem('model');
      if (lang) setSelectedLanguage(lang);
      if (model) setActiveModel(model);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
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

  const handleDeleteModel = async (modelName: string) => {
    Alert.alert(
      "Delete Model",
      `Are you sure you want to delete ${modelName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteModelFromStore(modelName);
              if (activeModel === modelName) {
                setActiveModel('');
                await AsyncStorage.removeItem('model');
              }
              Alert.alert("Success", "Model deleted successfully.");
            } catch (e) {
              console.error("Delete error", e);
              Alert.alert("Error", "Failed to delete model.");
            }
          }
        }
      ]
    );
  };

  const handleSliderChange = (val: number) => {
    if (isBrightness) {
      setBrightness(val);
    } else {
      setFontSize(val);
    }
  };

  const handleSlidingComplete = (val: number) => {
    const roundedVal = Math.round(val);
    if (isBrightness) {
      sendData(`cmd:brightness:${roundedVal}`);
    } else {
      sendData(`cmd:font:${roundedVal}`);
    }
  };

  const availableQuants = QUANT_OPTIONS[selType === 'en' ? `${selFamily}.en` : selFamily] || ['standard'];

  const isDownloadingThis = downloadState.modelId === currentCombination;

  return (
    <LinearGradient
      colors={['#C7BEF4', '#EBF4BE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon color="#424242" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* --- Display Controls Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Controls</Text>
          <View style={styles.glassContainer}>
             <BlurView intensity={40} tint="light" style={styles.controlBlurContent}>
                
                {/* Control Toggles */}
                <View style={styles.controlsRow}>
                  <Pressable 
                    style={[styles.controlToggle, isBrightness && styles.activeControlToggle]} 
                    onPress={() => setActiveMode('brightness')}
                  >
                     <BrightnessIcon 
                       width={24} 
                       height={24} 
                       color={isBrightness ? activeColor : inactiveColor} 
                     />
                     <Text style={[styles.controlText, isBrightness ? styles.activeControlText : styles.inactiveControlText]}>Brightness</Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.controlToggle, !isBrightness && styles.activeControlToggle]} 
                    onPress={() => setActiveMode('font')}
                  >
                     <FontIcon 
                       width={24} 
                       height={24} 
                       color={!isBrightness ? activeColor : inactiveColor} 
                     />
                     <Text style={[styles.controlText, !isBrightness ? styles.activeControlText : styles.inactiveControlText]}>Font Size</Text>
                  </Pressable>
                </View>

                {/* Slider */}
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderInfo}>
                     <View style={styles.valueBadge}>
                       <Text style={styles.valueText}>{Math.round(currentValue)}</Text>
                     </View>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={minVal}
                    maximumValue={maxVal}
                    value={currentValue}
                    onValueChange={handleSliderChange}
                    onSlidingComplete={handleSlidingComplete}
                    minimumTrackTintColor={activeColor}
                    maximumTrackTintColor="rgba(0,0,0,0.1)"
                    thumbTintColor="#FFFFFF"
                  />
                </View>

             </BlurView>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContent}>
              {LANGUAGES.map((lang) => (
                <Pressable 
                  key={lang.id} 
                  style={styles.optionItem}
                  onPress={() => saveLanguage(lang.id)}
                >
                  <Text style={[styles.optionText, selectedLanguage === lang.id && styles.selectedText]}>
                    {lang.name}
                  </Text>
                  {selectedLanguage === lang.id && <CheckIcon width={20} height={20} />}
                </Pressable>
              ))}
            </BlurView>
          </View>
        </View>

        {/* Model Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Downloads</Text>
          
          <Text style={styles.subLabel}>Size</Text>
          <View style={styles.chipContainer}>
            {MODEL_FAMILIES.map(f => (
              <Pressable 
                key={f.id} 
                onPress={() => setSelFamily(f.id)}
                style={[styles.chip, selFamily === f.id && styles.activeChip]}
              >
                <Text style={[styles.chipText, selFamily === f.id && styles.activeChipText]}>{f.name}</Text>
              </Pressable>
            ))}
          </View>

          {MODEL_FAMILIES.find(f => f.id === selFamily)?.hasEn && (
            <>
              <Text style={styles.subLabel}>Type</Text>
              <View style={styles.chipContainer}>
                <Pressable 
                  onPress={() => setSelType('en')}
                  style={[styles.chip, selType === 'en' && styles.activeChip]}
                >
                  <Text style={[styles.chipText, selType === 'en' && styles.activeChipText]}>English Only</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setSelType('multilingual')}
                  style={[styles.chip, selType === 'multilingual' && styles.activeChip]}
                >
                  <Text style={[styles.chipText, selType === 'multilingual' && styles.activeChipText]}>Multilingual</Text>
                </Pressable>
              </View>
            </>
          )}

          {availableQuants.length > 1 && (
            <>
              <Text style={styles.subLabel}>Quantization</Text>
              <View style={styles.chipContainer}>
                {availableQuants.map(q => (
                  <Pressable 
                    key={q}
                    onPress={() => setSelQuant(q)}
                    style={[styles.chip, selQuant === q && styles.activeChip]}
                  >
                    <Text style={[styles.chipText, selQuant === q && styles.activeChipText]}>
                      {q === 'standard' ? 'Standard (FP16)' : q.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={[styles.glassContainer, { marginTop: 20 }]}>
            <BlurView intensity={60} tint="light" style={styles.statusBox}>
              <View style={styles.statusInfo}>
                <Text style={styles.currentModelLabel}>Selected Combination:</Text>
                <Text style={styles.currentModelName}>{currentCombination}</Text>
                <View style={styles.sizeBadge}>
                   <Text style={styles.sizeBadgeText}>Est. Size: {estSize >= 1000 ? (estSize/1000).toFixed(1) + ' GB' : estSize + ' MB'}</Text>
                </View>
              </View>

              {isDownloadingThis || (downloadState.isPaused && downloadState.modelId === currentCombination) ? (
                <View style={styles.downloadControlsContainer}>
                  <View style={styles.progressWrapper}>
                    <ActivityIndicator color="#2E66F5" animating={downloadState.isDownloading} />
                    <Text style={styles.progressText}>{Math.round(downloadState.progress * 100)}%</Text>
                  </View>
                  <View style={styles.downloadButtons}>
                    {downloadState.isPaused ? (
                      <Pressable onPress={resumeDownload} style={styles.iconButton}>
                        <PlayIcon color="#2E66F5" />
                      </Pressable>
                    ) : (
                      <Pressable onPress={pauseDownload} style={styles.iconButton}>
                        <PauseIcon color="#2E66F5" />
                      </Pressable>
                    )}
                    <Pressable onPress={cancelDownload} style={styles.iconButton}>
                      <CloseIcon color="#FF4B4B" />
                    </Pressable>
                  </View>
                </View>
              ) : isCurrentDownloaded ? (
                <View style={styles.downloadedBadge}>
                  <CheckIcon color="#2E66F5" width={20} height={20} />
                  <Text style={styles.downloadedBadgeText}>Downloaded</Text>
                </View>
              ) : (
                <Pressable 
                  onPress={() => downloadModel(currentCombination)}
                  style={[styles.downloadAction, downloadState.isDownloading && styles.disabledButton]}
                  disabled={downloadState.isDownloading}
                >
                  <DownloadIcon color="#FFF" />
                  <Text style={styles.downloadActionText}>Download Model</Text>
                </Pressable>
              )}
            </BlurView>
          </View>
        </View>

        {/* List of Downloaded Models */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Downloads</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContent}>
              {downloadedModels.length === 0 ? (
                <Text style={styles.emptyText}>No models downloaded yet.</Text>
              ) : (
                downloadedModels.map((m) => (
                  <View key={m} style={styles.optionItem}>
                    <View style={styles.modelItemInfo}>
                      <Text style={[styles.optionText, activeModel === m && styles.selectedText]}>{m}</Text>
                      {activeModel === m && <CheckIcon width={18} height={18} style={{marginLeft: 8}} />}
                    </View>
                    <Pressable onPress={() => handleDeleteModel(m)} style={styles.deleteButton}>
                      <TrashIcon width={20} height={20} color="#FF4B4B" />
                    </Pressable>
                  </View>
                ))
              )}
            </BlurView>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#424242",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#424242",
    marginBottom: 15,
    marginLeft: 5,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginLeft: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  activeChip: {
    backgroundColor: "#2E66F5",
    borderColor: "#2E66F5",
  },
  chipText: {
    fontSize: 13,
    color: "#424242",
    fontWeight: "500",
  },
  activeChipText: {
    color: "#FFF",
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    paddingVertical: 5,
  },
  controlBlurContent: {
    padding: 20,
    gap: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  controlToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeControlToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: '#2E66F5',
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeControlText: {
    color: '#2E66F5',
  },
  inactiveControlText: {
    color: '#666',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sliderInfo: {
    width: 40,
    alignItems: 'center',
  },
  valueBadge: {
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: "#424242"
  },
  slider: {
    flex: 1,
    height: 40,
  },
  statusBox: {
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  statusInfo: {
    alignItems: 'center',
  },
  currentModelLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  currentModelName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E66F5",
  },
  sizeBadge: {
    marginTop: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeBadgeText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  downloadAction: {
    backgroundColor: "#2E66F5",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  downloadActionText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  downloadControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E66F5",
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(46, 102, 245, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 102, 245, 0.3)',
  },
  downloadedBadgeText: {
    color: '#2E66F5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modelItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
  },
  optionText: {
    fontSize: 15,
    color: "#424242",
    fontWeight: "500",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#2E66F5",
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: "#999",
    fontStyle: 'italic',
  }
});
