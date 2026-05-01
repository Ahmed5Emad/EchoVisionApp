import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import { Buffer } from 'buffer';

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

interface BluetoothContextType {
  isScanning: boolean;
  devices: Device[];
  connectedDevice: Device | null;
  error: string | null;
  scanDevices: () => Promise<void>;
  connectToDevice: (device: Device) => Promise<Device | null>;
  disconnect: () => Promise<void>;
  sendData: (data: string) => Promise<void>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

const manager = new BleManager();

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        setError('Location permission required for Bluetooth');
        return false;
      }

      if (Platform.Version >= 31) {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );

        if (
          bluetoothScanPermission !== PermissionsAndroid.RESULTS.GRANTED ||
          bluetoothConnectPermission !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          setError('Bluetooth permissions required');
          return false;
        }
      }
    }
    return true;
  };

  const scanDevices = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsScanning(true);
    setDevices([]);
    setError(null);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setError(error.message);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          if (prevDevices.find((d) => d.id === device.id)) return prevDevices;
          return [...prevDevices, device];
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  }, []);

  const connectToDevice = async (device: Device) => {
    try {
      manager.stopDeviceScan();
      setIsScanning(false);
      
      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(discovered);
      setError(null);
      return discovered;
    } catch (e: any) {
      console.error('Connection error:', e);
      setError(e.message);
      return null;
    }
  };

  const disconnect = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
  };

  const sendData = async (data: string) => {
    if (!connectedDevice) return;

    try {
      const base64Data = Buffer.from(data, 'utf-8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64Data
      );
    } catch (e: any) {
      console.error('Send error:', e);
      setError(e.message);
    }
  };

  return (
    <BluetoothContext.Provider value={{
      isScanning,
      devices,
      connectedDevice,
      error,
      scanDevices,
      connectToDevice,
      disconnect,
      sendData
    }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
};
