import React from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { BackIcon } from '../components/Icons';

export default function UserGuide() {
  const router = useRouter();

  const sections = [
    {
      title: "Introduction",
      content: "EchoVision is a high-performance transcription system that bridges human speech with hardware displays. It supports both on-device local processing and high-speed cloud transcription."
    },
    {
      title: "Transcription Engines",
      content: "• Local Mode: Uses high-efficiency Whisper models (Tiny, Base, Small) that run entirely on your phone.\n• Cloud Mode: Connect to a remote Whisper server for superior accuracy and near-zero latency by offloading processing to powerful GPUs."
    },
    {
      title: "Hardware Bridge",
      content: "Connect to your supported Linux hardware via the Bluetooth section on the Home screen. Once linked, any transcribed text is automatically streamed to your hardware display in real-time."
    },
    {
      title: "Display Controls",
      content: "Fine-tune your hardware experience in Settings. Adjust the display brightness and text scale using intuitive sliders to ensure optimal visibility in any environment."
    },
    {
      title: "Model Management",
      content: "For local transcription, use the 'Model Builder' in Settings to download specialized language models. Keep your disk usage low by deleting unused models in the Storage section."
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon width={22} height={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>User Guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={styles.card}>
              <Text style={styles.sectionText}>{section.content}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Pressable 
            onPress={() => router.replace('/' as any)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </Pressable>
          <Text style={styles.versionText}>EchoVision v0.4.2</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    marginBottom: 8,
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
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionText: {
    fontSize: 15,
    color: "#3A3A3C",
    lineHeight: 22,
    fontWeight: "500",
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#AEAEB2",
    marginBottom: 20,
  }
});