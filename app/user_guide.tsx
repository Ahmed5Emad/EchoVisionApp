import React from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from "expo-router";
import { BackIcon } from '../components/Icons';

export default function UserGuide() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Getting Started",
      content: "Welcome to WhisperApp! This app uses OpenAI's Whisper models to perform high-quality, local transcription directly on your device. No data ever leaves your phone."
    },
    {
      title: "2. Connecting",
      content: "Use the 'Connection' section on the home screen to scan and connect to your Linux system via Bluetooth. This enables real-time data transfer."
    },
    {
      title: "3. Downloading Models",
      content: "Before transcribing, you need to download a model. Go to Settings (top-right icon) and select a model size. You can also adjust display brightness and font size here."
    },
    {
      title: "4. Active Model",
      content: "Once a model is downloaded, you can select it from the 'Active Model' list on the home screen. The selected model is highlighted and will be used for all transcriptions."
    },
    {
      title: "5. Transcription",
      content: "Tap 'Show Transcript' on the home screen to enter the transcription view. Tap the microphone button to start speaking; your speech will be converted to text and sent to your connected device in real-time."
    }
  ];

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
        <Text style={styles.headerTitle}>User Guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.glassContainer}>
              <BlurView intensity={40} tint="light" style={styles.blurContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionText}>{section.content}</Text>
              </BlurView>
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Pressable 
            onPress={() => router.replace('/' as any)}
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>Return to Home</Text>
          </Pressable>
          <Text style={styles.footerText}>WhisperApp v1.0.0</Text>
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
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
    marginBottom: 20,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E66F5",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: "#424242",
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: "#888",
  },
  homeButton: {
    backgroundColor: "rgba(46, 102, 245, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(46, 102, 245, 0.3)",
  },
  homeButtonText: {
    color: "#2E66F5",
    fontWeight: "bold",
    fontSize: 14,
  }
});