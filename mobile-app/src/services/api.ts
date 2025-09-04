import axios from 'axios';
import { Platform } from 'react-native';

// Dynamic IP configuration based on environment
const getApiBaseUrl = () => {
  // Try to use environment variable first
  if (process.env.EXPO_PUBLIC_API_IP) {
    return `http://${process.env.EXPO_PUBLIC_API_IP}:${process.env.EXPO_PUBLIC_API_PORT || '4000'}/api`;
  }
  
  // Fallback for different platforms
  if (__DEV__) {
    // For Expo Go on physical device, always use local IP
    return 'http://192.168.1.135:3001/api';
  }
  
  // Production URL
  return 'https://api.durent.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
});

// Log the API URL in development
if (__DEV__) {
  console.log('🔥 API Base URL:', API_BASE_URL);
  console.log('🔥 Platform:', Platform.OS);
  console.log('🔥 EXPO_PUBLIC_API_IP:', process.env.EXPO_PUBLIC_API_IP);
}

export default api;