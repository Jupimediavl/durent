import { Platform } from 'react-native';

// Function to get the current network IP dynamically
function getNetworkIP(): string {
  // For development, we'll use different strategies based on platform
  if (__DEV__) {
    // On iOS simulator, localhost works
    if (Platform.OS === 'ios' && isSimulator()) {
      return 'localhost';
    }
    
    // For Android emulator, use the special IP
    if (Platform.OS === 'android' && isEmulator()) {
      return '10.0.2.2';
    }
    
    // For physical devices, we need the actual IP
    // This should be set via environment variable or detected automatically
    return process.env.EXPO_PUBLIC_API_IP || 'localhost';
  }
  
  // For production, use your actual server
  return 'your-production-server.com';
}

function isSimulator(): boolean {
  // Check if running on iOS simulator
  return Platform.OS === 'ios' && (Platform as any).isPad === false && (Platform as any).isTVOS === false;
}

function isEmulator(): boolean {
  // Check if running on Android emulator
  return Platform.OS === 'android' && (Platform as any).isTV === false;
}

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3001';
const API_HOST = getNetworkIP();

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

// Export for debugging
export const NETWORK_CONFIG = {
  host: API_HOST,
  port: API_PORT,
  baseUrl: API_BASE_URL,
  platform: Platform.OS,
  isDev: __DEV__,
};