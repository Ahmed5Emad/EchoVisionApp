import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

interface DownloadState {
  progress: number;
  isDownloading: boolean;
  isPaused: boolean;
  modelId: string | null;
}

interface DownloadContextType {
  downloadState: DownloadState;
  downloadModel: (modelId: string) => Promise<void>;
  pauseDownload: () => Promise<void>;
  resumeDownload: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  downloadedModels: string[];
  checkDownloadedModels: () => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

const RESUME_DATA_KEY = 'whisper_download_resume_data';
const DOWNLOADING_MODEL_KEY = 'whisper_downloading_model_id';
const MODELS_DIR = FileSystem.documentDirectory + 'whisper-models/';
const NOTIFICATION_ID = 'model-download-progress';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    progress: 0,
    isDownloading: false,
    isPaused: false,
    modelId: null,
  });
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const lastNotificationUpdate = useRef<number>(0);

  useEffect(() => {
    ensureDirExists();
    checkDownloadedModels();
    restoreDownload();
    requestPermissions();
    setupNotificationChannel();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    }
  };

  const setupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('download-progress-quiet', {
        name: 'Model Downloads',
        importance: Notifications.AndroidImportance.LOW,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [],
        enableVibrate: false,
        sound: null,
      });
    }
  };

  const updateNotification = async (progress: number, modelId: string, status: 'downloading' | 'paused' | 'completed' | 'failed') => {
    const now = Date.now();
    // Throttle updates to avoid overloading the system, except for status changes
    if (status === 'downloading' && now - lastNotificationUpdate.current < 2000) {
      return;
    }
    lastNotificationUpdate.current = now;

    let title = '';
    let body = '';

    switch (status) {
      case 'downloading':
        title = `Downloading ${modelId}...`;
        body = `${Math.round(progress * 100)}% complete`;
        break;
      case 'paused':
        title = `Download Paused: ${modelId}`;
        body = `${Math.round(progress * 100)}% complete`;
        break;
      case 'completed':
        title = 'Download Complete';
        body = `Model ${modelId} is ready to use.`;
        break;
      case 'failed':
        title = 'Download Failed';
        body = `Failed to download ${modelId}.`;
        break;
    }

    try {
      const notificationContent: Notifications.NotificationContentInput = {
        title,
        body,
        data: { progress: Math.round(progress * 100), status, modelId },
        sound: false,
        vibrate: [],
      };

      if (Platform.OS === 'android') {
        notificationContent.color = '#007AFF';
        // @ts-ignore - channelId is supported on Android but might not be in the base type depending on expo-notifications version
        notificationContent.android = {
          channelId: 'download-progress-quiet',
          sticky: status === 'downloading' || status === 'paused',
        };
      }

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: notificationContent,
        trigger: null,
      });
    } catch (e) {
      console.error('Failed to update notification', e);
    }
  };

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    }
  };

  const checkDownloadedModels = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!dirInfo.exists) {
        setDownloadedModels([]);
        return;
      }
      const files = await FileSystem.readDirectoryAsync(MODELS_DIR);
      const downloaded = files
        .filter(f => f.startsWith('ggml-') && f.endsWith('.bin'))
        .map(f => f.replace('ggml-', '').replace('.bin', ''));
      setDownloadedModels(downloaded);
    } catch (e) {
      console.error("Failed to check models", e);
    }
  };

  const restoreDownload = async () => {
    try {
      const pausedModelId = await AsyncStorage.getItem(DOWNLOADING_MODEL_KEY);
      const resumeData = await AsyncStorage.getItem(RESUME_DATA_KEY);

      if (pausedModelId && resumeData) {
        const fileName = `ggml-${pausedModelId}.bin`;
        const fileUri = MODELS_DIR + fileName;
        
        const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadState(prev => ({ ...prev, progress }));
          updateNotification(progress, pausedModelId, 'downloading');
        };

        downloadResumableRef.current = new FileSystem.DownloadResumable(
          `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${fileName}`,
          fileUri,
          {},
          callback,
          resumeData
        );

        setDownloadState({
          progress: 0, 
          isDownloading: false,
          isPaused: true,
          modelId: pausedModelId,
        });
      }
    } catch (e) {
      console.error("Failed to restore download", e);
    }
  };

  const downloadModel = async (modelId: string) => {
    if (downloadState.isDownloading) {
      Alert.alert("Error", "A download is already in progress.");
      return;
    }

    const fileName = `ggml-${modelId}.bin`;
    const fileUri = MODELS_DIR + fileName;
    const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${fileName}`;

    const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      setDownloadState(prev => ({ ...prev, progress }));
      updateNotification(progress, modelId, 'downloading');
    };

    downloadResumableRef.current = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      callback
    );

    setDownloadState({
      progress: 0,
      isDownloading: true,
      isPaused: false,
      modelId,
    });
    
    await AsyncStorage.setItem(DOWNLOADING_MODEL_KEY, modelId);
    await updateNotification(0, modelId, 'downloading');

    try {
      const result = await downloadResumableRef.current.downloadAsync();
      if (result && result.status === 200) {
        setDownloadedModels(prev => [...prev, modelId]);
        await updateNotification(1, modelId, 'completed');
        Alert.alert("Success", `Model ${modelId} downloaded successfully.`);
        await clearDownloadState();
      } else if (result) {
        throw new Error("Download failed with status " + result.status);
      }
    } catch (e: any) {
      if (e.message?.includes('cancelled') || e.message?.includes('paused')) {
        // Handled by pause/cancel functions
      } else {
        console.error("Download error", e);
        await updateNotification(downloadState.progress, modelId, 'failed');
        Alert.alert("Error", "Failed to download model. Check your internet connection.");
        setDownloadState(prev => ({ ...prev, isDownloading: false }));
      }
    }
  };

  const pauseDownload = async () => {
    if (downloadResumableRef.current && downloadState.isDownloading) {
      try {
        const pauseResult = await downloadResumableRef.current.pauseAsync();
        const resumeData = pauseResult.resumeData;
        if (resumeData) {
          await AsyncStorage.setItem(RESUME_DATA_KEY, resumeData);
        }
        setDownloadState(prev => ({ ...prev, isDownloading: false, isPaused: true }));
        await updateNotification(downloadState.progress, downloadState.modelId!, 'paused');
      } catch (e) {
        console.error("Pause error", e);
      }
    }
  };

  const resumeDownload = async () => {
    if (downloadResumableRef.current && downloadState.isPaused) {
      const modelId = downloadState.modelId!;
      setDownloadState(prev => ({ ...prev, isDownloading: true, isPaused: false }));
      await updateNotification(downloadState.progress, modelId, 'downloading');
      
      try {
        const result = await downloadResumableRef.current.resumeAsync();
        if (result && result.status === 200) {
          setDownloadedModels(prev => [...prev, modelId]);
          await updateNotification(1, modelId, 'completed');
          Alert.alert("Success", `Model ${modelId} downloaded successfully.`);
          await clearDownloadState();
        } else if (result) {
          throw new Error("Download failed with status " + result.status);
        }
      } catch (e: any) {
        if (!e.message?.includes('cancelled') && !e.message?.includes('paused')) {
          console.error("Resume error", e);
          await updateNotification(downloadState.progress, modelId, 'failed');
          Alert.alert("Error", "Failed to resume download.");
          setDownloadState(prev => ({ ...prev, isDownloading: false }));
        }
      }
    }
  };

  const cancelDownload = async () => {
    if (downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.cancelAsync();
        // Delete partial file if possible
        const fileName = `ggml-${downloadState.modelId}.bin`;
        const fileUri = MODELS_DIR + fileName;
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (e) {
        console.error("Cancel error", e);
      }
    }
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    await clearDownloadState();
  };

  const clearDownloadState = async () => {
    downloadResumableRef.current = null;
    setDownloadState({
      progress: 0,
      isDownloading: false,
      isPaused: false,
      modelId: null,
    });
    await AsyncStorage.removeItem(RESUME_DATA_KEY);
    await AsyncStorage.removeItem(DOWNLOADING_MODEL_KEY);
  };

  const deleteModel = async (modelId: string) => {
    const fileUri = MODELS_DIR + `ggml-${modelId}.bin`;
    try {
      await FileSystem.deleteAsync(fileUri);
      setDownloadedModels(prev => prev.filter(m => m !== modelId));
    } catch (e) {
      console.error("Delete error", e);
      throw e;
    }
  };

  return (
    <DownloadContext.Provider value={{
      downloadState,
      downloadModel,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      downloadedModels,
      checkDownloadedModels,
      deleteModel
    }}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};
